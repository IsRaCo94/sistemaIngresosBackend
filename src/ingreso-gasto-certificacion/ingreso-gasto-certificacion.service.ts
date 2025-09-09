import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IngresoGastoCertificacionEntity } from './ingreso-gasto-certificacion.entity';
import { Repository } from 'typeorm';

@Injectable()
export class IngresoGastoCertificacionService {

    constructor(
        @InjectRepository(IngresoGastoCertificacionEntity)
        private readonly certificacionRepository: Repository<IngresoGastoCertificacionEntity>) { }

    async create(
        id_certificacion: Partial<IngresoGastoCertificacionEntity>,
    ): Promise<IngresoGastoCertificacionEntity> {
        const nuevoCertificacion = this.certificacionRepository.create(id_certificacion);
        return await this.certificacionRepository.save(nuevoCertificacion);
    }

    async findAll(): Promise<IngresoGastoCertificacionEntity[]> {
        return await this.certificacionRepository.find({
            where: { estadoCertificacion: 'Aprobado' }
        });
    }

  async findOne(id_certificacion: number): Promise<IngresoGastoCertificacionEntity | null> {
    return await this.certificacionRepository.findOne({
        where: {
            id_certificacion,
            estadoCertificacion: 'Aprobado',
        },
    });
}

}

