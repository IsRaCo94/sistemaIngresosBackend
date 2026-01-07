import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('gastos_pagos_det')
export class IngresoPagosReporteEntity {
        @PrimaryGeneratedColumn()
        id_pago_det:number;
      @Column()
      orden_pago:number;
      @Column()
      fecha:Date;
      @Column()
      cargo:string;
      @Column()
      nombre:string;
      @Column()
      proveedor:string;
      @Column({ type: 'decimal', precision: 10, scale: 4 })
      importe:number;
      @Column()
      literal_importe:string;
      @Column()
      imp_benef:string;
      @Column()
      glosa:string;
      @Column()
      respaldo:string;
      @Column()
      hoja_ruta:string;
      @Column()
      c_31:string;
      @Column()
      operador:string;
      @Column()
      estado:string;
      @Column({ type: 'decimal', precision: 10, scale: 4 })
      reten_IT:number;
      @Column({ type: 'decimal', precision: 10, scale: 4 })
      reten_IVA:number;
      @Column()
      id_persona:number;
      @Column()
      baja:boolean;
      @Column()
      id_pago:number;
      @Column({ type: 'decimal', precision: 10, scale: 4 })
      saldoPresu:number;
      @Column()
      servicios:string;
      @Column()
      des_servicios:string;
      @Column({ type: 'decimal', precision: 10, scale: 4 })
      total_reten:number;
      @Column({ type: 'decimal', precision: 10, scale: 4 })
      retencion:number;
      @Column({ type: 'decimal', precision: 10, scale: 4 })
      descuento_multa:number;
      @Column({ type: 'decimal', precision: 10, scale: 4 })
      total_descuentos:number;
      @Column({ type: 'decimal', precision: 10, scale: 4 })
      liquido_pagable:number;
      @Column({ type: 'decimal', precision: 10, scale: 4 })
      saldo_presupuestario:number;
      @Column()
      factura:string;
      @Column()
      nro_factura:number;
      @Column()
      contrato:string;
      @Column()
      contrato_convenio:string;
      @Column()
      fecha_inicio:Date;
      @Column()
      fecha_final:Date;
      @Column({ type: 'decimal', precision: 10, scale: 4 })
      presupuesto_adicional:number;
      @Column()
      prestacion_servicio:string;
      @Column()
      detalle:string;
      @Column({ type: 'decimal', precision: 10, scale: 4 })
      mensual:number;
      @Column()
      contrato_modf:string;
      @Column()
      contrato_modf_conv:string;
      @Column()
      fecha_inicio_modf:Date;
      @Column()
      fecha_final_modf:Date;
      @Column()
      varios:string;
      @Column()
      monto_varios:string;
      @Column({ type: 'decimal', precision: 10, scale: 4 })
      costoTotal:number;
      @Column({ type: 'decimal', precision: 10, scale: 4 })
      presupuesto_inicial:number;
      @Column()
      gestion:number;
      @Column()
      descripcionEspecificaRequerimientos:string;
      // @Column()
      // fechaRec:Date;
}
