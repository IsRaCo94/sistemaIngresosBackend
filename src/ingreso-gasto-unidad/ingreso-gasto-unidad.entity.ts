import { Entity, PrimaryGeneratedColumn,Column } from 'typeorm';

@Entity('planEstrategicoInstitucional_unidads')
export class IngresoGastoUnidadEntity {
    @PrimaryGeneratedColumn() 
    id_unidad:number;
    @Column({ type: "varchar", length: 50 })
      nombreUnidad: string;
}
