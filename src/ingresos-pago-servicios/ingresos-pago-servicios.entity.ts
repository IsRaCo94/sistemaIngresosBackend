import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('pagos_servicios')
export class IngresosPagoServiciosEntity {
    @PrimaryGeneratedColumn() 
   
    id_servicio:number;
    @Column()
    servicio:string;
    @Column()
    descripcion:string;
    @Column()
    baja:boolean;
}
