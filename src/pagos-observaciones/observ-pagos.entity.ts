import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { GastosObservacionesEntity } from '../gastos-observaciones/gastos-observaciones.entity';
import { IngresosGastoPagoEntity } from '../ingresos-gasto-pago/ingresos-gasto-pago.entity';

@Entity('observ_pagos')
export class ObservPagosEntity {
    @PrimaryColumn()
    id_observacion: number;

    @Column({ type: 'varchar', nullable: true })
    observacion: string;

    @Column({ type: 'varchar', nullable: true })
    detalle: string;

    @PrimaryColumn()
    id_pago: number;

    @Column({ type: 'varchar', length: 255, nullable: true })
    num_prev: string;

    @ManyToOne(() => GastosObservacionesEntity)
    @JoinColumn({ name: 'id_observacion' })
    observacionEntity: GastosObservacionesEntity;

    @ManyToOne(() => IngresosGastoPagoEntity)
    @JoinColumn({ name: 'id_pago' })
    pagoEntity: IngresosGastoPagoEntity;
}
