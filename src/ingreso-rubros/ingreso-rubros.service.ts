
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IngresoRubrosEntity } from './ingreso-rubros.entity';
import { Repository } from 'typeorm/repository/Repository';

@Injectable()
export class IngresoRubrosService{

    constructor(@InjectRepository(IngresoRubrosEntity) 
    private readonly rubrosRepository: Repository<IngresoRubrosEntity>) {}
 async create(
        id_tipo_rubro: Partial<IngresoRubrosEntity>,
    ):Promise<IngresoRubrosEntity>{
        const nuevoIngreso=this.rubrosRepository.create(id_tipo_rubro);
        return await this.rubrosRepository.save(nuevoIngreso)
    }

    async findAll():Promise<IngresoRubrosEntity[]>{
        return await this.rubrosRepository.find()
    }

    async findOne(id_tipo_rubro: number): Promise<IngresoRubrosEntity | null> {
        return await this.rubrosRepository.findOneBy({ id_tipo_rubro });
      }
    async update(
        id_tipo_rubro: number,
        rubroActualizada: Partial<IngresoRubrosEntity>,
      ): Promise<IngresoRubrosEntity> {
        await this.rubrosRepository.update(id_tipo_rubro, rubroActualizada);
        const rubroActualizadoDesdeDb = await this.rubrosRepository.findOneBy({
          id_tipo_rubro,
        });
        if (!rubroActualizadoDesdeDb) {
          throw new NotFoundException(
            `No se pudo encontrar el insumo con ID ${id_tipo_rubro} después de la actualización.`,
          );
        }
        return rubroActualizadoDesdeDb;
      }

    async borradologico(id_tipo_rubro: number): Promise<{ deleted: boolean; message?: string }> {
    const libretaToUpdate = await this.rubrosRepository.findOne({
      where: { id_tipo_rubro }, 
    });
    if (!libretaToUpdate) {
      throw new NotFoundException(`Ingreso con ID ${id_tipo_rubro} no encontrado.`);
    }
    if (libretaToUpdate.baja === true) {
      return { deleted: false, message: `Ingreso con ID ${id_tipo_rubro} ya estaba dado de baja lógicamente.` };
    }
    libretaToUpdate.baja = true; 
    await this.rubrosRepository.save(libretaToUpdate);
    return { deleted: true, message: `Ingreso con ID ${id_tipo_rubro} dado de baja lógicamente.` };
  }
}
