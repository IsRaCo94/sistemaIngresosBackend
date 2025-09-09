
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IngresoCuentaEntity } from './ingreso-cuenta.entity';
import { Repository } from 'typeorm';

@Injectable()
export class IngresoCuentaService {
constructor(@InjectRepository(IngresoCuentaEntity)
private readonly cuentaRepository: Repository<IngresoCuentaEntity>) {}

    async create(
        id_cuenta: Partial<IngresoCuentaEntity>,
    ):Promise<IngresoCuentaEntity>{
        const nuevoIngreso=this.cuentaRepository.create(id_cuenta);
        return await this.cuentaRepository.save(nuevoIngreso)
    }

    async findAll():Promise<IngresoCuentaEntity[]>{
        return await this.cuentaRepository.find()
    }

    async findOne(id_cuenta: number): Promise<IngresoCuentaEntity | null> {
        return await this.cuentaRepository.findOneBy({ id_cuenta });
      }
    async update(
        id_cuenta: number,
        cuentaActualizada: Partial<IngresoCuentaEntity>,
      ): Promise<IngresoCuentaEntity> {
        await this.cuentaRepository.update(id_cuenta, cuentaActualizada);
        const cuentaActualizadoDesdeDb = await this.cuentaRepository.findOneBy({
          id_cuenta,
        });
        if (!cuentaActualizadoDesdeDb) {
          throw new NotFoundException(
            `No se pudo encontrar el insumo con ID ${id_cuenta} después de la actualización.`,
          );
        }
        return cuentaActualizadoDesdeDb;
      }

    async borradologico(id_cuenta: number): Promise<{ deleted: boolean; message?: string }> {
    const libretaToUpdate = await this.cuentaRepository.findOne({
      where: { id_cuenta }, 
    });
    if (!libretaToUpdate) {
      throw new NotFoundException(`Ingreso con ID ${id_cuenta} no encontrado.`);
    }
    if (libretaToUpdate.baja === true) {
      return { deleted: false, message: `Ingreso con ID ${id_cuenta} ya estaba dado de baja lógicamente.` };
    }
    libretaToUpdate.baja = true; 
    await this.cuentaRepository.save(libretaToUpdate);
    return { deleted: true, message: `Ingreso con ID ${id_cuenta} dado de baja lógicamente.` };
  }

}
