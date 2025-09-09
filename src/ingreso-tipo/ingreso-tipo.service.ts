
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IngresoTipoEntity } from './ingreso-tipo.entity';
import { Repository } from 'typeorm';

@Injectable()
export class IngresoTipoService {

    constructor(
        @InjectRepository(IngresoTipoEntity)
        private readonly TipoIngresoRepository: Repository<IngresoTipoEntity>) { }

    async create(
        id_tipo_ingr: Partial<IngresoTipoEntity>,
    ): Promise<IngresoTipoEntity> {
        const nuevoIngreso = this.TipoIngresoRepository.create(id_tipo_ingr);
        return await this.TipoIngresoRepository.save(nuevoIngreso);
    }

    async findAll(): Promise<IngresoTipoEntity[]> {
        return await this.TipoIngresoRepository.find();
    }

    async findOne(id_tipo_ingr: number): Promise<IngresoTipoEntity | null> {
        // ¡Cambia el tipo de retorno aquí!
        return await this.TipoIngresoRepository.findOneBy({ id_tipo_ingr });
    }

}
