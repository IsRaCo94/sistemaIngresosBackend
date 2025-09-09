
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IngresoRubrosDetalleEntity } from './ingreso-rubros-detalle.entity';
import { Repository } from 'typeorm';

@Injectable()
export class IngresoRubrosDetalleService {

    constructor(@InjectRepository(IngresoRubrosDetalleEntity) 
private readonly detalleRubrosRepository: Repository<IngresoRubrosDetalleEntity>) {}

 async create(
        id_detalle_rubro: Partial<IngresoRubrosDetalleEntity>,
    ):Promise<IngresoRubrosDetalleEntity>{
        const nuevoIngreso=this.detalleRubrosRepository.create(id_detalle_rubro);
        return await this.detalleRubrosRepository.save(nuevoIngreso)
    }

    async findAll():Promise<IngresoRubrosDetalleEntity[]>{
        return await this.detalleRubrosRepository.find()
    }

    async findOne(id_detalle_rubro: number): Promise<IngresoRubrosDetalleEntity | null> {
        return await this.detalleRubrosRepository.findOneBy({ id_detalle_rubro });
      }
    async update(
        id_detalle_rubro: number,
        rubroActualizada: Partial<IngresoRubrosDetalleEntity>,
      ): Promise<IngresoRubrosDetalleEntity> {
        await this.detalleRubrosRepository.update(id_detalle_rubro, rubroActualizada);
        const rubroActualizadoDesdeDb = await this.detalleRubrosRepository.findOneBy({
          id_detalle_rubro,
        });
        if (!rubroActualizadoDesdeDb) {
          throw new NotFoundException(
            `No se pudo encontrar el insumo con ID ${id_detalle_rubro} después de la actualización.`,
          );
        }
        return rubroActualizadoDesdeDb;
      }

    async borradologico(id_detalle_rubro: number): Promise<{ deleted: boolean; message?: string }> {
    const rubroToUpdate = await this.detalleRubrosRepository.findOne({
      where: { id_detalle_rubro }, 
    });
    if (!rubroToUpdate) {
      throw new NotFoundException(`Ingreso con ID ${id_detalle_rubro} no encontrado.`);
    }
    if (rubroToUpdate.baja === true) {
      return { deleted: false, message: `Ingreso con ID ${id_detalle_rubro} ya estaba dado de baja lógicamente.` };
    }
    rubroToUpdate.baja = true; 
    await this.detalleRubrosRepository.save(rubroToUpdate);
    return { deleted: true, message: `Ingreso con ID ${id_detalle_rubro} dado de baja lógicamente.` };
  }
}
