import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('ingresos')
export class IngresoReportesEntity {
  @PrimaryGeneratedColumn() id_ingresos: number;

  @Column()
  num_recibo: number
  @Column()
  lugar: string
  @Column()
  fecha: Date
  @Column()
  monto: number
  @Column()
  cod_prove: string
  @Column()
  proveedor: string
  @Column()
  detalle: string
  @Column()
  estado: string
  @Column()
  tipo_ingres: string
  @Column()
  cerrado: string
  @Column()
  fecha_reg: Date
  @Column()
  id_empresa_id: number
  @Column({ type: 'boolean', default: false, nullable: false }) // <-- Asegúrate de que 'default: false' esté aquí
  baja: boolean; // 'true' = dado de baja, 'false' = activo
  @Column()
  id_tipo_ingr_id: string;
  @Column()
  multas: number;
  @Column()
  intereses: number;
  @Column()
  aportes_patro: number;
  @Column()
  deposito_dema: number;
  @Column()
  amortizacion_pagos: number;
  @Column()
  cuenta: string;
  @Column()
  num_form: number;
  @Column()
  op_deposito_dema:boolean;
  @Column()
  op_amortizacion_pagos:boolean;
  @Column()
  tipo_emision: string;
  @Column()
  num_factura: number;
  @Column()
  nit: number;
  @Column()
  venta_form: number;
  @Column()
  venta_serv: number;
  @Column()
  inter_rota: number;
  @Column()
  op_tipoemision: boolean;
  @Column()
  id_tipo_rubro: number;
  @Column()
  num_rubro: number;
  @Column()
  servicio: string;
  @Column()
  nombre: string;
  @Column()
  num_depo: number;
  @Column()
  importe_total: number;


}
