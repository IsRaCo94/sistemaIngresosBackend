import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('observaciones')
export class GastosObservacionesEntity {
    @PrimaryGeneratedColumn() 
    id_observacion:number;
    @Column()
    observacion:string;
    @Column()
    baja:boolean;
}
