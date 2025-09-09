
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IngresoGastoDetalleEntity } from './ingreso-gasto-detalle.entity';
import { Repository } from 'typeorm';

@Injectable()
export class IngresoGastoDetalleService {
  certificacionRepository: any;

    constructor(@InjectRepository(IngresoGastoDetalleEntity) 
private readonly detalleGastoRepository: Repository<IngresoGastoDetalleEntity>,) {}

async create(
        id_gasto_det: Partial<IngresoGastoDetalleEntity>,
    ):Promise<IngresoGastoDetalleEntity>{
        const nuevoDetalle=this.detalleGastoRepository.create(id_gasto_det);
        return await this.detalleGastoRepository.save(nuevoDetalle)
    }

    async findAll():Promise<IngresoGastoDetalleEntity[]>{
        return await this.detalleGastoRepository.find()
    }

    async findOne(id_gasto_det: number): Promise<IngresoGastoDetalleEntity | null> {
        return await this.detalleGastoRepository.findOneBy({ id_gasto_det });
      }
    async update(
        id_gasto_det: number,
        detalleActualizado: Partial<IngresoGastoDetalleEntity>,
      ): Promise<IngresoGastoDetalleEntity> {
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
}