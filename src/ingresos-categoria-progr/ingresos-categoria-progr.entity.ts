import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('planEstrategicoInstitucional_estructuraprogramaticacbes')
export class IngresosCategoriaProgrEntity {
    @PrimaryGeneratedColumn() 
    id_estp:number;
    @Column()
    cod_prog:string;
    @Column()
    denominacion:string;
    @Column()
    corriente:number;
    @Column()
    inversion:number;
    @Column()
    total:number;
    @Column()
    estado:string;
    @Column()
    id_gestion_id:number;
    @Column()
    id_poa_id:number;

}
