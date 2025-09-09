import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('egresos')
export class EgresosEntity {
    @PrimaryGeneratedColumn() 
    id_egresos:number;
    @Column()
    num_cheque:string;
    @Column()
    monto:number;
    @Column()
    fecha:Date;
    @Column()
    lugar:string;
    @Column()
    cod_prove:string;
    @Column()
    proveedor:string;
    @Column()
    estado:string;
    @Column()
    fecha_cobro:Date;
    @Column()
    cobrado:string;
    @Column()
    cerrado:string;
    @Column()
    observacion:string;
    @Column()
    id_empresa_id:number;
    @Column()
    baja:boolean; // 'true' = dado de baja, 'false' = activo
}
