import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { GastosObservacionesEntity } from '../gastos-observaciones/gastos-observaciones.entity';
import { IngresoGastoEntity } from '../ingreso-gasto/ingreso-gasto.entity';

@Entity('observ_ejec_gastos')
export class ObservEjecGastosEntity {
    @PrimaryColumn()
    id_observacion: number;

    @Column({ type: 'varchar', nullable: true })
    observacion: string;

    @Column({ type: 'varchar', nullable: true })
    detalle: string;

    @PrimaryColumn()
    id_gasto: number;

    @Column({ type: 'varchar', length: 255, nullable: true })
    num_prev: string;

    @ManyToOne(() => GastosObservacionesEntity)
    @JoinColumn({ name: 'id_observacion' })
    observacionEntity: GastosObservacionesEntity;

    @ManyToOne(() => IngresoGastoEntity)
    @JoinColumn({ name: 'id_gasto' })
    gastoEntity: IngresoGastoEntity;
}
