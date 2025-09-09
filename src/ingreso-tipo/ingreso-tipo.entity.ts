import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('ingreso_tipo')
export class IngresoTipoEntity {
    @PrimaryGeneratedColumn() 
    id_tipo_ingr:number;

    @Column()
    tipo_ingr:string;

    @Column()
    baja:boolean
}
