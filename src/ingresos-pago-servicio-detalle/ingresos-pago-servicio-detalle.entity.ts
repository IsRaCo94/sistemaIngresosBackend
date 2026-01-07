import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('pagos_servicios_det')
export class IngresosPagoServicioDetalleEntity {
    @PrimaryGeneratedColumn() 
    id_pagos_serv_det:number;
    @Column()
    especialidad:string;
    @Column()
    servicio:string;
    @Column()
    id_pagos_servicios:number;
    @Column()
    baja:boolean;

}
