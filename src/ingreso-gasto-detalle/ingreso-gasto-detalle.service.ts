
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IngresoGastoDetalleEntity } from './ingreso-gasto-detalle.entity';
import { IngresoGastoEntity } from '../ingreso-gasto/ingreso-gasto.entity';
import { Repository } from 'typeorm';

@Injectable()
export class IngresoGastoDetalleService {
  certificacionRepository: any;

    constructor(
        @InjectRepository(IngresoGastoDetalleEntity) 
        private readonly detalleGastoRepository: Repository<IngresoGastoDetalleEntity>,
        @InjectRepository(IngresoGastoEntity)
        private readonly gastoRepository: Repository<IngresoGastoEntity>,
    ) {}

async create(
        id_gasto_det: Partial<IngresoGastoDetalleEntity>,
    ):Promise<IngresoGastoDetalleEntity>{
        console.log('=== BACKEND: Creando detalle ===');
        console.log('Datos recibidos - id_detalle:', id_gasto_det.id_detalle);
        console.log('Datos recibidos completos:', JSON.stringify(id_gasto_det, null, 2));
        
        // Buscar el gasto padre para copiar campos de usuario/fecha
        if (id_gasto_det.id_gasto_id) {
            const gastoPadre = await this.gastoRepository.findOne({
                where: { id_gasto: id_gasto_det.id_gasto_id }
            });
            
            if (gastoPadre) {
                // Copiar campos de usuario y fecha del gasto padre
                id_gasto_det.usuario_elaboro = gastoPadre.usuario_elaboro;
                id_gasto_det.fecha_elaboro = gastoPadre.fecha_elaboro;
                id_gasto_det.usuario_verifico = gastoPadre.usuario_verifico;
                id_gasto_det.fecha_verifico = gastoPadre.fecha_verifico;
                id_gasto_det.usuario_aprobo = gastoPadre.usuario_aprobo;
                id_gasto_det.fecha_aprobo = gastoPadre.fecha_aprobo;
            }
        }
        
        const nuevoDetalle=this.detalleGastoRepository.create(id_gasto_det);
        
        console.log('Detalle creado - id_detalle:', nuevoDetalle.id_detalle);
        
        const saved = await this.detalleGastoRepository.save(nuevoDetalle);
        
        console.log('Detalle guardado - id_detalle:', saved.id_detalle);
        console.log('=== FIN BACKEND ===');
        
        return saved;
    }

    async findAll():Promise<IngresoGastoDetalleEntity[]>{
        return await this.detalleGastoRepository.find()
    }

    async findOne(id_gasto_det: number): Promise<IngresoGastoDetalleEntity | null> {
        return await this.detalleGastoRepository.findOneBy({ id_gasto_det });
      }

    async findByGastoId(id_gasto: number): Promise<IngresoGastoDetalleEntity[]> {
        return await this.detalleGastoRepository.find({
          where: { 
            id_gasto_id: id_gasto,
            baja: false 
          },
        });
      }

    async update(
        id_gasto_det: number,
        detalleActualizado: Partial<IngresoGastoDetalleEntity>,
      ): Promise<IngresoGastoDetalleEntity> {
        // Buscar el detalle actual para obtener el id_gasto_id
        const detalleActual = await this.detalleGastoRepository.findOne({
            where: { id_gasto_det }
        });
        
        if (detalleActual && detalleActual.id_gasto_id) {
            // Buscar el gasto padre para copiar campos de usuario/fecha
            const gastoPadre = await this.gastoRepository.findOne({
                where: { id_gasto: detalleActual.id_gasto_id }
            });
            
            if (gastoPadre) {
                // Copiar campos de usuario y fecha del gasto padre
                detalleActualizado.usuario_elaboro = gastoPadre.usuario_elaboro;
                detalleActualizado.fecha_elaboro = gastoPadre.fecha_elaboro;
                detalleActualizado.usuario_verifico = gastoPadre.usuario_verifico;
                detalleActualizado.fecha_verifico = gastoPadre.fecha_verifico;
                detalleActualizado.usuario_aprobo = gastoPadre.usuario_aprobo;
                detalleActualizado.fecha_aprobo = gastoPadre.fecha_aprobo;
            }
        }
        
        await this.detalleGastoRepository.update(id_gasto_det, detalleActualizado);
        const detalleActualizadoDesdeDb = await this.detalleGastoRepository.findOneBy({
          id_gasto_det,
        });
        if (!detalleActualizadoDesdeDb) {
          throw new NotFoundException(
            `No se pudo encontrar el insumo con ID ${id_gasto_det} después de la actualización.`,
          );
        }
        return detalleActualizadoDesdeDb;
      }

    async borradologico(id_gasto_det: number): Promise<{ deleted: boolean; message?: string }> {
    const detalleToUpdate = await this.detalleGastoRepository.findOne({
      where: { id_gasto_det }, 
    });
    if (!detalleToUpdate) {
      throw new NotFoundException(`Ingreso con ID ${id_gasto_det} no encontrado.`);
    }
    if (detalleToUpdate.baja === true) {
      return { deleted: false, message: `Ingreso con ID ${id_gasto_det} ya estaba dado de baja lógicamente.` };
    }
    detalleToUpdate.baja = true; 
    await this.detalleGastoRepository.save(detalleToUpdate);
    return { deleted: true, message: `Ingreso con ID ${id_gasto_det} dado de baja lógicamente.` };
  }

  /**
   * Obtiene los datos del dashboard de ejecución de gastos
   * Muestra programado vs ejecutado por área organizacional
   */
  async getDashboardEjecucionGastos(): Promise<any> {
    try {
      // Primero verificar si la tabla existe
      const checkTableQuery = `
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'gastos_ejecucionPresu_det'
        );
      `;
      
      const tableExists = await this.detalleGastoRepository.query(checkTableQuery);
      
      if (!tableExists[0].exists) {
        console.error('La tabla gastos_ejecucionPresu_det no existe');
        return {
          datosPorArea: [],
          resumenGeneral: {
            total_programado_general: 0,
            total_ejecutado_general: 0,
            saldo_disponible_general: 0,
            total_registros_general: 0,
            porcentaje_ejecucion: 0
          }
        };
      }

      const query = `
        SELECT 
          area_organizacional,
          SUM(CASE WHEN programado IS NOT NULL THEN programado ELSE 0 END) as total_programado,
          SUM(CASE WHEN "costoTotal" IS NOT NULL THEN "costoTotal" ELSE 0 END) as total_ejecutado,
          SUM(CASE WHEN saldo IS NOT NULL THEN saldo ELSE 0 END) as saldo_disponible,
          COUNT(*) as total_registros
        FROM "gastos_ejecucionPresu_det" 
        WHERE baja = false
        GROUP BY area_organizacional
        ORDER BY total_programado DESC
      `;

      const result = await this.detalleGastoRepository.query(query);
      
      return {
        datosPorArea: result,
        resumenGeneral: await this.getResumenGeneral()
      };
    } catch (error) {
      console.error('Error en getDashboardEjecucionGastos:', error);
      return {
        datosPorArea: [],
        resumenGeneral: {
          total_programado_general: 0,
          total_ejecutado_general: 0,
          saldo_disponible_general: 0,
          total_registros_general: 0,
          porcentaje_ejecucion: 0
        }
      };
    }
  }

  /**
   * Obtiene el resumen general de la ejecución de gastos
   */
  async getResumenGeneral(): Promise<any> {
    try {
      const query = `
        SELECT 
          SUM(CASE WHEN programado IS NOT NULL THEN programado ELSE 0 END) as total_programado_general,
          SUM(CASE WHEN "costoTotal" IS NOT NULL THEN "costoTotal" ELSE 0 END) as total_ejecutado_general,
          SUM(CASE WHEN saldo IS NOT NULL THEN saldo ELSE 0 END) as saldo_disponible_general,
          COUNT(*) as total_registros_general,
          ROUND(
            CASE 
              WHEN SUM(CASE WHEN programado IS NOT NULL THEN programado ELSE 0 END) > 0 
              THEN (SUM(CASE WHEN "costoTotal" IS NOT NULL THEN "costoTotal" ELSE 0 END) * 100.0) / 
                   SUM(CASE WHEN programado IS NOT NULL THEN programado ELSE 0 END)
              ELSE 0 
            END, 2
          ) as porcentaje_ejecucion
        FROM "gastos_ejecucionPresu_det" 
        WHERE baja = false
      `;

      const result = await this.detalleGastoRepository.query(query);
      return result[0] || {
        total_programado_general: 0,
        total_ejecutado_general: 0,
        saldo_disponible_general: 0,
        total_registros_general: 0,
        porcentaje_ejecucion: 0
      };
    } catch (error) {
      console.error('Error en getResumenGeneral:', error);
      return {
        total_programado_general: 0,
        total_ejecutado_general: 0,
        saldo_disponible_general: 0,
        total_registros_general: 0,
        porcentaje_ejecucion: 0
      };
    }
  }

  /**
   * Obtiene la ejecución por partida presupuestaria
   */
  async getEjecucionPorPartida(): Promise<any> {
    const query = `
      SELECT 
        partida,
        SUM(CASE WHEN programado IS NOT NULL THEN programado ELSE 0 END) as total_programado,
        SUM(CASE WHEN "costoTotal" IS NOT NULL THEN "costoTotal" ELSE 0 END) as total_ejecutado,
        COUNT(*) as total_registros,
        ROUND(
          CASE 
            WHEN SUM(CASE WHEN programado IS NOT NULL THEN programado ELSE 0 END) > 0 
            THEN (SUM(CASE WHEN "costoTotal" IS NOT NULL THEN "costoTotal" ELSE 0 END) * 100.0) / 
                 SUM(CASE WHEN programado IS NOT NULL THEN programado ELSE 0 END)
            ELSE 0 
          END, 2
        ) as porcentaje_ejecucion
      FROM "gastos_ejecucionPresu_det" 
      WHERE baja = false AND partida IS NOT NULL AND partida != ''
      GROUP BY partida
      ORDER BY total_programado DESC
      LIMIT 10
    `;

    const result = await this.detalleGastoRepository.query(query);
    return result;
  }




}