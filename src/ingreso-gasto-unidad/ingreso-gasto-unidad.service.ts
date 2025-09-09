
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IngresoGastoUnidadEntity } from './ingreso-gasto-unidad.entity';
import { Repository } from 'typeorm';

@Injectable()
export class IngresoGastoUnidadService {

    constructor(
        @InjectRepository(IngresoGastoUnidadEntity)
        private readonly unidadRepository: Repository<IngresoGastoUnidadEntity>,
    ) { }

    async create(
        id_unidad: Partial<IngresoGastoUnidadEntity>,
    ): Promise<IngresoGastoUnidadEntity> {
        const nuevoUnidad = this.unidadRepository.create(id_unidad);
        return await this.unidadRepository.save(nuevoUnidad);
    }

      async findAll(): Promise<IngresoGastoUnidadEntity[]> {
        return await this.unidadRepository.find();

      }

    async findOneUnidad(): Promise<{ nombreUnidad: string }> {
        const unidad = await this.unidadRepository.findOne({
            select: ['nombreUnidad'],
            where: { id_unidad: 10 },
        });

        if (!unidad) {
            throw new NotFoundException('Unidad no encontrada');
        }
        return { nombreUnidad: unidad.nombreUnidad }; // wrap in object
    }

    async findOne(id_unidad: number): Promise<IngresoGastoUnidadEntity | null> {
        // ¡Cambia el tipo de retorno aquí!
        return await this.unidadRepository.findOneBy({ id_unidad });
    }

}
