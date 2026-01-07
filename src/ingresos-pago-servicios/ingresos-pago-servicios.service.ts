
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IngresosPagoServiciosEntity } from './ingresos-pago-servicios.entity';
import { Repository } from 'typeorm';

@Injectable()
export class IngresosPagoServiciosService {

    constructor(@InjectRepository(IngresosPagoServiciosEntity) 
private readonly pagoServiciosRepository: Repository<IngresosPagoServiciosEntity>) { }
async create(
    id_tipo_rubro: Partial<IngresosPagoServiciosEntity>,
):Promise<IngresosPagoServiciosEntity>{
    const nuevoIngreso=this.pagoServiciosRepository.create(id_tipo_rubro);
    return await this.pagoServiciosRepository.save(nuevoIngreso)
}
async findAll():Promise<IngresosPagoServiciosEntity[]>{
    return await this.pagoServiciosRepository.find()
}

async findOne(id_servicio: number): Promise<IngresosPagoServiciosEntity | null> {
    return await this.pagoServiciosRepository.findOneBy({ id_servicio });
  }
async update(
    id_servicio: number,
    servicioActualizada: Partial<IngresosPagoServiciosEntity>,
  ): Promise<IngresosPagoServiciosEntity> {
    await this.pagoServiciosRepository.update(id_servicio, servicioActualizada);
    const rubroActualizadoDesdeDb = await this.pagoServiciosRepository.findOneBy({
        id_servicio,
    });
    if (!rubroActualizadoDesdeDb) {
      throw new NotFoundException(
        `No se pudo encontrar el insumo con ID ${id_servicio} después de la actualización.`,
      );
    }
    return rubroActualizadoDesdeDb;
  }

async borradologico(id_servicio: number): Promise<{ deleted: boolean; message?: string }> {
const servicioToUpdate = await this.pagoServiciosRepository.findOne({
  where: { id_servicio }, 
});
if (!servicioToUpdate) {
  throw new NotFoundException(`Ingreso con ID ${id_servicio} no encontrado.`);
}
if (servicioToUpdate.baja === true) {
  return { deleted: false, message: `Ingreso con ID ${id_servicio} ya estaba dado de baja lógicamente.` };
}
servicioToUpdate.baja = true; 
await this.pagoServiciosRepository.save(servicioToUpdate);
return { deleted: true, message: `Ingreso con ID ${id_servicio} dado de baja lógicamente.` };
}
}
