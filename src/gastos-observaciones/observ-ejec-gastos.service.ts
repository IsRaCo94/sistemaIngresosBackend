import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ObservEjecGastosEntity } from './observ-ejec-gastos.entity';
import { Repository } from 'typeorm';

@Injectable()
export class ObservEjecGastosService {
    constructor(
        @InjectRepository(ObservEjecGastosEntity)
        private readonly observEjecGastosRepository: Repository<ObservEjecGastosEntity>
    ) {}

    async create(observaciones: Partial<ObservEjecGastosEntity>[]): Promise<ObservEjecGastosEntity[]> {
        // Primero eliminar observaciones existentes del mismo gasto
        if (observaciones.length > 0 && observaciones[0].id_gasto) {
            await this.observEjecGastosRepository.delete({ id_gasto: observaciones[0].id_gasto });
        }
        
        // Crear y guardar las nuevas observaciones
        const nuevasObservaciones = observaciones.map(obs => 
            this.observEjecGastosRepository.create(obs)
        );
        
        return await this.observEjecGastosRepository.save(nuevasObservaciones);
    }

    async findByGasto(id_gasto: number): Promise<ObservEjecGastosEntity[]> {
        return await this.observEjecGastosRepository.find({
            where: { id_gasto },
            relations: ['observacionEntity']
        });
    }

    async deleteByGastoAndObservacion(id_gasto: number, id_observacion: number): Promise<void> {
        await this.observEjecGastosRepository.delete({ id_gasto, id_observacion });
    }

    async deleteByGasto(id_gasto: number): Promise<void> {
        await this.observEjecGastosRepository.delete({ id_gasto });
    }
}
