import { Injectable,NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { GastosObservacionesEntity } from './gastos-observaciones.entity';
import { Repository } from 'typeorm';
@Injectable()
export class GastosObservacionesService {

    constructor(@InjectRepository(GastosObservacionesEntity) 
    private readonly gastosObservacionesRepository: Repository<GastosObservacionesEntity>) {}
    async create(
        gastoObservacion: Partial<GastosObservacionesEntity>,
    ):Promise<GastosObservacionesEntity>{
        const nuevaObservacion=this.gastosObservacionesRepository.create(gastoObservacion);
        return await this.gastosObservacionesRepository.save(nuevaObservacion)
    }
    async findAll():Promise<GastosObservacionesEntity[]>{
        return await this.gastosObservacionesRepository.find()
    }
    async findOne(id_observacion: number): Promise<GastosObservacionesEntity | null> {
        return await this.gastosObservacionesRepository.findOneBy({ id_observacion });
      }
    async update(
        id_observacion: number,
        observacionActualizada: Partial<GastosObservacionesEntity>,
      ): Promise<GastosObservacionesEntity> {
        await this.gastosObservacionesRepository.update(id_observacion, observacionActualizada);
        const observacionActualizadoDesdeDb = await this.gastosObservacionesRepository.findOneBy({
          id_observacion,
        });
        return observacionActualizadoDesdeDb!;
      }
    async borradologico(id_observacion: number): Promise<{ deleted: boolean; message?: string }> {
        const observacionToUpdate = await this.gastosObservacionesRepository.findOne({
          where: { id_observacion }, 
        });
        if (!observacionToUpdate) {
          throw new NotFoundException(`Observacion con ID ${id_observacion} no encontrado.`);
        }
        if (observacionToUpdate.baja === true) {
          return { deleted: false, message: `Observacion con ID ${id_observacion} ya estaba dado de baja lógicamente.` };
        }
        observacionToUpdate.baja = true; 
        await this.gastosObservacionesRepository.save(observacionToUpdate);
        return { deleted: true, message: `Observacion con ID ${id_observacion} dado de baja lógicamente.` };
      }

    }