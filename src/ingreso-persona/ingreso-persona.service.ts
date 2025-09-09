
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IngresoPersonaEntity } from './ingreso-persona.entity';
import { Repository } from 'typeorm';

@Injectable()
export class IngresoPersonaService {
  constructor(@InjectRepository(IngresoPersonaEntity)
private readonly personaRepository: Repository<IngresoPersonaEntity>) {}

    async create(
        id_persona: Partial<IngresoPersonaEntity>,
    ):Promise<IngresoPersonaEntity>{
        const nuevoIngreso=this.personaRepository.create(id_persona);
        return await this.personaRepository.save(nuevoIngreso)
    }

    async findAll():Promise<IngresoPersonaEntity[]>{
        return await this.personaRepository.find()
    }

    async findOne(id_persona: number): Promise<IngresoPersonaEntity | null> {
        return await this.personaRepository.findOneBy({ id_persona });
      }
    async update(
        id_persona: number,
        personaActualizada: Partial<IngresoPersonaEntity>,
      ): Promise<IngresoPersonaEntity> {
        await this.personaRepository.update(id_persona, personaActualizada);
        const personaActualizadoDesdeDb = await this.personaRepository.findOneBy({
          id_persona,
        });
        if (!personaActualizadoDesdeDb) {
          throw new NotFoundException(
            `No se pudo encontrar el insumo con ID ${id_persona} después de la actualización.`,
          );
        }
        return personaActualizadoDesdeDb;
      }

    async borradologico(id_persona: number): Promise<{ deleted: boolean; message?: string }> {
    const libretaToUpdate = await this.personaRepository.findOne({
      where: { id_persona }, 
    });
    if (!libretaToUpdate) {
      throw new NotFoundException(`Ingreso con ID ${id_persona} no encontrado.`);
    }
    if (libretaToUpdate.baja === true) {
      return { deleted: false, message: `Ingreso con ID ${id_persona} ya estaba dado de baja lógicamente.` };
    }
    libretaToUpdate.baja = true; 
    await this.personaRepository.save(libretaToUpdate);
    return { deleted: true, message: `Ingreso con ID ${id_persona} dado de baja lógicamente.` };
  }
}
