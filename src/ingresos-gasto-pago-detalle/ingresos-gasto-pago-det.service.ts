import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '\@nestjs/common';
import { InjectRepository } from '\@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { IngresosGastoPagoDetEntity } from '\./ingresos-gasto-pago-det.entity';
import { IngresosGastoPagoEntity } from '\../ingresos-gasto-pago/ingresos-gasto-pago.entity';
import { join } from 'path';
import * as carbone from 'carbone';
import * as libreofficeConvert from 'libreoffice-convert';

@Injectable()
export class IngresosGastoPagoDetService {
  constructor(
    @InjectRepository(IngresosGastoPagoDetEntity)
    private readonly detRepo: Repository<IngresosGastoPagoDetEntity>,
    @InjectRepository(IngresosGastoPagoEntity)
    private readonly pagoRepo: Repository<IngresosGastoPagoEntity>,
    private readonly dataSource: DataSource,
  ) {}

  // Asegurar binario de LibreOffice para libreoffice-convert
  private ensureLibreOfficeEnv(): void {
    if (!process.env.LIBREOFFICE_BIN) {
      process.env.LIBREOFFICE_BIN = '/usr/bin/soffice';
    }
  }

  private async convertWithLibreOffice(inputBuffer: Buffer, outputFormat: string): Promise<Buffer> {
    this.ensureLibreOfficeEnv();
    return new Promise((resolve, reject) => {
      libreofficeConvert.convert(inputBuffer, outputFormat, undefined, (err, result) => {
        if (err) return reject(err);
        resolve(result);
      });
    });
  }

  async getMaxNumOrdenPago(): Promise<number> {
    try {
      const result = await this.detRepo
        .createQueryBuilder('gastos_pagos_det')
        .select('MAX(gastos_pagos_det.orden_pago)', 'max')
        .getRawOne();

      const maxNum = result?.max ?? 0;
      return Number(maxNum);
    } catch (error) {
      console.error('Error fetching max orden_pago:', error);
      throw new BadRequestException('Error fetching max orden_pago');
    }
  }
  // Crear detalle: descuenta del saldo del pago principal y guarda saldofinal
  async create(payload: Partial<IngresosGastoPagoDetEntity>): Promise<IngresosGastoPagoDetEntity> {
    if (!payload?.id_pago) {
      throw new BadRequestException('id_pago es requerido');
    }
    const importe = Number(payload.importe) || 0;
    if (importe <= 0) {
      throw new BadRequestException('importe debe ser mayor a 0');
    }

    return this.dataSource.transaction(async (manager) => {
      // Bloqueo pesimista del pago principal
      const pago = await manager.getRepository(IngresosGastoPagoEntity).findOne({
        where: { id_pago: payload.id_pago },
        lock: { mode: 'pessimistic_write' },
      });
      if (!pago) {
        throw new NotFoundException('Pago principal no encontrado');
      }

      const saldoActual = Number(pago.saldo_presu) || 0;
      if (importe > saldoActual) {
        throw new ConflictException('Saldo insuficiente para registrar el detalle');
      }

      const costoTotal = parseFloat((saldoActual - importe).toFixed(2));

      // Crear y guardar el detalle
      const det = manager.getRepository(IngresosGastoPagoDetEntity).create({
        ...payload,
        saldoPresu: saldoActual,             // saldo base antes del descuento (opcional para auditoría)
        costoTotal,                          // saldo restante después del descuento
        saldo_presupuestario: costoTotal,    // mantener sincronizado si este campo representa el saldo restante
        baja: payload.baja ?? false,
      });
      const detSaved = await manager.getRepository(IngresosGastoPagoDetEntity).save(det);

      // Actualizar el saldo del pago principal
      pago.saldo_presu = costoTotal;
      await manager.getRepository(IngresosGastoPagoEntity).save(pago);

      return detSaved;
    });
  }

  // Actualizar detalle: si cambia el importe, se recalcula el saldo del pago principal
  async update(
    id_pago_det: number,
    payload: Partial<IngresosGastoPagoDetEntity>,
  ): Promise<IngresosGastoPagoDetEntity> {
    const detActual = await this.detRepo.findOne({ where: { id_pago_det } });
    if (!detActual) {
      throw new NotFoundException(`Detalle ${id_pago_det} no encontrado`);
    }

    const cambiaImporte =
      payload.importe !== undefined &&
      Number(payload.importe) !== Number(detActual.importe);

    // Si no cambia el importe, actualiza normalmente
    if (!cambiaImporte) {
      await this.detRepo.update(id_pago_det, payload);
      const actualizado = await this.detRepo.findOne({ where: { id_pago_det } });
      if (!actualizado) {
        throw new NotFoundException(`Detalle ${id_pago_det} no encontrado tras la actualización`);
      }
      return actualizado;
    }

    const nuevoImporte = Number(payload.importe);
    if (!(nuevoImporte > 0)) {
      throw new BadRequestException('importe debe ser mayor a 0');
    }

    return this.dataSource.transaction(async (manager) => {
      // Bloquear el pago principal
      const pago = await manager.getRepository(IngresosGastoPagoEntity).findOne({
        where: { id_pago: detActual.id_pago },
        lock: { mode: 'pessimistic_write' },
      });
      if (!pago) {
        throw new NotFoundException('Pago principal no encontrado');
      }

      // Revertir el importe anterior al saldo y aplicar el nuevo
      const saldoActual = Number(pago.saldo_presu) || 0;
      const saldoRevertido = saldoActual + Number(detActual.importe || 0);
      if (nuevoImporte > saldoRevertido) {
        throw new ConflictException('Saldo insuficiente para actualizar el detalle');
      }

      const costoTotal = parseFloat((saldoRevertido - nuevoImporte).toFixed(2));

      // Actualizar detalle
      await manager.getRepository(IngresosGastoPagoDetEntity).update(id_pago_det, {
        ...payload,
        saldoPresu: saldoRevertido,
        costoTotal,
        saldo_presupuestario: costoTotal,
      });

      // Actualizar pago principal
      pago.saldo_presu = costoTotal;
      await manager.getRepository(IngresosGastoPagoEntity).save(pago);

      const actualizado = await manager.getRepository(IngresosGastoPagoDetEntity).findOne({ where: { id_pago_det } });
      if (!actualizado) {
        throw new NotFoundException(`Detalle ${id_pago_det} no encontrado tras la actualización`);
      }
      return actualizado;
    });
  }

  // Baja lógica del detalle: devuelve el importe al saldo del pago principal
  async borradologico(id_pago_det: number): Promise<{ deleted: boolean; message?: string }> {
    const det = await this.detRepo.findOne({ where: { id_pago_det } });
    if (!det) {
      throw new NotFoundException(`Ingreso con ID ${id_pago_det} no encontrado.`);
    }

    if (det.baja === true) {
      return { deleted: false, message: `Ingreso con ID ${id_pago_det} ya estaba dado de baja lógicamente.` };
    }

    await this.dataSource.transaction(async (manager) => {
      const pago = await manager.getRepository(IngresosGastoPagoEntity).findOne({
        where: { id_pago: det.id_pago },
        lock: { mode: 'pessimistic_write' },
      });
      if (!pago) {
        throw new NotFoundException('Pago principal no encontrado');
      }

      const saldoActual = Number(pago.saldo_presu) || 0;
      pago.saldo_presu = parseFloat((saldoActual + Number(det.importe || 0)).toFixed(2));
      await manager.getRepository(IngresosGastoPagoEntity).save(pago);

      det.baja = true;
      await manager.getRepository(IngresosGastoPagoDetEntity).save(det);
    });

    return { deleted: true, message: `Ingreso con ID ${id_pago_det} dado de baja lógicamente.` };
  }

  // Listado y búsqueda (sin cambios)
  async findAll(): Promise<IngresosGastoPagoDetEntity[]> {
    return this.detRepo.find();
  }

  async findOne(id_pago_det: number): Promise<IngresosGastoPagoDetEntity | null> {
    return this.detRepo.findOneBy({ id_pago_det });
  }

  // Obtener estado de cuentas por número de preventivo (num_prev)
  // async getEstadoCuentasPorNumPrev(numPrev: string): Promise<any[]> {
  //   try {
  //     const registros = await this.detRepo
  //       .createQueryBuilder('det')
  //       .innerJoin(IngresosGastoPagoEntity, 'pago', 'det.id_pago = pago.id_pago')
  //       .where('pago.num_prev = :numPrev', { numPrev })
  //       .andWhere('det.baja = false')
  //       .select([
  //         'pago.num_prev',
  //         'pago.presupuesto_inicial',
  //         'det.proveedor',
  //         'det.servicios',
  //         'det.des_servicios',
  //         'det.contrato',
  //         'det.contrato_convenio',
  //         'det.fecha_inicio',
  //         'det.fecha_final',
  //         'det.contrato_modf',
  //         'det.contrato_modf_conv',
  //         'det.fecha_inicio_modf',
  //         'det.fecha_final_modf',
  //         'det.nro_factura',
  //         'det.mensual',
  //         'det.presupuesto_adicional',
  //         'det.saldoPresu',
  //         'det.prestacion_servicio',
  //         'det.c_31',
  //         'det.detalle',
  //         'det.hoja_ruta',
  //         'det.factura',
  //         'det.reten_IT',
  //         'det.reten_IVA',
  //         'det.total_reten',
  //         'det.retencion',
  //         'det.total_descuentos',
  //         'det.liquido_pagable',
  //         'det.saldofinal'
  //       ])
  //       .orderBy('det.fecha', 'DESC')
  //       .getMany();

  //     return registros.map(registro => ({
  //       num_prev: numPrev,
  //       presupuesto_inicial: registro.presupuesto_inicial,
  //       proveedor_servicios: registro.proveedor,
  //       contrato: registro.contrato,
  //       contrato_modificatorio: registro.contrato_modf,
  //       fecha_inicio_contrato: registro.fecha_inicio,
  //       fecha_fin_contrato: registro.fecha_final,
  //       mensual: registro.mensual,
  //       presupuesto_adicional: registro.presupuesto_adicional,
  //       saldoPresu: registro.saldoPresu,
  //       prestacion_servicio: registro.prestacion_servicio,
  //       c_31: registro.c_31,
  //       detalle: registro.detalle,
  //       hoja_ruta: registro.hoja_ruta,
  //       factura: registro.factura,
  //       it: registro.reten_IT,
  //       iva: registro.reten_IVA,
  //       total_retencion: registro.total_reten,
  //       retencion: registro.retencion,
  //       total_descuento: registro.total_descuentos,
  //       liquido_pagable: registro.liquido_pagable,
  //       saldofinal: registro.saldofinal,
  //       servicios: registro.servicios,
  //       des_servicios: registro.des_servicios,
  //       nro_factura: registro.nro_factura,
  //       contrato_convenio: registro.contrato_convenio,
  //       fecha_inicio: registro.fecha_inicio,
  //       fecha_final: registro.fecha_final,
  //       contrato_modf: registro.contrato_modf,
  //       contrato_modf_conv: registro.contrato_modf_conv,
  //       fecha_inicio_modf: registro.fecha_inicio_modf,
  //       fecha_final_modf: registro.fecha_final_modf,
     
  //     }));
  //   } catch (error) {
  //     throw new Error(`Error al obtener el estado de cuentas por num_prev: ${error.message}`);
  //   }
  // }
    // Obtener estado de cuentas por número de preventivo (num_prev)
    async getEstadoCuentasPorNumPrev(numPrev: string): Promise<any[]> {
      try {
        const registros = await this.detRepo
          .createQueryBuilder('det')
          .innerJoin(IngresosGastoPagoEntity, 'pago', 'det.id_pago = pago.id_pago')
          .where('pago.num_prev = :numPrev', { numPrev })
          .andWhere('det.baja = false')
          .select([
            'pago.num_prev',
            'pago.presupuesto_inicial',
            'det.proveedor',
            'det.servicios',
            'det.des_servicios',
            'det.contrato',
            'det.contrato_convenio',
            'det.fecha_inicio',
            'det.fecha_final',
            'det.contrato_modf',
            'det.contrato_modf_conv',
            'det.fecha_inicio_modf',
            'det.fecha_final_modf',
            'det.nro_factura',
            'det.mensual',
            'det.importe',
            'det.presupuesto_adicional',
            'det.saldoPresu',
            'det.prestacion_servicio',
            'det.c_31',
            'det.detalle',
            'det.hoja_ruta',
            'det.factura',
            'det.reten_IT',
            'det.reten_IVA',
            'det.total_reten',
            'det.retencion',
            'det.total_descuentos',
            'det.liquido_pagable',
            'det.costoTotal'
          ])
          .orderBy('det.fecha', 'DESC')
          .getMany();
  
        const pagoInfo = await this.pagoRepo.findOne({ where: { num_prev: numPrev } });
  
        return registros.map(registro => ({
          num_prev: numPrev,
          presupuesto_inicial: pagoInfo?.presupuesto_inicial ?? null,
          proveedor_servicios: registro.proveedor,
          contrato: registro.contrato,
          contrato_modificatorio: registro.contrato_modf,
          fecha_inicio_contrato: registro.fecha_inicio,
          fecha_fin_contrato: registro.fecha_final,
          mensual: registro.mensual,
          importe: registro.importe,
          presupuesto_adicional: registro.presupuesto_adicional,
          saldoPresu: registro.saldoPresu,
          prestacion_servicio: registro.prestacion_servicio,
          c_31: registro.c_31,
          detalle: registro.detalle,
          hoja_ruta: registro.hoja_ruta,
          factura: registro.factura,
          it: registro.reten_IT,
          iva: registro.reten_IVA,
          total_retencion: registro.total_reten,
          retencion: registro.retencion,
          total_descuento: registro.total_descuentos,
          liquido_pagable: registro.liquido_pagable,
          servicios: registro.servicios,
          des_servicios: registro.des_servicios,
          nro_factura: registro.nro_factura,
          contrato_convenio: registro.contrato_convenio,
          fecha_inicio: registro.fecha_inicio,
          fecha_final: registro.fecha_final,
          contrato_modf: registro.contrato_modf,
          contrato_modf_conv: registro.contrato_modf_conv,
          fecha_inicio_modf: registro.fecha_inicio_modf,
          fecha_final_modf: registro.fecha_final_modf,
          costoTotal: registro.costoTotal,
       
        }));
      } catch (error) {
        throw new Error(`Error al obtener el estado de cuentas por num_prev: ${error.message}`);
      }
    }

    // Generar reporte de órdenes de pago por número de preventivo
    async generateOrdenPagoReport(numPrev: string, factura:string, orden_pago:number, contrato:string, contrato_modf:string,  forceRetenCeroTemplate = false): Promise<Buffer> {
      const query = `
         SELECT 
          det.orden_pago,
          det.fecha,
          det.proveedor,
          det.detalle,
          det.importe,
          det.literal_importe,
          det.servicios,
          det.des_servicios,
          det.contrato,
          det.contrato_modf,
          det.contrato_convenio,
          det.fecha_inicio,
          det.fecha_final,
          det.prestacion_servicio,
          det.hoja_ruta,
          det.factura,
          det.nro_factura,
          det."reten_IT",
          det."reten_IVA",
          det.total_reten,
          det.retencion,
          det.liquido_pagable,
          det.estado,
          pago.num_prev,
          pago.num_comp,
          pago.num_pag,
          pago.entidad,
          pago.unidad,
          pago.glosa,
          pago.presupuesto_inicial,
          pago.saldo_presu,
          pago."fechaElab",
          pago."fechaRec",
          det.nombre,
          det.cargo
      FROM gastos_pagos_det det
      INNER JOIN gastos_pagos pago ON det.id_pago = pago.id_pago
     WHERE pago.num_prev = '${numPrev}' 
  AND det.baja = false 
  AND det.factura = '${factura}'
  AND det.orden_pago = '${orden_pago}'
  AND det.orden_pago IS NOT NULL 
  AND (det.contrato = '${contrato}' OR det.contrato_modf = '${contrato_modf}')
ORDER BY det.fecha ASC`;

      const resultadosRaw = await this.detRepo.query(query);
      function numeroALetras(num: number): string {
        const unidades = ["", "uno", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve"];
        const especiales = ["diez", "once", "doce", "trece", "catorce", "quince", "dieciséis", "diecisiete", "dieciocho", "diecinueve"];
        const decenas = ["", "diez", "veinte", "treinta", "cuarenta", "cincuenta", "sesenta", "setenta", "ochenta", "noventa"];
        const centenas = ["", "cien", "doscientos", "trescientos", "cuatrocientos", "quinientos", "seiscientos", "setecientos", "ochocientos", "novecientos"];
        function convertirParte(n: number): string {
          if (n === 0) return "cero";
          if (n < 10) return unidades[n];
          if (n >= 10 && n < 20) return especiales[n - 10];
          if (n < 100) {
            let dec = Math.floor(n / 10);
            let uni = n % 10;
            if (dec === 2 && uni > 0) return "veinti" + unidades[uni];
            return decenas[dec] + (uni > 0 ? " y " + unidades[uni] : "");
          }
          if (n < 1000) {
            let cen = Math.floor(n / 100);
            let resto = n % 100;
            if (n === 100) return "cien";
            return centenas[cen] + (resto > 0 ? " " + convertirParte(resto) : "");
          }
          return "";
        }
      
        function convertirMiles(n: number): string {
          if (n === 0) return "";
          if (n < 1000) return convertirParte(n);
          let miles = Math.floor(n / 1000);
          let resto = n % 1000;
          let textoMiles = "";
          if (miles === 1) {
            textoMiles = "mil";
          } else {
            textoMiles = convertirParte(miles) + " mil";
          }
          if (resto > 0) {
            textoMiles += " " + convertirParte(resto);
          }
          return textoMiles;
        }
      
        function convertirMillones(n: number): string {
          if (n === 0) return "cero";
          let millones = Math.floor(n / 1000000);
          let resto = n % 1000000;
          let textoMillones = "";
          if (millones === 1) {
            textoMillones = "un millón";
          } else if (millones > 1) {
            textoMillones = convertirParte(millones) + " millones";
          }
          if (resto > 0) {
            textoMillones += " " + convertirMiles(resto);
          }
          return textoMillones;
        }
      
        const entero = Math.floor(num);
        const decimal = Math.round((num - entero) * 100);
      
        let textoEntero = convertirMillones(entero);
        let textoDecimal = decimal > 0 ? ` ${decimal}/100` : " 00/100";
      
        return textoEntero + textoDecimal;
      }
      const pago = resultadosRaw.map((item) => {
          return {
              
              orden_pago: item.orden_pago,
              fecha: item.fecha ? new Date(item.fecha).toLocaleDateString('es-ES') : '',
              proveedor: item.proveedor,
              detalle: item.detalle,
              importe: Number(item.importe).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
              literal_importe: item.literal_importe,
              servicios: item.servicios,
              des_servicios: item.des_servicios,
              contrato: item.contrato,
              contrato_convenio: item.contrato_convenio,
              fecha_inicio: item.fecha_inicio ? new Date(item.fecha_inicio).toLocaleDateString('es-ES') : '',
              fecha_final: item.fecha_final ? new Date(item.fecha_final).toLocaleDateString('es-ES') : '',
              prestacion_servicio: item.prestacion_servicio,
              hoja_ruta: item.hoja_ruta,
              factura: item.factura,
              nro_factura: item.nro_factura,
              reten_IT: Number(item.reten_IT).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
              reten_IVA: Number(item.reten_IVA).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
              total_reten: Number(item.total_reten).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
              retencion: Number(item.retencion).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
              liquido_pagable: Number(item.liquido_pagable).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
              estado: item.estado,
              num_prev: item.num_prev,
              num_comp: item.num_comp,
              num_pag: item.num_pag,
              entidad: item.entidad,
              unidad: item.unidad,
              glosa: item.glosa,
              presupuesto_inicial: Number(item.presupuesto_inicial).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
              saldo_presu: Number(item.saldo_presu).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
              fecha_elaboracion: item.fechaElab ? new Date(item.fechaElab).toLocaleDateString('es-ES') : '',
              fecha_recepcion: item.fechaRec ? new Date(item.fechaRec).toLocaleDateString('es-ES') : '',
              fechaReporte: new Date().toLocaleDateString('es-ES'),
              nombre: item.nombre,
              cargo: item.cargo,
              importeletras: numeroALetras(Number(item.importe || 0)).toUpperCase()+ ' BOLIVIANOS'
          };
      });

       // Totales (usar valores numéricos crudos)
  const toNumber = (v: any) =>
    typeof v === 'number' ? v : Number(String(v ?? 0).replace(/\./g, '').replace(',', '.')) || 0;
  const total_importe = pago.reduce((sum: number, it: any) => sum + toNumber(it.importe), 0);
  const total_total_reten = pago.reduce((sum: number, it: any) => sum + toNumber(it.total_reten), 0);
  const total_retencion = pago.reduce((sum: number, it: any) => sum + toNumber(it.retencion), 0);
  const total_liquido_pagable = pago.reduce((sum: number, it: any) => sum + toNumber(it.liquido_pagable), 0);
  const total_retenIT = pago.reduce((sum: number, it: any) => sum + toNumber(it.reten_IT), 0);
  const total_retenIVA = pago.reduce((sum: number, it: any) => sum + toNumber(it.reten_IVA), 0);
  const total_total_descuento = pago.reduce((sum: number, it: any) => sum + toNumber(it.total_descuentos ?? 0), 0);

  // Lógica para elegir el template
  const todosCero = pago.every(
    it =>
      toNumber(it.total_reten) === 0 &&
      toNumber(it.reten_IT) === 0 &&
      toNumber(it.reten_IVA) === 0
  );

  const templateFile = forceRetenCeroTemplate
    ? 'ordenes-pago-retenCero.odt'
    : (todosCero ? 'ordenes-pago-retenCero.odt' : 'ordenes-pago-report.odt');

  const templatePath = join(__dirname, '../../src/templates/', templateFile);

      const data = {

          numPrev,
          pago: pago,
          total_importe: total_importe.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
          total_total_reten: total_total_reten.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
          total_retencion: total_retencion.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
          total_liquido_pagable: total_liquido_pagable.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
          total_retenIT: total_retenIT.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
          total_retenIVA: total_retenIVA.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
          total_total_descuento: total_total_descuento.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      };
      const options = { convertTo: 'pdf' };
      return new Promise<Buffer>(async (resolve, reject) => {
          carbone.render(templatePath, data, options, async (err, result) => {
              if (!err && result) {
                  return resolve(result);
              }
              // Fallback: renderizar ODT y convertir con libreoffice-convert
              carbone.render(templatePath, data, (err2, odfBuffer) => {
                  if (err2) return reject(err);
                  this.convertWithLibreOffice(Buffer.from(odfBuffer), '.pdf')
                      .then(resolve)
                      .catch(() => reject(err));
              });
          });
      });
  }


   // Generar reporte de órdenes de pago por número de preventivo
//    async generateOrdenPagoSinFac(numPrev: string, factura:string, orden_pago:number): Promise<Buffer> {
//     const query = `
//        SELECT 
//         det.orden_pago,
//         det.fecha,
//         det.proveedor,
//         det.detalle,
//         det.importe,
//         det.literal_importe,
//         det.servicios,
//         det.des_servicios,
//         det.contrato,
//         det.contrato_convenio,
//         det.fecha_inicio,
//         det.fecha_final,
//         det.prestacion_servicio,
//         det.hoja_ruta,
//         det.factura,
//         det.nro_factura,
//         det."reten_IT",
//         det."reten_IVA",
//         det.total_reten,
//         det.retencion,
//         det.liquido_pagable,
//         det.estado,
//         pago.num_prev,
//         pago.num_comp,
//         pago.num_pag,
//         pago.entidad,
//         pago.unidad,
//         pago.glosa,
//         pago.presupuesto_inicial,
//         pago.saldo_presu,
//         pago."fechaElab",
//         pago."fechaRec",
//         det.nombre,
//         det.cargo
//     FROM gastos_pagos_det det
//     INNER JOIN gastos_pagos pago ON det.id_pago = pago.id_pago
//     WHERE pago.num_prev = '${numPrev}' AND det.baja = false AND det.factura = '${factura}'
//     AND det.orden_pago='${orden_pago}'AND det.orden_pago IS NOT NULL 
//     ORDER BY det.fecha ASC`;

//     const resultadosRaw = await this.detRepo.query(query);
//     function numeroALetras(num: number): string {
//       const unidades = ["", "uno", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve"];
//       const especiales = ["diez", "once", "doce", "trece", "catorce", "quince", "dieciséis", "diecisiete", "dieciocho", "diecinueve"];
//       const decenas = ["", "diez", "veinte", "treinta", "cuarenta", "cincuenta", "sesenta", "setenta", "ochenta", "noventa"];
//       const centenas = ["", "cien", "doscientos", "trescientos", "cuatrocientos", "quinientos", "seiscientos", "setecientos", "ochocientos", "novecientos"];
//       function convertirParte(n: number): string {
//         if (n === 0) return "cero";
//         if (n < 10) return unidades[n];
//         if (n >= 10 && n < 20) return especiales[n - 10];
//         if (n < 100) {
//           let dec = Math.floor(n / 10);
//           let uni = n % 10;
//           if (dec === 2 && uni > 0) return "veinti" + unidades[uni];
//           return decenas[dec] + (uni > 0 ? " y " + unidades[uni] : "");
//         }
//         if (n < 1000) {
//           let cen = Math.floor(n / 100);
//           let resto = n % 100;
//           if (n === 100) return "cien";
//           return centenas[cen] + (resto > 0 ? " " + convertirParte(resto) : "");
//         }
//         return "";
//       }
    
//       function convertirMiles(n: number): string {
//         if (n === 0) return "";
//         if (n < 1000) return convertirParte(n);
//         let miles = Math.floor(n / 1000);
//         let resto = n % 1000;
//         let textoMiles = "";
//         if (miles === 1) {
//           textoMiles = "mil";
//         } else {
//           textoMiles = convertirParte(miles) + " mil";
//         }
//         if (resto > 0) {
//           textoMiles += " " + convertirParte(resto);
//         }
//         return textoMiles;
//       }
    
//       function convertirMillones(n: number): string {
//         if (n === 0) return "cero";
//         let millones = Math.floor(n / 1000000);
//         let resto = n % 1000000;
//         let textoMillones = "";
//         if (millones === 1) {
//           textoMillones = "un millón";
//         } else if (millones > 1) {
//           textoMillones = convertirParte(millones) + " millones";
//         }
//         if (resto > 0) {
//           textoMillones += " " + convertirMiles(resto);
//         }
//         return textoMillones;
//       }
    
//       const entero = Math.floor(num);
//       const decimal = Math.round((num - entero) * 100);
    
//       let textoEntero = convertirMillones(entero);
//       let textoDecimal = decimal > 0 ? ` ${decimal}/100` : " 00/100";
    
//       return textoEntero + textoDecimal;
//     }
//       const pago = resultadosRaw.map((item) => {
//         return {
            
//             orden_pago: item.orden_pago,
//             fecha: item.fecha ? new Date(item.fecha).toLocaleDateString('es-ES') : '',
//             proveedor: item.proveedor,
//             detalle: item.detalle,
//             importe: Number(item.importe).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
//             literal_importe: item.literal_importe,
//             servicios: item.servicios,
//             des_servicios: item.des_servicios,
//             contrato: item.contrato,
//             contrato_convenio: item.contrato_convenio,
//             fecha_inicio: item.fecha_inicio ? new Date(item.fecha_inicio).toLocaleDateString('es-ES') : '',
//             fecha_final: item.fecha_final ? new Date(item.fecha_final).toLocaleDateString('es-ES') : '',
//             prestacion_servicio: item.prestacion_servicio,
//             hoja_ruta: item.hoja_ruta,
//             factura: item.factura,
//             nro_factura: item.nro_factura,
//             reten_IT: Number(item.reten_IT).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
//             reten_IVA: Number(item.reten_IVA).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
//             total_reten: Number(item.total_reten).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
//             retencion: Number(item.retencion).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
//             liquido_pagable: Number(item.liquido_pagable).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
//             estado: item.estado,
//             num_prev: item.num_prev,
//             num_comp: item.num_comp,
//             num_pag: item.num_pag,
//             entidad: item.entidad,
//             unidad: item.unidad,
//             glosa: item.glosa,
//             presupuesto_inicial: Number(item.presupuesto_inicial).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
//             saldo_presu: Number(item.saldo_presu).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
//             fecha_elaboracion: item.fechaElab ? new Date(item.fechaElab).toLocaleDateString('es-ES') : '',
//             fecha_recepcion: item.fechaRec ? new Date(item.fechaRec).toLocaleDateString('es-ES') : '',
//             fechaReporte: new Date().toLocaleDateString('es-ES'),
//             nombre: item.nombre,
//             cargo: item.cargo,
//             importeletras: numeroALetras(Number(item.importe || 0)).toUpperCase()
//         };
//     });

//     // Totales (usar valores numéricos crudos)
//     const total_importe = resultadosRaw.reduce((it) =>  Number(it.importe || 0), 0);
//     const total_total_reten = resultadosRaw.reduce((it) =>  Number(it.total_reten || 0), 0);
//     const total_retencion = resultadosRaw.reduce((it) =>  Number(it.retencion || 0), 0);
//     const total_liquido_pagable = resultadosRaw.reduce((it) =>  Number(it.liquido_pagable || 0), 0);
//     const total_retenIT = resultadosRaw.reduce((it) =>  Number(it.reten_IT || 0), 0);
//     const total_retenIVA = resultadosRaw.reduce((it) =>  Number(it.reten_IVA || 0), 0);
//     const total_total_descuento = resultadosRaw.reduce((it) =>  Number(it.descuento || 0), 0);
//     // Totales calculados desde el arreglo 'pago' (no usando agregaciones SQL)

//     const templatePath = join(__dirname, '../../src/templates/ordenes-pago-sin_fac.odt');
//     console.log(pago);

//     const data = {

//         numPrev,
//         pago: pago,
//         total_importe: total_importe.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
//         total_total_reten: total_total_reten.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
//         total_retencion: total_retencion.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
//         total_liquido_pagable: total_liquido_pagable.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
//         total_retenIT: total_retenIT.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
//         total_retenIVA: total_retenIVA.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
//         total_total_descuento: total_total_descuento.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
//     };
//     const options = { convertTo: 'pdf' };
//     return new Promise<Buffer>(async (resolve, reject) => {
//         carbone.render(templatePath, data, options, async (err, result) => {
//             if (!err && result) {
//                 return resolve(result);
//             }
//             // Fallback: renderizar ODT y convertir con libreoffice-convert
//             carbone.render(templatePath, data, (err2, odfBuffer) => {
//                 if (err2) return reject(err);
//                 this.convertWithLibreOffice(Buffer.from(odfBuffer), '.pdf')
//                     .then(resolve)
//                     .catch(() => reject(err));
//             });
//         });
//     });
// }
// Generar reporte de órdenes de pago por número de preventivo
// async generateOrdenPagoSinFac(numPrev: string, factura: string, orden_pago: number): Promise<Buffer> {
//   const query = `
//     SELECT 
//       det.orden_pago,
//       det.fecha,
//       det.proveedor,
//       det.detalle,
//       det.importe,
//       det.literal_importe,
//       det.servicios,
//       det.des_servicios,
//       det.contrato,
//       det.contrato_convenio,
//       det.fecha_inicio,
//       det.fecha_final,
//       det.prestacion_servicio,
//       det.hoja_ruta,
//       det.factura,
//       det.nro_factura,
//       det."reten_IT",
//       det."reten_IVA",
//       det.total_reten,
//       det.retencion,
//       det.liquido_pagable,
//       det.estado,
//       pago.num_prev,
//       pago.num_comp,
//       pago.num_pag,
//       pago.entidad,
//       pago.unidad,
//       pago.glosa,
//       pago.presupuesto_inicial,
//       pago.saldo_presu,
//       pago."fechaElab",
//       pago."fechaRec",
//       det.nombre,
//       det.varios,
//       det.monto_varios,
//       det.cargo
//     FROM gastos_pagos_det det
//     INNER JOIN gastos_pagos pago ON det.id_pago = pago.id_pago
//     WHERE pago.num_prev = '${numPrev}'
//       AND det.baja = false
//       AND det.factura = '${factura}'
//       AND det.orden_pago = '${orden_pago}'
//       AND det.orden_pago IS NOT NULL
//     ORDER BY det.fecha ASC
//   `;

//   const resultadosRaw = await this.detRepo.query(query);

//   // Asegurar parseo consistente de números (por si vienen como "2.569,46")
//   const toNumberRaw = (v: any) =>
//     typeof v === 'number' ? v : Number(String(v ?? 0).replace(/\./g, '').replace(',', '.')) || 0;

//   // Literal “xx yy/100”
//   function numeroALetras(num: number): string {
//     const unidades = ["", "uno", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve"];
//     const especiales = ["diez", "once", "doce", "trece", "catorce", "quince", "dieciséis", "diecisiete", "dieciocho", "diecinueve"];
//     const decenas = ["", "diez", "veinte", "treinta", "cuarenta", "cincuenta", "sesenta", "setenta", "ochenta", "noventa"];
//     const centenas = ["", "cien", "doscientos", "trescientos", "cuatrocientos", "quinientos", "seiscientos", "setecientos", "ochocientos", "novecientos"];

//     function convertirParte(n: number): string {
//       if (n === 0) return "cero";
//       if (n < 10) return unidades[n];
//       if (n < 20) return especiales[n - 10];
//       if (n < 100) {
//         const d = Math.floor(n / 10);
//         const u = n % 10;
//         if (d === 2 && u > 0) return "veinti" + unidades[u];
//         return decenas[d] + (u > 0 ? " y " + unidades[u] : "");
//       }
//       if (n < 1000) {
//         const c = Math.floor(n / 100);
//         const r = n % 100;
//         if (n === 100) return "cien";
//         return centenas[c] + (r > 0 ? " " + convertirParte(r) : "");
//       }
//       return "";
//     }

//     function convertirMiles(n: number): string {
//       if (n === 0) return "";
//       if (n < 1000) return convertirParte(n);
//       const miles = Math.floor(n / 1000);
//       const resto = n % 1000;
//       const textoMiles = miles === 1 ? "mil" : convertirParte(miles) + " mil";
//       return resto > 0 ? textoMiles + " " + convertirParte(resto) : textoMiles;
//     }

//     function convertirMillones(n: number): string {
//       if (n === 0) return "cero";
//       const millones = Math.floor(n / 1_000_000);
//       const resto = n % 1_000_000;
//       let texto = "";
//       if (millones === 1) texto = "un millón";
//       else if (millones > 1) texto = convertirParte(millones) + " millones";
//       return resto > 0 ? (texto ? texto + " " : "") + convertirMiles(resto) : (texto || "cero");
//     }

//     const entero = Math.floor(num);
//     const decimal = Math.round((num - entero) * 100);
//     const textoEntero = convertirMillones(entero);
//     const textoDecimal = ` ${String(decimal).padStart(2, '0')}/100`;
//     return textoEntero + textoDecimal;
//   }

//   const pago = resultadosRaw.map((item: any) => {
//     const importeNum = toNumberRaw(item.importe);
//     return {
//       orden_pago: item.orden_pago,
//       fecha: item.fecha ? new Date(item.fecha).toLocaleDateString('es-ES') : '',
//       proveedor: item.proveedor,
//       detalle: item.detalle,
//       importe: importeNum.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
//       literal_importe: item.literal_importe,
//       servicios: item.servicios,
//       des_servicios: item.des_servicios,
//       contrato: item.contrato,
//       contrato_convenio: item.contrato_convenio,
//       fecha_inicio: item.fecha_inicio ? new Date(item.fecha_inicio).toLocaleDateString('es-ES') : '',
//       fecha_final: item.fecha_final ? new Date(item.fecha_final).toLocaleDateString('es-ES') : '',
//       prestacion_servicio: item.prestacion_servicio,
//       hoja_ruta: item.hoja_ruta,
//       factura: item.factura,
//       nro_factura: item.nro_factura,
//       reten_IT: toNumberRaw(item.reten_IT).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
//       reten_IVA: toNumberRaw(item.reten_IVA).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
//       total_reten: toNumberRaw(item.total_reten).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
//       retencion: toNumberRaw(item.retencion).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
//       liquido_pagable: toNumberRaw(item.liquido_pagable).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
//       estado: item.estado,
//       num_prev: item.num_prev,
//       num_comp: item.num_comp,
//       num_pag: item.num_pag,
//       entidad: item.entidad,
//       unidad: item.unidad,
//       glosa: item.glosa,
//       presupuesto_inicial: toNumberRaw(item.presupuesto_inicial).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
//       saldo_presu: toNumberRaw(item.saldo_presu).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
//       fecha_elaboracion: item.fechaElab ? new Date(item.fechaElab).toLocaleDateString('es-ES') : '',
//       fecha_recepcion: item.fechaRec ? new Date(item.fechaRec).toLocaleDateString('es-ES') : '',
//       fechaReporte: new Date().toLocaleDateString('es-ES'),
//       nombre: item.nombre,
//       cargo: item.cargo,
//       importeletras: numeroALetras(importeNum).toUpperCase() + ' BOLIVIANOS',
//       varios: item.varios,
//       monto_varios:item.monto_varios
//     };
//   });

//   // Totales (sumar correctamente)
//   const sum = (arr: any[], key: string) => arr.reduce((acc, it) => acc + toNumberRaw(it[key]), 0);
//   const total_importe = sum(resultadosRaw, 'importe');
//   const total_total_reten = sum(resultadosRaw, 'total_reten');
//   const total_retencion = sum(resultadosRaw, 'retencion');
//   const total_liquido_pagable = sum(resultadosRaw, 'liquido_pagable');
//   const total_retenIT = sum(resultadosRaw, 'reten_IT');
//   const total_retenIVA = sum(resultadosRaw, 'reten_IVA');
//   const total_total_descuento = sum(resultadosRaw, 'descuento'); // si tu campo real es total_descuentos, cámbialo aquí

//   // Elegir template: si todos los proveedores son 'VARIOS' usar el alterno
//   const todosVarios = resultadosRaw.length > 0 && resultadosRaw.every((r: any) => String(r.proveedor).trim().toUpperCase() === 'VARIOS');

//   const templatePath = join(
//     __dirname,
//     '../../src/templates/',
//     todosVarios ? 'ordenes-pago-sin_fac-varios.odt' : 'ordenes-pago-sin_fac.odt'
//   );

//   const data = {
//     numPrev,
//     pago,
//     total_importe: total_importe.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
//     total_total_reten: total_total_reten.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
//     total_retencion: total_retencion.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
//     total_liquido_pagable: total_liquido_pagable.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
//     total_retenIT: total_retenIT.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
//     total_retenIVA: total_retenIVA.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
//     total_total_descuento: total_total_descuento.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
//   };

//   const options = { convertTo: 'pdf' };
//   return new Promise<Buffer>((resolve, reject) => {
//     carbone.render(templatePath, data, options, async (err, result) => {
//       if (!err && result) {
//         return resolve(result);
//       }
//       // Fallback: renderizar ODT y convertir con libreoffice-convert
//       carbone.render(templatePath, data, (err2, odfBuffer) => {
//         if (err2) return reject(err);
//         this.convertWithLibreOffice(Buffer.from(odfBuffer), '.pdf')
//           .then(resolve)
//           .catch(() => reject(err));
//       });
//     });
//   });
// }
// Generar reporte de órdenes de pago por número de preventivo
// Generar reporte de órdenes de pago por número de preventivo
async generateOrdenPagoSinFac(numPrev: string, factura: string, orden_pago: number): Promise<Buffer> {
  const query = `
    SELECT 
      det.orden_pago,
      det.fecha,
      det.proveedor,
      det.detalle,
      det.importe,
      det.literal_importe,
      det.servicios,
      det.des_servicios,
      det.contrato,
      det.contrato_convenio,
      det.fecha_inicio,
      det.fecha_final,
      det.prestacion_servicio,
      det.hoja_ruta,
      det.factura,
      det.nro_factura,
      det."reten_IT",
      det."reten_IVA",
      det.total_reten,
      det.retencion,
      det.liquido_pagable,
      det.estado,
      pago.num_prev,
      pago.num_comp,
      pago.num_pag,
      pago.entidad,
      pago.unidad,
      pago.glosa,
      pago.presupuesto_inicial,
      pago.saldo_presu,
      pago."fechaElab",
      pago."fechaRec",
      det.nombre,
      det.cargo,
      gpv.nombre as nombre_varios,
      gpv.monto as monto_varios
    FROM gastos_pagos_det det
    INNER JOIN gastos_pagos pago ON det.id_pago = pago.id_pago
    LEFT JOIN gastos_pagos_varios gpv ON det.id_pago_det = gpv.id_gastos_pagos_det_id AND gpv.baja = false
    WHERE pago.num_prev = '${numPrev}'
      AND det.baja = false
      AND det.factura = '${factura}'
      AND det.orden_pago = '${orden_pago}'
      AND det.orden_pago IS NOT NULL
    ORDER BY det.fecha ASC, gpv.id_varios ASC
  `;

  const resultadosRaw = await this.detRepo.query(query);

  const toNumberRaw = (v: any) =>
    typeof v === 'number' ? v : Number(String(v ?? 0).replace(/,/g, '')) || 0;

  function numeroALetras(num: number): string {
    const unidades = ["", "uno", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve"];
    const especiales = ["diez", "once", "doce", "trece", "catorce", "quince", "dieciséis", "diecisiete", "dieciocho", "diecinueve"];
    const decenas = ["", "diez", "veinte", "treinta", "cuarenta", "cincuenta", "sesenta", "setenta", "ochenta", "noventa"];
    const centenas = ["", "cien", "doscientos", "trescientos", "cuatrocientos", "quinientos", "seiscientos", "setecientos", "ochocientos", "novecientos"];

    function convertirParte(n: number): string {
      if (n === 0) return "cero";
      if (n < 10) return unidades[n];
      if (n < 20) return especiales[n - 10];
      if (n < 100) {
        const d = Math.floor(n / 10);
        const u = n % 10;
        if (d === 2 && u > 0) return "veinti" + unidades[u];
        return decenas[d] + (u > 0 ? " y " + unidades[u] : "");
      }
      if (n < 1000) {
        const c = Math.floor(n / 100);
        const r = n % 100;
        if (n === 100) return "cien";
        return centenas[c] + (r > 0 ? " " + convertirParte(r) : "");
      }
      return "";
    }

    function convertirMiles(n: number): string {
      if (n === 0) return "";
      if (n < 1000) return convertirParte(n);
      const miles = Math.floor(n / 1000);
      const resto = n % 1000;
      const textoMiles = miles === 1 ? "mil" : convertirParte(miles) + " mil";
      return resto > 0 ? textoMiles + " " + convertirParte(resto) : textoMiles;
    }

    function convertirMillones(n: number): string {
      if (n === 0) return "cero";
      const millones = Math.floor(n / 1_000_000);
      const resto = n % 1_000_000;
      let texto = "";
      if (millones === 1) texto = "un millón";
      else if (millones > 1) texto = convertirParte(millones) + " millones";
      return resto > 0 ? (texto ? texto + " " : "") + convertirMiles(resto) : (texto || "cero");
    }

    const entero = Math.floor(num);
    const decimal = Math.round((num - entero) * 100);
    let textoEntero = convertirMillones(entero);
    let textoDecimal = decimal > 0 ? ` con ${convertirParte(decimal)}/100` : " 00/100";
    return textoEntero + textoDecimal;
  }



  // Agrupar los resultados por orden_pago para consolidar los datos de varios
  const pagosMap = new Map();
  
  resultadosRaw.forEach((item: any) => {
    const key = item.orden_pago;
    
    if (!pagosMap.has(key)) {
      const importeNum = toNumberRaw(item.importe);
      
      pagosMap.set(key, {
        orden_pago: item.orden_pago,
        fecha: item.fecha ? new Date(item.fecha).toLocaleDateString('es-ES') : '',
        proveedor: item.proveedor,
        detalle: item.detalle,
        importe: importeNum.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        literal_importe: item.literal_importe,
        servicios: item.servicios,
        des_servicios: item.des_servicios,
        contrato: item.contrato,
        contrato_convenio: item.contrato_convenio,
        fecha_inicio: item.fecha_inicio ? new Date(item.fecha_inicio).toLocaleDateString('es-ES') : '',
        fecha_final: item.fecha_final ? new Date(item.fecha_final).toLocaleDateString('es-ES') : '',
        prestacion_servicio: item.prestacion_servicio,
        hoja_ruta: item.hoja_ruta,
        factura: item.factura,
        nro_factura: item.nro_factura,
        reten_IT: toNumberRaw(item.reten_IT).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        reten_IVA: toNumberRaw(item.reten_IVA).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        total_reten: toNumberRaw(item.total_reten).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        retencion: toNumberRaw(item.retencion).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        liquido_pagable: toNumberRaw(item.liquido_pagable).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        estado: item.estado,
        num_prev: item.num_prev,
        num_comp: item.num_comp,
        num_pag: item.num_pag,
        entidad: item.entidad,
        unidad: item.unidad,
        glosa: item.glosa,
        presupuesto_inicial: toNumberRaw(item.presupuesto_inicial).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        saldo_presu: toNumberRaw(item.saldo_presu).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        fecha_elaboracion: item.fechaElab ? new Date(item.fechaElab).toLocaleDateString('es-ES') : '',
        fecha_recepcion: item.fechaRec ? new Date(item.fechaRec).toLocaleDateString('es-ES') : '',
        fechaReporte: new Date().toLocaleDateString('es-ES'),
        nombre: item.nombre,
        cargo: item.cargo,
        importeletras: numeroALetras(importeNum).toUpperCase() + ' BOLIVIANOS',
        
        // Arrays para datos de varios
        variosList: [],
        variosPretty: '',
        montosPretty: '',
        montosTotal: '',
        montosTotalNum: 0
      });
    }
    
    // Si hay datos de varios, agregarlos al array
    if (item.nombre_varios && item.monto_varios) {
      const pagoData = pagosMap.get(key);
      pagoData.variosList.push({
        nombre: item.nombre_varios,
        monto: Number(item.monto_varios)
      });
    }
  });

  // Procesar los datos de varios para cada pago
  const pago = Array.from(pagosMap.values()).map((item: any) => {
    if (item.variosList.length > 0) {
      item.variosPretty = item.variosList.map((v: any) => v.nombre).join('\n');
      item.montosPretty = item.variosList.map((v: any) => Number(v.monto).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })).join('\n');
      item.montosTotalNum = item.variosList.reduce((sum: number, v: any) => sum + Number(v.monto), 0);
      item.montosTotal = item.montosTotalNum.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    return item;
  });

  // Diagnóstico rápido en consola
  // console.log('>>> variosPretty:\n', pago[0]?.variosPretty);
  // console.log('>>> montosPretty:\n', pago[0]?.montosPretty);
  // console.log('>>> montosTotal:', pago[0]?.montosTotal);

  // Totales generales
  const sum = (arr: any[], key: string) => arr.reduce((acc, it) => acc + toNumberRaw(it[key]), 0);
  const total_importe = sum(resultadosRaw, 'importe');
  const total_total_reten = sum(resultadosRaw, 'total_reten');
  const total_retencion = sum(resultadosRaw, 'retencion');
  const total_liquido_pagable = sum(resultadosRaw, 'liquido_pagable');
  const total_retenIT = sum(resultadosRaw, 'reten_IT');
  const total_retenIVA = sum(resultadosRaw, 'reten_IVA');
  const total_total_descuento = sum(resultadosRaw, 'total_descuentos');

  // Elegir template
  const todosVarios =
    resultadosRaw.length > 0 &&
    resultadosRaw.every((r: any) => String(r.proveedor).trim().toUpperCase() === 'VARIOS');

  const templatePath = join(
    __dirname,
    '../../src/templates/',
    todosVarios ? 'ordenes-pago-sin_fac-varios.odt' : 'ordenes-pago-sin_fac.odt'
  );

  const data = {
    numPrev,
    pago,
    total_importe: total_importe.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    total_total_reten: total_total_reten.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    total_retencion: total_retencion.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    total_liquido_pagable: total_liquido_pagable.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    total_retenIT: total_retenIT.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    total_retenIVA: total_retenIVA.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    total_total_descuento: total_total_descuento.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
  };

  const options = { convertTo: 'pdf' };
  return new Promise<Buffer>((resolve, reject) => {
    carbone.render(templatePath, data, options, async (err, result) => {
      if (!err && result) {
        return resolve(result);
      }
      carbone.render(templatePath, data, (err2, odfBuffer) => {
        if (err2) return reject(err);
        this.convertWithLibreOffice(Buffer.from(odfBuffer), '.pdf')
          .then(resolve)
          .catch(() => reject(err));
      });
    });
  });
}

  async getDashboardPagosPorArea(): Promise<any[]> {
    try {
      const query = `
        SELECT 
          COALESCE(servicios, 'Sin Servicios') as servicios,
          COALESCE(SUM(CAST(importe AS DECIMAL)), 0) as total_importe,
          COALESCE(SUM(CAST(presupuesto_inicial AS DECIMAL)), 0) as total_presupuesto_inicial,
          COALESCE(SUM(CAST(saldo_presupuestario AS DECIMAL)), 0) as total_saldo_presupuestario,
          COUNT(*) as total_pagos
        FROM gastos_pagos_det 
        WHERE servicios IS NOT NULL 
          AND servicios != ''
          AND servicios != 'null'
        GROUP BY servicios
        ORDER BY total_importe DESC
      `;

      const resultado = await this.dataSource.query(query);
      
      return resultado.map(item => ({
        area: item.servicios,
        importe: Number(item.total_importe) || 0,
        presupuestoInicial: Number(item.total_presupuesto_inicial) || 0,
        saldoPresupuestario: Number(item.total_saldo_presupuestario) || 0,
        totalPagos: Number(item.total_pagos) || 0
      }));
    } catch (error) {
      console.error('Error en getDashboardPagosPorArea:', error);
      return [];
    }
  }

  }


