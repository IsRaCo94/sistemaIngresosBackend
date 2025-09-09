import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('ingreso_persona')
export class IngresoPersonaEntity {
    
    @PrimaryGeneratedColumn() 
    id_persona:number;
    @Column()
    nombre:string;
    @Column()
    carnet:string;
    @Column()
    exp: string;
    @Column()
    baja:boolean;


}
