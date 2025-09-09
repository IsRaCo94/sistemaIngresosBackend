import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('ingreso_tipo_rubros')
export class IngresoRubrosEntity {
    @PrimaryGeneratedColumn() 
    id_tipo_rubro:number;
    @Column()
    num_rubro:string;
    @Column()
    nombre:string;
    @Column()
    entidad_otorgante:string;
    @Column()
    baja:boolean

}
