import { Column, Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { IngresoGastoCertificacionCabeceraEntity } from './ingreso-gasto-certificacion-cabecera.entity';

@Entity('planEstrategicoInstitucional_certificaciondetalle')
export class IngresoGastoCertificacionEntity {
    @PrimaryGeneratedColumn() 
    id_detalle: number;

    @Column()
    certificacion_cabecera_id: number;

    @Column()
    descripcion: string;

    @Column()
    catePorgr: string;

    @Column()
    bienServicioDemandado: string;

    @Column({ type: 'decimal', precision: 10, scale: 4 })
    cantidad: number;

    @Column({ type: 'decimal', precision: 10, scale: 4 })
    precioUnitario: number;

    @Column({ type: 'decimal', precision: 10, scale: 4 })
    costoTotal: number;

    @Column({ type: 'decimal', precision: 10, scale: 4 })
    programado: number;

    @Column({ type: 'decimal', precision: 10, scale: 4 })
    cantidadAdquirida: number;

    @Column({ type: 'decimal', precision: 10, scale: 4 })
    precioAdquirido: number;

    @Column({ type: 'decimal', precision: 10, scale: 4 })
    costoAdquirido: number;

    @Column({ type: 'decimal', precision: 10, scale: 4 })
    ejecutado: number;

    @Column({ type: 'decimal', precision: 10, scale: 4 })
    saldo: number;

    @Column()
    baja: boolean;

    @Column({ nullable: true })
    fecha_creacion: Date;

    @Column({ nullable: true })
    fecha_modificacion: Date;

    @Column({ nullable: true })
    id_actividad_id: string;

    @Column({ nullable: true })
    id_insumo_id: string;

    @Column({ nullable: true })
    partida_id: string;

    @Column({ nullable: true })
    operaciones: string;

    @Column({ nullable: true })
    tareas: string;

    @ManyToOne(() => IngresoGastoCertificacionCabeceraEntity, cabecera => cabecera.detalles)
    @JoinColumn({ name: 'certificacion_cabecera_id' })
    certificacionCabecera: IngresoGastoCertificacionCabeceraEntity;
}
