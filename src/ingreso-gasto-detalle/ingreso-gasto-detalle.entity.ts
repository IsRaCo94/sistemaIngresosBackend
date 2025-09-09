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
    // @Column()
    // cantidad: number;
    // @Column()
    // precioUnitario: number;
    @Column()
    saldofinal: number;
    @Column()
    costoTotal: number;
    @Column()
    ejecutado: number;
    @Column()
    saldo: number;
    @Column()
    baja: boolean;
    @Column()
    num_prev: string;
    @Column()
    num_dev: string;
    @Column()
    num_pag: string;
    @Column()
    num_sec: string;
    @Column()
    catProg: string;
    @Column()
    partida: string;
}
