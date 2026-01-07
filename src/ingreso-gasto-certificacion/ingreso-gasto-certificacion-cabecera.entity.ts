import { Column, Entity, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { IngresoGastoCertificacionEntity } from './ingreso-gasto-certificacion.entity';

@Entity('planEstrategicoInstitucional_certificacioncabecera')
export class IngresoGastoCertificacionCabeceraEntity {
    @PrimaryGeneratedColumn() 
    id_certificacion_cabecera: number;

    @Column()
    codigoCert: string;

    @Column()
    numeroCertificacion: string;

    @Column()
    nota_solicitud: string;

    @Column()
    area_organizacional: string;

    @Column()
    descripcionEspecificaRequerimientos: string;

    @Column()
    accionesCortoPlazo: string;

    @Column()
    estadoCertificacion: string;

    @Column()
    baja: boolean;

    @Column()
    compromiso: string;

    @Column()
    devengado: boolean;

    @Column({ type: 'decimal', precision: 10, scale: 4 })
    programado: number;

    @Column({ type: 'decimal', precision: 10, scale: 4 })
    ejecutado: number;

    @Column({ type: 'decimal', precision: 10, scale: 4 })
    saldo: number;

    @Column({ nullable: true })
    fecha: Date;

    @Column({ nullable: true })
    fecha_creacion: Date;

    @Column({ nullable: true })
    fecha_modificacion: Date;

    @Column({ nullable: true })
    id_entidad_id: string;

    @Column({ nullable: true })
    id_unidad_id: string;

    @Column({ nullable: true })
    gestion_id: string;

    @Column({ nullable: true })
    revertido: boolean;

    @OneToMany(() => IngresoGastoCertificacionEntity, detalle => detalle.certificacionCabecera)
    detalles: IngresoGastoCertificacionEntity[];
}
