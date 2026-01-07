import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('gastos_ejecucionPresu_det')
export class IngresoGastoDetalleEntity {
    @PrimaryGeneratedColumn()
    id_gasto_det: number;
    @Column()
    id_gasto_id: number;
    @Column()
    id_certificado_id: number;
    @Column()
    numeroCertificacion: string;
    @Column()
    nota_solicitud: string;
    @Column()
    area_organizacional: string;
    @Column()
    descripcionEspecificaRequerimientos: string;
    @Column()
    operaciones: string;
    @Column()
    tareas: string;
    @Column()
    descripcion: string;
    @Column({type: 'decimal', precision: 10, scale: 4})
    cantidad: number;
    @Column({type: 'decimal', precision: 10, scale: 4})
    precioUnitario: number;
    @Column()
    saldofinal: number;
    @Column({ type: 'decimal', precision: 10, scale: 4 })
    costoTotal: number;
    @Column({ type: 'decimal', precision: 10, scale: 4 })
    ejecutado: number;
    @Column({ type: 'decimal', precision: 10, scale: 4 })
    saldo: number;
    @Column()
    baja: boolean;
    @Column()
    num_prev: string;
    @Column()
    num_dev: string;
    @Column()
    num_comp: string;
    @Column()
    num_pag: string;
    @Column()
    num_sec: string;
    @Column()
    catProg: string;
    @Column()
    partida: string;
     @Column()
    idUsuario:string;
    @Column()
    usuario:string;
    @Column()
    rol:string;
    @Column()
    regional:string;

    @Column()
    tipo_ejec: string;
    @Column()   
    tipo_impu: boolean;
    @Column()
    regularizacion: string;
    @Column()
    entidad: string;
    @Column()
    estado: string;
    @Column()
    moneda: string;
    @Column()
    unidad: string;
    @Column()
    tipo_doc: string;
    @Column()
    preventivo: boolean;
    @Column()
    compromiso: boolean;
    @Column()
    devengado: boolean;
    @Column()    
    pagado: boolean;
    @Column()
    fechaElab: Date;
    @Column()
    doc_respa: string;
    @Column()
    num_doc:string;
    @Column()
    gestion:number;
    @Column()
    id_num_clasif_id: string;
    @Column()
    des_clasif: string;
    @Column({ type: 'decimal', precision: 10, scale: 4 })
    programado: number;
    @Column()
    fechaRec: Date;
    @Column()
    glosa: string;
    // @Column()
    // catePorgr: string;
    @Column()
    saldoPresuTotal: number;
    @Column()
    costoTotalModif:number;
}
