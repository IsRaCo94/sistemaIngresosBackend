import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('ingresos_det')
export class IngresosDetalleEntity {
    @PrimaryGeneratedColumn() 
    id_ingreso_det:number;
    @Column()
    id_ingresos_id:number;
    @Column()
    lugar:string;
    @Column()
    proveedor:string;
    @Column()
    estado:string;
    @Column()
    tipo_ingreso:string;
    @Column()
    cerrado:string;
    @Column()
    fecha:string;
    @Column()
    fecha_reg:string;
    @Column()
    monto:number;
    @Column()
    baja:boolean
}
