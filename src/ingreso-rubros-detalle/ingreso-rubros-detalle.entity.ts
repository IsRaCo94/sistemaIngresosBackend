import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('ingreso_tipo_rubros_det')
export class IngresoRubrosDetalleEntity {
    @PrimaryGeneratedColumn() 
    id_detalle_rubro:number;
    @Column()
    servicio:string;
    @Column()
    baja:boolean
    @Column()
    id_rubro_id:number
    @Column()
    num_rubro:string
    @Column()
    nombre:string
}
