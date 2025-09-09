
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EgresosEntity } from './egresos.entity';
import { Repository } from 'typeorm';

@Injectable()
export class EgresosService {

    constructor(
        @InjectRepository(EgresosEntity)
    private readonly ingresoRepository:Repository<EgresosEntity>
    ) {}

    async create(
        id_egresos: Partial<EgresosEntity>,
    ):Promise<EgresosEntity>{
        const nuevoIngreso=this.ingresoRepository.create(id_egresos);
        return await this.ingresoRepository.save(nuevoIngreso)
    }

    async findAll():Promise<EgresosEntity[]>{
        return await this.ingresoRepository.find()
    }

    async findOne(id_egresos: number): Promise<EgresosEntity | null> {
        return await this.ingresoRepository.findOneBy({ id_egresos });
      }
    async update(
        id_egresos: number,
        ingresoActualizado: Partial<EgresosEntity>,
      ): Promise<EgresosEntity> {
        await this.ingresoRepository.update(id_egresos, ingresoActualizado);
        const ingresoActualizadoDesdeDb = await this.ingresoRepository.findOneBy({
          id_egresos,
        });
        if (!ingresoActualizadoDesdeDb) {
          throw new NotFoundException(
            `No se pudo encontrar el insumo con ID ${id_egresos} después de la actualización.`,
          );
        }
        return ingresoActualizadoDesdeDb;
      }

    async borradologico(id_egresos: number): Promise<{ deleted: boolean; message?: string }> {
    const ingresoToUpdate = await this.ingresoRepository.findOne({
      where: { id_egresos }, 
    });
    if (!ingresoToUpdate) {
      throw new NotFoundException(`Ingreso con ID ${id_egresos} no encontrado.`);
    }
    if (ingresoToUpdate.baja === true) {
      return { deleted: false, message: `Ingreso con ID ${id_egresos} ya estaba dado de baja lógicamente.` };
    }
    ingresoToUpdate.baja = true; 
    await this.ingresoRepository.save(ingresoToUpdate);
    return { deleted: true, message: `Ingreso con ID ${id_egresos} dado de baja lógicamente.` };
  }
      
}