
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IngresosGastoPagoEntity } from './ingresos-gasto-pago.entity';
import { IngresosGastoPagoDetEntity } from '../ingresos-gasto-pago-detalle/ingresos-gasto-pago-det.entity';
import { Repository } from 'typeorm';
import { join } from 'path';
import * as carbone from 'carbone';
import * as libreofficeConvert from 'libreoffice-convert';

@Injectable()
export class IngresosGastoPagoService {

    constructor(
        @InjectRepository(IngresosGastoPagoEntity)
        private readonly ingresoGastoRepository: Repository<IngresosGastoPagoEntity>,
        @InjectRepository(IngresosGastoPagoDetEntity)
        private readonly detallePagoRepository: Repository<IngresosGastoPagoDetEntity>,
    ) {
      process.env.LIBREOFFICE_BIN = '/usr/bin/soffice';
    }

    private async convertWithLibreOffice(inputBuffer: Buffer, outputFormat: string): Promise<Buffer> {
      return new Promise((resolve, reject) => {
        libreofficeConvert.convert(inputBuffer, outputFormat, undefined, (err, result) => {
          if (err) return reject(err);
          resolve(result);
        });
      });
    }

    async create(
        id_pago: Partial<IngresosGastoPagoEntity>,
    ):Promise<IngresosGastoPagoEntity>{
        const nuevoPago=this.ingresoGastoRepository.create(id_pago);
        return await this.ingresoGastoRepository.save(nuevoPago)
    }



    async findAll():Promise<IngresosGastoPagoEntity[]>{
        return await this.ingresoGastoRepository.find()
    }

    async findOne(id_pago: number): Promise<IngresosGastoPagoEntity | null> {
        return await this.ingresoGastoRepository.findOneBy({ id_pago });
      }
    async update(
        id_pago: number,
        pagoActualizado: Partial<IngresosGastoPagoEntity>,
      ): Promise<IngresosGastoPagoEntity> {
        await this.ingresoGastoRepository.update(id_pago, pagoActualizado);
        const pagoActualizadoDesdeDb = await this.ingresoGastoRepository.findOneBy({
            id_pago,
        });
        if (!pagoActualizadoDesdeDb) {
          throw new NotFoundException(
            `No se pudo encontrar el insumo con ID ${id_pago} después de la actualización.`,
          );
        }
        return pagoActualizadoDesdeDb;
      }

    async borradologico(id_pago: number): Promise<{ deleted: boolean; message?: string }> {
    const pagoToUpdate = await this.ingresoGastoRepository.findOne({
      where: { id_pago }, 
    });
    if (!pagoToUpdate) {
      throw new NotFoundException(`Ingreso con ID ${id_pago} no encontrado.`);
    }
    if (pagoToUpdate.baja === true) {
      return { deleted: false, message: `Ingreso con ID ${id_pago} ya estaba dado de baja lógicamente.` };
    }
    
    // Marcar como eliminado el registro principal
    pagoToUpdate.baja = true; 
    await this.ingresoGastoRepository.save(pagoToUpdate);
    
    // También marcar como eliminados todos los detalles relacionados
    await this.ingresoGastoRepository.query(
      `UPDATE gastos_pagos_det SET baja = true WHERE id_pago = $1 AND (baja IS NULL OR baja = false)`,
      [id_pago]
    );
    
    return { deleted: true, message: `Ingreso con ID ${id_pago} y sus detalles dados de baja lógicamente.` };
  }


  obtenerAnioActual(): number {
    return new Date().getFullYear();
  }

  async generarReporteDocumentoPagos(num_prev?: string): Promise<Buffer> {
    // Convierte números a letras (versión simple con decimales 00/100)
    function numeroALetras(num: number): string {
      function convertirParte(n: number): string {
        const unidades = ['','uno','dos','tres','cuatro','cinco','seis','siete','ocho','nueve'];
        const especiales = ['diez','once','doce','trece','catorce','quince','dieciséis','diecisiete','dieciocho','diecinueve'];
        const decenas = ['','diez','veinte','treinta','cuarenta','cincuenta','sesenta','setenta','ochenta','noventa'];
        const centenas = ['','cien','doscientos','trescientos','cuatrocientos','quinientos','seiscientos','setecientos','ochocientos','novecientos'];
        if (n === 0) return 'cero';
        if (n < 10) return unidades[n];
        if (n < 20) return especiales[n - 10];
        if (n < 100) {
          const d = Math.floor(n / 10); const u = n % 10;
          if (d === 2 && u > 0) return 'veinti' + unidades[u];
          return decenas[d] + (u > 0 ? ' y ' + unidades[u] : '');
        }
        if (n < 1000) {
          const c = Math.floor(n / 100); const r = n % 100;
          if (n === 100) return 'cien';
          return centenas[c] + (r > 0 ? ' ' + convertirParte(r) : '');
        }
        return '';
      }
      function convertirMiles(n: number): string {
        if (n < 1000) return convertirParte(n);
        const miles = Math.floor(n / 1000); const resto = n % 1000;
        let textoMiles = miles === 1 ? 'mil' : convertirParte(miles) + ' mil';
        if (resto > 0) textoMiles += ' ' + convertirParte(resto);
        return textoMiles;
      }
      function convertirMillones(n: number): string {
        if (n < 1000000) return convertirMiles(n);
        const millones = Math.floor(n / 1000000); const resto = n % 1000000;
        let texto = millones === 1 ? 'un millón' : convertirParte(millones) + ' millones';
        if (resto > 0) texto += ' ' + convertirMiles(resto);
        return texto;
      }
      const entero = Math.floor(Math.abs(num));
      const decimal = Math.round((Math.abs(num) - entero) * 100);
      let textoEntero = convertirMillones(entero);
      let textoDecimal = decimal > 0 ? ` ${decimal}/100` : ' 00/100';
      if (num < 0) textoEntero = 'menos ' + textoEntero;
      return (textoEntero + textoDecimal).trim();
    }
    let query = `SELECT det.*, pag.num_prev, 
    pag.num_comp, pag.num_dev, 
    pag.num_pag, 
    pag.num_sec, 
    pag.entidad, 
    pag.unidad, pag.tipo_doc,
     pag.tipo_ejec, 
     pag.tipo_impu, 
     pag.regularizacion, 
     pag."fechaElab",
      pag.estado,
       pag.glosa as glosa_header, 
     pag.moneda, 
     pag.preventivo, 
     pag.compromiso, 
     pag.devengado, 
     pag.pagado,
      pag."fechaRec", 
      pag.doc_respa,
       pag.num_doc, 
     pag.gestion, 
     pag.des_clasif, 
     pag.saldo_presu, 
     pag.area_organizacional, 
     pag."descripcionEspecificaRequerimientos", 
     pag.presupuesto_inicial,
     pag.cantidad,
     pag.descripcion,
      pag.partida,
      det.c_31,
      det."costoTotal",
      pag.usuario_elaboro,
      pag.fecha_elaboro,
      pag.usuario_verifico,
      pag.fecha_verifico,
      pag.usuario_aprobo,
      pag.fecha_aprobo,
      pag.usuario_firmo,
      pag.fecha_firmo
   
               FROM gastos_pagos_det det
               JOIN gastos_pagos pag ON det.id_pago = pag.id_pago
             
               WHERE (pag.baja IS NULL OR pag.baja = false) 
               AND (det.baja IS NULL OR det.baja = false)`;
    if (num_prev) {
      // Solo traer los detalles del registro más reciente con este num_prev
      query += ` AND pag.id_pago = (
        SELECT MAX(id_pago) 
        FROM gastos_pagos 
        WHERE num_prev = '${num_prev}' 
        AND (baja IS NULL OR baja = false)
      )`;
    }
    query += ' ORDER BY det.id_pago_det ASC';
    const rows = await this.ingresoGastoRepository.query(query);

    const pagos = rows.map(r => ({
      id_pago_det: r.id_pago_det,
      orden_pago: r.orden_pago || '',
      fecha: r.fecha ? new Date(r.fecha).toLocaleDateString('es-ES') : '',
      cargo: r.cargo || '',
      nombre: r.nombre || '',
      proveedor: r.proveedor || '',
      importe: Number(r.importe || 0).toLocaleString('es-ES', { minimumFractionDigits: 2 }),
      literal_importe: r.literal_importe || '',
      imp_benef: r.imp_benef || '',
      glosa: r.glosa || '',
      respaldo: r.respaldo || '',
      hoja_ruta: r.hoja_ruta || '',
      c_31: r.c_31 || '',
      operador: r.operador || '',
      estado: r.estado || '',
      reten_IT: Number(r.reten_IT || 0).toLocaleString('es-ES', { minimumFractionDigits: 2 }),
      reten_IVA: Number(r.reten_IVA || 0).toLocaleString('es-ES', { minimumFractionDigits: 2 }),
      total_reten: Number(r.total_reten || 0).toLocaleString('es-ES', { minimumFractionDigits: 2 }),
      retencion: Number(r.retencion || 0).toLocaleString('es-ES', { minimumFractionDigits: 2 }),
      descuento_multa: Number(r.descuento_multa || 0).toLocaleString('es-ES', { minimumFractionDigits: 2 }),
      total_descuentos: Number(r.total_descuentos || 0).toLocaleString('es-ES', { minimumFractionDigits: 2 }),
      liquido_pagable: Number(r.liquido_pagable || 0).toLocaleString('es-ES', { minimumFractionDigits: 2 }),
      saldoPresu: Number(r.saldoPresu || 0).toLocaleString('es-ES', { minimumFractionDigits: 2 }),
      servicios: r.servicios || '',
      des_servicios: r.des_servicios || '',
      saldo_presupuestario: Number(r.saldo_presupuestario || 0).toLocaleString('es-ES', { minimumFractionDigits: 2 }),
      factura: r.factura || '',
      nro_factura: r.nro_factura || '',
      contrato: r.contrato || '',
      contrato_convenio: r.contrato_convenio || '',
      fecha_inicio: r.fecha_inicio ? new Date(r.fecha_inicio).toLocaleDateString('es-ES') : '',
      fecha_final: r.fecha_final ? new Date(r.fecha_final).toLocaleDateString('es-ES') : '',
      presupuesto_adicional: Number(r.presupuesto_adicional || 0).toLocaleString('es-ES', { minimumFractionDigits: 2 }),
      prestacion_servicio: r.prestacion_servicio || '',
      detalle: r.detalle || '',
      mensual: Number(r.mensual || 0).toLocaleString('es-ES', { minimumFractionDigits: 2 }),
      contrato_modf: r.contrato_modf || '',
      contrato_modf_conv: r.contrato_modf_conv || '',
      fecha_inicio_modf: r.fecha_inicio_modf ? new Date(r.fecha_inicio_modf).toLocaleDateString('es-ES') : '',
      fecha_final_modf: r.fecha_final_modf ? new Date(r.fecha_final_modf).toLocaleDateString('es-ES') : '',
      varios: r.varios || '',
      monto_varios: r.monto_varios || '',
      costoTotal: Number(r.costoTotal || 0).toLocaleString('es-ES', { minimumFractionDigits: 2 }),
      presupuesto_inicial: Number(r.presupuesto_inicial || 0).toLocaleString('es-ES', { minimumFractionDigits: 2 }),
      gestion: r.gestion || new Date().getFullYear(),
      num_prev: r.num_prev || '',
      num_comp: r.num_comp || '',
      num_dev: r.num_dev || '',
      num_pag: r.num_pag || '',
      num_sec: r.num_sec || '',
      entidad: r.entidad || '',
      unidad: r.unidad || '',
      tipo_doc: r.tipo_doc || '',
      tipo_ejec: r.tipo_ejec || '',
      tipo_impu: r.tipo_impu ? 'CON IMPUTACION' : 'SIN IMPUTACION',
      regularizacion: r.regularizacion || '',
      fechaElab: r.fechaElab ? new Date(r.fechaElab).toLocaleDateString('es-ES') : '',
      estadoCab: r.estado || '',
      glosa_header: r.glosa_header || '',
      moneda: r.moneda || '',
      preventivo: r.preventivo ? 'X' : '',
      compromiso: r.compromiso ? 'X' : '',
      devengado: r.devengado ? 'X' : '',
      pagado: r.pagado ? 'X' : '',
      fechaRec: r.fechaRec ? new Date(r.fechaRec).toLocaleDateString('es-ES') : '',
      doc_respa: r.doc_respa || '',
      num_doc: r.num_doc || '',
      des_clasif: r.des_clasif || '',
      saldo_presu: Number(r.saldo_presu || 0).toLocaleString('es-ES', { minimumFractionDigits: 2 }),
      area_organizacional: r.area_organizacional || '',
      descripcionEspecificaRequerimientos: r.descripcionEspecificaRequerimientos || '',
      partida: r.partida || '',
      cantidad: Number(r.cantidad || 0).toLocaleString('es-ES', { minimumFractionDigits: 2 }),
      descripcion: r.descripcion || '',
      usuario_elaboro: r.usuario_elaboro || '',
      fecha_elaboro: r.fecha_elaboro ? new Date(r.fecha_elaboro).toLocaleDateString('es-ES') : '',
      usuario_verifico: r.usuario_verifico || '',
      fecha_verifico: r.fecha_verifico ? new Date(r.fecha_verifico).toLocaleDateString('es-ES') : '',
      usuario_aprobo: r.usuario_aprobo || '',
      fecha_aprobo: r.fecha_aprobo ? new Date(r.fecha_aprobo).toLocaleDateString('es-ES') : '',
      usuario_firmo: r.usuario_firmo || '',
      fecha_firmo: r.fecha_firmo ? new Date(r.fecha_firmo).toLocaleDateString('es-ES') : '',
    }));

    const totalImporte = rows.reduce((a, c) => a + Number(c.importe || 0), 0);
    const totalLiquidoPagable = rows.reduce((a, c) => a + Number(c.liquido_pagable || 0), 0);
    const totalRetenciones = rows.reduce((a, c) => a + Number(c.total_reten || 0), 0);
    const totalDescuentos = rows.reduce((a, c) => a + Number(c.total_descuentos || 0), 0);

    const templatePath = join(__dirname, '../../src/templates/documento-pagos.odt');
    const fechaActual = new Date();
    const data = {
      pagos: pagos,
      totalRegistros: pagos.length,
      totalImporte: totalImporte.toLocaleString('es-ES', { minimumFractionDigits: 2 }),
      totalLiquidoPagable: totalLiquidoPagable.toLocaleString('es-ES', { minimumFractionDigits: 2 }),
      totalRetenciones: totalRetenciones.toLocaleString('es-ES', { minimumFractionDigits: 2 }),
      totalDescuentos: totalDescuentos.toLocaleString('es-ES', { minimumFractionDigits: 2 }),
      totalImporteLetras: numeroALetras(totalImporte).toUpperCase() + ' BOLIVIANOS',
      totalLiquidoPagableLetras: numeroALetras(totalLiquidoPagable).toUpperCase() + ' BOLIVIANOS',
      // Importe en letras del primer registro (no el total)
      importeLetras: rows.length > 0 ? numeroALetras(Number(rows[0].importe || 0)).toUpperCase() + ' BOLIVIANOS' : '',
      fechaHoraReporte: `${fechaActual.toLocaleDateString('es-ES')} ${fechaActual.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`,
      num_prev: num_prev || 'TODOS',
      gestion: new Date().getFullYear(),
    };

    const options = { convertTo: 'pdf' };
    return new Promise<Buffer>((resolve, reject) => {
      carbone.render(templatePath, data, options, (err, result) => {
        if (!err && result) return resolve(result as Buffer);
        carbone.render(templatePath, data, (err2, odfBuffer) => {
          if (err2) return reject(err2);
          this.convertWithLibreOffice(Buffer.from(odfBuffer), '.pdf')
            .then(resolve)
            .catch(() => reject(err2));
        });
      });
    });
  }

  async cambiarEstado(id_pago: number, nuevoEstado: string, usuario: string): Promise<IngresosGastoPagoEntity> {
    // Obtener el registro original
    const pagoOriginal = await this.ingresoGastoRepository.findOne({ where: { id_pago } });
    
    if (!pagoOriginal) {
      throw new NotFoundException(`Pago con ID ${id_pago} no encontrado`);
    }

    console.log('=== CREAR NUEVO REGISTRO DE PAGO CON NUEVO ESTADO ===');
    console.log('ID original:', id_pago);
    console.log('Estado original:', pagoOriginal.estado);
    console.log('Nuevo estado:', nuevoEstado);

    const ahora = new Date();

    // Crear un NUEVO registro copiando todos los datos del original
    const nuevoPago = this.ingresoGastoRepository.create({
      ...pagoOriginal,
      id_pago: undefined, // Esto hará que se genere un nuevo ID
      estado: nuevoEstado,
    });
    
    // Agregar el usuario según el nuevo estado (preservando los anteriores)
    switch (nuevoEstado) {
      case 'VERIFICADO':
        nuevoPago.usuario_verifico = usuario;
        nuevoPago.fecha_verifico = ahora;
        break;
      case 'APROBADO':
        nuevoPago.usuario_aprobo = usuario;
        nuevoPago.fecha_aprobo = ahora;
        break;
      case 'FIRMADO':
        nuevoPago.usuario_firmo = usuario;
        nuevoPago.fecha_firmo = ahora;
        break;
    }

    // Guardar el NUEVO registro
    const pagoGuardado = await this.ingresoGastoRepository.save(nuevoPago);

    console.log('✅ NUEVO REGISTRO DE PAGO CREADO');
    console.log('Nuevo ID:', pagoGuardado.id_pago);
    console.log('Estado:', pagoGuardado.estado);
    console.log('usuario_elaboro:', pagoGuardado.usuario_elaboro);
    console.log('usuario_verifico:', pagoGuardado.usuario_verifico);
    console.log('usuario_aprobo:', pagoGuardado.usuario_aprobo);
    console.log('usuario_firmo:', pagoGuardado.usuario_firmo);

    // Copiar también todos los detalles del pago original al nuevo pago
    const detallesOriginales = await this.detallePagoRepository.find({
      where: { id_pago: id_pago }
    });

    for (const detalleOriginal of detallesOriginales) {
      const nuevoDetalle = this.detallePagoRepository.create({
        ...detalleOriginal,
        id_pago_det: undefined, // Generar nuevo ID
        id_pago: pagoGuardado.id_pago, // Asociar al nuevo pago
        estado: pagoGuardado.estado, // Copiar el mismo estado del pago padre
        usuario_elaboro: pagoGuardado.usuario_elaboro,
        fecha_elaboro: pagoGuardado.fecha_elaboro,
        usuario_verifico: pagoGuardado.usuario_verifico,
        fecha_verifico: pagoGuardado.fecha_verifico,
        usuario_aprobo: pagoGuardado.usuario_aprobo,
        fecha_aprobo: pagoGuardado.fecha_aprobo,
        usuario_firmo: pagoGuardado.usuario_firmo,
        fecha_firmo: pagoGuardado.fecha_firmo,
      });
      await this.detallePagoRepository.save(nuevoDetalle);
    }

    console.log(`✅ ${detallesOriginales.length} detalles copiados al nuevo registro con estado ${pagoGuardado.estado}`);

    return pagoGuardado;
  }
}
