
import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IngresosEntity } from './ingresos.entity';
import { Repository } from 'typeorm';
import { join } from 'path';
import * as carbone from 'carbone';


@Injectable()
export class IngresosService {
  constructor(
    @InjectRepository(IngresosEntity)
    private readonly ingresoRepository: Repository<IngresosEntity>
  ) { }

  async create(
    id_ingresos: Partial<IngresosEntity>,
  ): Promise<IngresosEntity> {
    const nuevoIngreso = this.ingresoRepository.create(id_ingresos);
    return await this.ingresoRepository.save(nuevoIngreso)
  }

  async findAll(): Promise<IngresosEntity[]> {
    return await this.ingresoRepository.find()
  }

  async findOne(id_ingresos: number): Promise<IngresosEntity | null> {
    return await this.ingresoRepository.findOneBy({ id_ingresos });
  }
  async update(
    id_ingresos: number,
    ingresoActualizado: Partial<IngresosEntity>,
  ): Promise<IngresosEntity> {
    await this.ingresoRepository.update(id_ingresos, ingresoActualizado);
    const ingresoActualizadoDesdeDb = await this.ingresoRepository.findOneBy({
      id_ingresos,
    });
    if (!ingresoActualizadoDesdeDb) {
      throw new NotFoundException(
        `No se pudo encontrar el insumo con ID ${id_ingresos} después de la actualización.`,
      );
    }
    return ingresoActualizadoDesdeDb;
  }

  async borradologico(id_ingresos: number): Promise<{ deleted: boolean; message?: string }> {
    const ingresoToUpdate = await this.ingresoRepository.findOne({
      where: { id_ingresos },
    });
    if (!ingresoToUpdate) {
      throw new NotFoundException(`Ingreso con ID ${id_ingresos} no encontrado.`);
    }
    if (ingresoToUpdate.baja === true) {
      return { deleted: false, message: `Ingreso con ID ${id_ingresos} ya estaba dado de baja lógicamente.` };
    }
    ingresoToUpdate.baja = true;
    await this.ingresoRepository.save(ingresoToUpdate);
    return { deleted: true, message: `Ingreso con ID ${id_ingresos} dado de baja lógicamente.` };
  }

  async getNextNumDeposito(): Promise<number> {
    try {
      const result = await this.ingresoRepository
        .createQueryBuilder('ingresos')
        .select('MAX(ingresos.num_depo)', 'max')
        .where('ingresos.op_tipoemision = :value', { value: false })
        .getRawOne();

      const maxNum = result?.max ?? 0;
      return Number(maxNum) + 1;
    } catch (error) {
      console.error('Error fetching next num_depo:', error);
      throw new InternalServerErrorException('Error fetching next num_deposito');
    }
  }
  async getMaxNumFactura(): Promise<number | null> {
    try {
      const result = await this.ingresoRepository
        .createQueryBuilder('ingresos')
        .select('MAX(ingresos.num_factura)', 'max')
        .where('ingresos.op_tipoemision = :value', { value: true })
        .getRawOne();

      const maxNum = result?.max ?? 0;
      return Number(maxNum) + 1;
    } catch (error) {
      console.error('Error fetching next num_factura:', error);
      throw new InternalServerErrorException('Error fetching next num_deposito');
    }
  }

  async generateReport(fecha: string): Promise<Buffer> {
    // Se espera que la fecha venga en formato 'YYYY-MM-DD'
    const query = `
         SELECT
    fecha,
    lugar,
    fecha_reg,
    proveedor,
    detalle,
    tipo_ingres,
    monto,
    estado,
    SUM(monto) OVER () as total_montos
FROM ingresos
WHERE estado = 'CONSOLIDADO' AND baja = false AND CAST(fecha AS DATE) = '${fecha}'

ORDER BY fecha ASC`;

    const ingresosRaw = await this.ingresoRepository.query(query);
    let totalAcumulado = 0;
    let ultimoNumeroFormulario = 1000;
    const ingresos = ingresosRaw.map((item) => {
      if (

        !item.lugar ||
        !item.proveedor ||
        !item.detalle ||
        !item.tipo_ingres ||
        !item.fecha_reg ||
        item.monto == null

      ) {
        throw new Error('Invalid ingreso data: missing required fields');
      }

      totalAcumulado += Number(item.monto);

      return {
       fechaReporte: new Date().toLocaleDateString('es-ES'),
        total_montos: Number(item.total_montos),
        lugar: item.lugar,
        proveedor: item.proveedor,
        detalle: item.detalle,
        tipoIngreso: item.tipo_ingres,
        importe: Number(item.monto),
        totalAcumulado,
        montoOriginal: Number(item.monto),
        numeroFormulario: ultimoNumeroFormulario++,
        totalConsolidados: ingresosRaw.length,
        fecha2: new Date(item.fecha_reg).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }),
        fecha: new Date(item.fecha_reg).toLocaleDateString('es-ES', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      };
    });

    const templatePath = join(__dirname, '../../src/templates/ingresos-report.odt');
    console.log(ingresos);
    const montoOriginalTotal = totalAcumulado;
    const fecha1 = ingresos.length > 0 ? new Date(ingresos[0].fecha_reg).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : '';
    const fecha2 = ingresos.length > 0 ? new Date(ingresos[0].fecha_reg).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '';
    const totalConsolidados = ingresosRaw.length; 
    ultimoNumeroFormulario++;
    const numeroFormulario = ultimoNumeroFormulario;
    const data = {
      lugar: ingresos.length > 0 ? ingresos[0].lugar : '',
      fecha: new Date().toLocaleDateString(),
      fecha1,
      fecha2,
      numeroFormulario,
      totalConsolidados,
      montoOriginalTotal,
      ingresos: ingresos
    };
    const options = { convertTo: 'pdf' };
    return new Promise<Buffer>((resolve, reject) => {
      carbone.render(templatePath, data, options, (err, result) => {
        if (err) {
          return reject(err);
        }
        resolve(result);
      });
    });
  }
}