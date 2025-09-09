import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('planEstrategicoInstitucional_certificacion')
export class IngresoGastoCertificacionEntity {
    @PrimaryGeneratedColumn() 
    id_certificacion:number;
    @Column()
    codigoCert:string;
    @Column()
    nota_solicitud:string;
    @Column()
    area_organizacional:string;
    @Column()
    descripcionEspecificaRequerimientos:string;
    @Column()
    accionesCortoPlazo:string;
    @Column()
    estadoCertificacion:string;
    @Column()
    baja:boolean;
    @Column()
    operaciones:string;
    @Column()
    tareas:string;
    @Column()
    compromiso:string;
    @Column()
    devengado:boolean;    
    @Column()
    cantidad:number;
    @Column()
    precioUnitario:number;
    @Column()
    costoTotal:number;
    @Column()
    programado:number;
    @Column()
    ejecutado:number;
    @Column()
    saldo:number;
    @Column()
    descripcion:string;
    @Column()
    catePorgr:string;
    @Column()
    fecha:Date;
    @Column()
    id_unidad_id:string;
    @Column()
    id_actividad_id:string;
    @Column()
    id_insumo_id:string;
    @Column()
    partida_id:string;
    @Column()
    numeroCertificacion:string;
    @Column()
    cantidadAdquirida:number;
    @Column()
    precioAdquirido:number;
    @Column()
    costoAdquirido:number;
    @Column()
    bienServicioDemandado:string;




}
