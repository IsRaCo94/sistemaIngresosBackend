import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IngresosPagoPresupuestoEntity } from './ingresos-pago-presupuesto.entity';
import { Repository } from 'typeorm';

@Injectable()
export class IngresosPagoPresupuestoService{

    constructor(@InjectRepository(IngresosPagoPresupuestoEntity) 
        private presupuestoRepository: Repository<IngresosPagoPresupuestoEntity>) {
        
    }
     async create(
        id_gasto_det: Partial<IngresosPagoPresupuestoEntity>): 
        Promise<IngresosPagoPresupuestoEntity> {
        const nuevoPresupuesto = this.presupuestoRepository.create(id_gasto_det);
        return this.presupuestoRepository.save(nuevoPresupuesto);
    }
    async findAll(): Promise<IngresosPagoPresupuestoEntity[]> {
        return this.presupuestoRepository.find();
    }
    async findOne(num_prev: string): Promise<IngresosPagoPresupuestoEntity[]> {
        return this.presupuestoRepository.find({ where: { num_prev } });
    }

}
