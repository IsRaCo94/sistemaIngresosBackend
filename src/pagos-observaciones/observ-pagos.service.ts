import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ObservPagosEntity } from './observ-pagos.entity';
import { Repository } from 'typeorm';

@Injectable()
export class ObservPagosService {
    constructor(
        @InjectRepository(ObservPagosEntity)
        private readonly observPagosRepository: Repository<ObservPagosEntity>
    ) {}

    async create(observaciones: Partial<ObservPagosEntity>[]): Promise<ObservPagosEntity[]> {
        // Primero eliminar observaciones existentes del mismo pago
        if (observaciones.length > 0 && observaciones[0].id_pago) {
            await this.observPagosRepository.delete({ id_pago: observaciones[0].id_pago });
        }
        
        // Crear y guardar las nuevas observaciones
        const nuevasObservaciones = observaciones.map(obs => 
            this.observPagosRepository.create(obs)
        );
        
        return await this.observPagosRepository.save(nuevasObservaciones);
    }

    async findByPago(id_pago: number): Promise<ObservPagosEntity[]> {
        return await this.observPagosRepository.find({
            where: { id_pago },
            relations: ['observacionEntity']
        });
    }

    async deleteByPagoAndObservacion(id_pago: number, id_observacion: number): Promise<void> {
        await this.observPagosRepository.delete({ id_pago, id_observacion });
    }

    async findAll(): Promise<ObservPagosEntity[]> {
        return await this.observPagosRepository.find({
            relations: ['observacionEntity', 'pagoEntity']
        });
    }
}
