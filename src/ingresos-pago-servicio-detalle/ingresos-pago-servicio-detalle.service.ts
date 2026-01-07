import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IngresosPagoServicioDetalleEntity } from './ingresos-pago-servicio-detalle.entity';
import { Repository } from 'typeorm';

@Injectable()
export class IngresosPagoServicioDetalleService {

    constructor(@InjectRepository(IngresosPagoServicioDetalleEntity) 
    private readonly pagosServicioDetalleRepository: Repository<IngresosPagoServicioDetalleEntity>,) {}

    async create(
        id_pagos_serv_det: Partial<IngresosPagoServicioDetalleEntity>,
    ):Promise<IngresosPagoServicioDetalleEntity>{
        const nuevoIngreso=this.pagosServicioDetalleRepository.create(id_pagos_serv_det);
        return await this.pagosServicioDetalleRepository.save(nuevoIngreso)
    }
    async findAll():Promise<IngresosPagoServicioDetalleEntity[]>{
        return await this.pagosServicioDetalleRepository.find()
    }
    
    async findOne(id_pagos_serv_det: number): Promise<IngresosPagoServicioDetalleEntity | null> {
        return await this.pagosServicioDetalleRepository.findOneBy({ id_pagos_serv_det });
      }
    async update(
        id_pagos_serv_det: number,
        servicioActualizada: Partial<IngresosPagoServicioDetalleEntity>,
      ): Promise<IngresosPagoServicioDetalleEntity> {
        await this.pagosServicioDetalleRepository.update(id_pagos_serv_det, servicioActualizada);
        const rubroActualizadoDesdeDb = await this.pagosServicioDetalleRepository.findOneBy({
            id_pagos_serv_det,
        });
        if (!rubroActualizadoDesdeDb) {
          throw new NotFoundException(
            `No se pudo encontrar el insumo con ID ${id_pagos_serv_det} después de la actualización.`,
          );
        }
        return rubroActualizadoDesdeDb;
      }
    
    async borradologico(id_pagos_serv_det: number): Promise<{ deleted: boolean; message?: string }> {
    const servicioToUpdate = await this.pagosServicioDetalleRepository.findOne({
      where: { id_pagos_serv_det }, 
    });
    if (!servicioToUpdate) {
      throw new NotFoundException(`Ingreso con ID ${id_pagos_serv_det} no encontrado.`);
    }
    if (servicioToUpdate.baja === true) {
      return { deleted: false, message: `Ingreso con ID ${id_pagos_serv_det} ya estaba dado de baja lógicamente.` };
    }
    servicioToUpdate.baja = true; 
    await this.pagosServicioDetalleRepository.save(servicioToUpdate);
    return { deleted: true, message: `Ingreso con ID ${id_pagos_serv_det} dado de baja lógicamente.` };
    }
}
