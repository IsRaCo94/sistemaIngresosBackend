import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('libreta_origen')
export class LibretaOrigenEntity {
    @PrimaryGeneratedColumn() 
    id_libreta:number;
    @Column()   
    des_libreta:string
    @Column()
    des_corta_libreta:string
    @Column()
    libreta:number
    @Column()
    baja:boolean
}
