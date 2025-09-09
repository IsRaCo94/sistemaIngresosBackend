
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LibretaOrigenEntity } from './libreta-origen.entity';
import { Repository } from 'typeorm';

@Injectable()
export class LibretaOrigenService {

    constructor(@InjectRepository(LibretaOrigenEntity)
private readonly libretaRepository: Repository<LibretaOrigenEntity>) {}
    async create(
        id_libreta: Partial<LibretaOrigenEntity>,
    ):Promise<LibretaOrigenEntity>{
        const nuevoIngreso=this.libretaRepository.create(id_libreta);
        return await this.libretaRepository.save(nuevoIngreso)
    }

    async findAll():Promise<LibretaOrigenEntity[]>{
        return await this.libretaRepository.find()
    }

    async findOne(id_libreta: number): Promise<LibretaOrigenEntity | null> {
        return await this.libretaRepository.findOneBy({ id_libreta });
      }
    async update(
        id_libreta: number,
        libretaActualizada: Partial<LibretaOrigenEntity>,
      ): Promise<LibretaOrigenEntity> {
        await this.libretaRepository.update(id_libreta, libretaActualizada);
        const libretaActualizadoDesdeDb = await this.libretaRepository.findOneBy({
          id_libreta,
        });
        if (!libretaActualizadoDesdeDb) {
          throw new NotFoundException(
            `No se pudo encontrar el insumo con ID ${id_libreta} después de la actualización.`,
          );
        }
        return libretaActualizadoDesdeDb;
      }

    async borradologico(id_libreta: number): Promise<{ deleted: boolean; message?: string }> {
    const libretaToUpdate = await this.libretaRepository.findOne({
      where: { id_libreta }, 
    });
    if (!libretaToUpdate) {
      throw new NotFoundException(`Ingreso con ID ${id_libreta} no encontrado.`);
    }
    if (libretaToUpdate.baja === true) {
      return { deleted: false, message: `Ingreso con ID ${id_libreta} ya estaba dado de baja lógicamente.` };
    }
    libretaToUpdate.baja = true; 
    await this.libretaRepository.save(libretaToUpdate);
    return { deleted: true, message: `Ingreso con ID ${id_libreta} dado de baja lógicamente.` };
  }

}
