import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IngresoGastoCertificacionEntity } from './ingreso-gasto-certificacion.entity';
import { IngresoGastoCertificacionCabeceraEntity } from './ingreso-gasto-certificacion-cabecera.entity';
import { Repository } from 'typeorm';

@Injectable()
export class IngresoGastoCertificacionService {

    constructor(
        @InjectRepository(IngresoGastoCertificacionEntity)
        private readonly certificacionRepository: Repository<IngresoGastoCertificacionEntity>,
        @InjectRepository(IngresoGastoCertificacionCabeceraEntity)
        private readonly certificacionCabeceraRepository: Repository<IngresoGastoCertificacionCabeceraEntity>
    ) { }



    async findAll(): Promise<IngresoGastoCertificacionEntity[]> {
        return await this.certificacionRepository
            .createQueryBuilder('detalle')
            .innerJoinAndSelect('detalle.certificacionCabecera', 'cabecera')
            .where('cabecera.estadoCertificacion = :estado', { estado: 'Aprobado' })
            .getMany();
    }

    async findOne(numeroCertificacion: string): Promise<IngresoGastoCertificacionEntity[] | null> {
        return await this.certificacionRepository
                .createQueryBuilder('detalle')
                .innerJoinAndSelect('detalle.certificacionCabecera', 'cabecera')
                .where('cabecera.numeroCertificacion = :num', { num: numeroCertificacion })
                .andWhere('cabecera.estadoCertificacion = :estado', { estado: 'Aprobado' })
                .getMany();
}

}