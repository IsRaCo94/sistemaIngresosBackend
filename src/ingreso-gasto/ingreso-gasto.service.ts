
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IngresoGastoEntity } from './ingreso-gasto.entity';
import { Repository } from 'typeorm';

@Injectable()
export class IngresoGastoService  {
  certificacionRepository: any;
    constructor(@InjectRepository(IngresoGastoEntity) 
private readonly ingresoGastoRepository: Repository<IngresoGastoEntity>,

) {}

async create(
        id_gasto: Partial<IngresoGastoEntity>,
    ):Promise<IngresoGastoEntity>{
        const nuevoPago=this.ingresoGastoRepository.create(id_gasto);
        return await this.ingresoGastoRepository.save(nuevoPago)
    }



    async findAll():Promise<IngresoGastoEntity[]>{
        return await this.ingresoGastoRepository.find()
    }

    async findOne(id_gasto: number): Promise<IngresoGastoEntity | null> {
        return await this.ingresoGastoRepository.findOneBy({ id_gasto });
      }
    async update(
        id_gasto: number,
        pagoActualizado: Partial<IngresoGastoEntity>,
      ): Promise<IngresoGastoEntity> {
        await this.ingresoGastoRepository.update(id_gasto, pagoActualizado);
        const pagoActualizadoDesdeDb = await this.ingresoGastoRepository.findOneBy({
          id_gasto,
        });
        if (!pagoActualizadoDesdeDb) {
          throw new NotFoundException(
            `No se pudo encontrar el insumo con ID ${id_gasto} después de la actualización.`,
          );
        }
        return pagoActualizadoDesdeDb;
      }

    async borradologico(id_gasto: number): Promise<{ deleted: boolean; message?: string }> {
    const pagoToUpdate = await this.ingresoGastoRepository.findOne({
      where: { id_gasto }, 
    });
    if (!pagoToUpdate) {
      throw new NotFoundException(`Ingreso con ID ${id_gasto} no encontrado.`);
    }
    if (pagoToUpdate.baja === true) {
      return { deleted: false, message: `Ingreso con ID ${id_gasto} ya estaba dado de baja lógicamente.` };
    }
    pagoToUpdate.baja = true; 
    await this.ingresoGastoRepository.save(pagoToUpdate);
    return { deleted: true, message: `Ingreso con ID ${id_gasto} dado de baja lógicamente.` };
  }


  
}
