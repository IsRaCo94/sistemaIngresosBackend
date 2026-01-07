import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('egresos')
export class EgresosReportesEntity {
  @PrimaryGeneratedColumn() 
  id_egresos: number;

  @Column()
  lugar: string;

  @Column()
  fecha: Date;

  @Column({ type: 'decimal', precision: 12, scale: 4 })
  monto: number;

  @Column()
  proveedor: string;

  @Column()
  estado: string;

  @Column()
  fecha_cobro: Date;

  @Column()
  cobrado: string;

  @Column()
  cerrado: string;

  @Column({ type: 'text', nullable: true })
  observacion: string;

  @Column()
  id_empresa_id: number;

  @Column({ type: 'boolean', default: false, nullable: false })
  baja: boolean;

  @Column()
  num_cheque: string;

  @Column()
  cod_prove: string;

  @Column()
  fecha_reg: Date;
}
