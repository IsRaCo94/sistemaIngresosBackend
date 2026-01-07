
import { Injectable,NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IngresosPagoVariosEntity } from './ingresos-pago-varios.entity';
import { Repository } from 'typeorm';
@Injectable()
export class IngresosPagoVariosService {

    constructor(@InjectRepository(IngresosPagoVariosEntity) 
   private readonly variosRepository: Repository<IngresosPagoVariosEntity>) {}
   
       async create(
           id_varios: Partial<IngresosPagoVariosEntity>,
       ):Promise<IngresosPagoVariosEntity>{
           const nuevoIngreso=this.variosRepository.create(id_varios);
           return await this.variosRepository.save(nuevoIngreso)
       }
   
       async findAll():Promise<IngresosPagoVariosEntity[]>{
           return await this.variosRepository.find()
       }
   
       async findOne(id_varios: number): Promise<IngresosPagoVariosEntity | null> {
           return await this.variosRepository.findOneBy({ id_varios });
         }
       async update(
           id_varios: number,
           personaActualizada: Partial<IngresosPagoVariosEntity>,
         ): Promise<IngresosPagoVariosEntity> {
           await this.variosRepository.update(id_varios, personaActualizada);
           const personaActualizadoDesdeDb = await this.variosRepository.findOneBy({
             id_varios,
           });
           if (!personaActualizadoDesdeDb) {
             throw new NotFoundException(
               `No se pudo encontrar el insumo con ID ${id_varios} después de la actualización.`,
             );
           }
           return personaActualizadoDesdeDb;
         }
   
       async borradologico(id_varios: number): Promise<{ deleted: boolean; message?: string }> {
       const libretaToUpdate = await this.variosRepository.findOne({
         where: { id_varios }, 
       });
       if (!libretaToUpdate) {
         throw new NotFoundException(`Ingreso con ID ${id_varios} no encontrado.`);
       }
       if (libretaToUpdate.baja === true) {
         return { deleted: false, message: `Ingreso con ID ${id_varios} ya estaba dado de baja lógicamente.` };
       }
       libretaToUpdate.baja = true; 
       await this.variosRepository.save(libretaToUpdate);
       return { deleted: true, message: `Ingreso con ID ${id_varios} dado de baja lógicamente.` };
     }
}

