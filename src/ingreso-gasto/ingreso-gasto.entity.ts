import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('gastos_ejecucionPresu')
export class IngresoGastoEntity {
    @PrimaryGeneratedColumn()
    id_gasto: number;
    @Column()
    num_prev: string;
    @Column()
    num_comp: string;
    @Column()
    num_dev: string;
    @Column()
    num_pag: string;
    @Column()
    num_sec: string;
    @Column()
    entidad: string;
    @Column()
    unidad: string;
    @Column()
    tipo_doc: string;
    @Column()
    tipo_ejec: string;
    @Column()   
    tipo_impu: boolean;
    @Column()
    regularizacion: string;
    @Column()
    fechaElab: Date;
    @Column()
    estado: string;
    @Column()
    glosa: string;
    @Column()
    moneda: string;
    @Column()
    preventivo: boolean;
    @Column()
    compromiso: boolean;
    @Column()
    devengado: boolean;
    @Column()    
    pagado: boolean;
    @Column()
    fechaRec: Date;
    @Column()
    doc_respa: string;
    @Column()
    num_doc:string;
    @Column()
    baja: boolean;
    @Column()
    id_num_clasif_id: string;
    @Column()
    des_clasif: string;
    @Column()
    gestion:string;
    @Column()
    idUsuario:string;
    @Column()
    usuario:string;
    @Column()
    rol:string;
    @Column()
    regional:string;







}
