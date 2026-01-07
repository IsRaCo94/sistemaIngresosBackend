
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IngresosCategoriaProgrEntity } from './ingresos-categoria-progr.entity';
import { Repository } from 'typeorm';
@Injectable()
export class IngresosCategoriaProgrService {

    constructor(@InjectRepository(IngresosCategoriaProgrEntity) 
    private readonly ingresosCategoriaProgrRepository: Repository<IngresosCategoriaProgrEntity>) {}
 async findAll():Promise<IngresosCategoriaProgrEntity[]>{
        return await this.ingresosCategoriaProgrRepository.find()
    }

    async findOne(id_estp: number): Promise<IngresosCategoriaProgrEntity | null> {
        return await this.ingresosCategoriaProgrRepository.findOneBy({ id_estp });
      }
}
