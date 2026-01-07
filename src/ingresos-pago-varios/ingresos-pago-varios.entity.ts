import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('gastos_pagos_varios')
export class IngresosPagoVariosEntity {
    @PrimaryGeneratedColumn() 
    id_varios:number;
    @Column()
    id_gastos_pagos_det_id:number;
    @Column()
    num_prev:string;
    @Column()
    nombre:string;
    @Column()
    monto:number;
    @Column()
    baja:boolean;

}
