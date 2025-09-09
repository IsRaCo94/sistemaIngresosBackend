import { Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('IngresoGastoUnidad')
export class IngresoGastoUnidadEntity {
    @PrimaryGeneratedColumn() id:string;
}
