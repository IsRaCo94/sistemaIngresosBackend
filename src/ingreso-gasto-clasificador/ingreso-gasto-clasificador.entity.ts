import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('ingreso_clasif_gasto')
export class IngresoGastoClasificadorEntity {
    @PrimaryGeneratedColumn() 
    id_num_clasif: number;
    @Column()
    des_clasif: string;
  
}
