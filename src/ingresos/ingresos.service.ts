
import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IngresosEntity } from './ingresos.entity';
import { Repository } from 'typeorm';
import { join } from 'path';
import * as carbone from 'carbone';
import * as libreofficeConvert from 'libreoffice-convert';
import { PDFDocument } from 'pdf-lib';
import * as pdfParse from 'pdf-parse';
import * as XLSX from 'xlsx';

@Injectable()
export class IngresosService {
  constructor(
    @InjectRepository(IngresosEntity)
    private readonly ingresoRepository: Repository<IngresosEntity>
  ) { }
  
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

  // async create(
  //   id_ingresos: Partial<IngresosEntity>,
  // ): Promise<IngresosEntity> {
  //   const nuevoIngreso = this.ingresoRepository.create(id_ingresos);
  //   return await this.ingresoRepository.save(nuevoIngreso)
    
  // }
  async getMaxNumRecibo(): Promise<number> {
    try {
      const result = await this.ingresoRepository
        .createQueryBuilder('ingresos')
        .select('MAX(ingresos.num_recibo)', 'max')
        .getRawOne();

      const maxNum = result?.max ?? 0;
      return Number(maxNum);
    } catch (error) {
      console.error('Error fetching max num_recibo:', error);
      throw new InternalServerErrorException('Error fetching max num_recibo');
    }
  }
  async create(ingresoData: Partial<IngresosEntity>): Promise<IngresosEntity> {
    let nextNumRecibo = await this.getMaxNumRecibo(); // You need to implement this method to get max num_recibo
  
    if (!nextNumRecibo || nextNumRecibo < 1000) {
      nextNumRecibo = 1000;
    } else {
      nextNumRecibo += 1;
    }
  
    ingresoData.num_recibo = nextNumRecibo;
  
    const ingreso = this.ingresoRepository.create(ingresoData);
    return this.ingresoRepository.save(ingreso);
  }



  async findAll(): Promise<IngresosEntity[]> {
    return await this.ingresoRepository.find()
  }

  async findOne(id_ingresos: number): Promise<IngresosEntity | null> {
    return await this.ingresoRepository.findOneBy({ id_ingresos });
  }
  async update(
    id_ingresos: number,
    ingresoActualizado: Partial<IngresosEntity>,
  ): Promise<IngresosEntity> {
    ingresoActualizado.fecha_edicion = new Date();
    await this.ingresoRepository.update(id_ingresos, ingresoActualizado);
    const ingresoActualizadoDesdeDb = await this.ingresoRepository.findOneBy({
      id_ingresos,
    });
    if (!ingresoActualizadoDesdeDb) {
      throw new NotFoundException(
        `No se pudo encontrar el insumo con ID ${id_ingresos} después de la actualización.`,
      );
    }
    return ingresoActualizadoDesdeDb;
  }

  async borradologico(id_ingresos: number): Promise<{ deleted: boolean; message?: string }> {
    const ingresoToUpdate = await this.ingresoRepository.findOne({
      where: { id_ingresos },
    });
    if (!ingresoToUpdate) {
      throw new NotFoundException(`Ingreso con ID ${id_ingresos} no encontrado.`);
    }
    if (ingresoToUpdate.baja === true) {
      return { deleted: false, message: `Ingreso con ID ${id_ingresos} ya estaba dado de baja lógicamente.` };
    }
    ingresoToUpdate.baja = true;
    await this.ingresoRepository.save(ingresoToUpdate);
    return { deleted: true, message: `Ingreso con ID ${id_ingresos} dado de baja lógicamente.` };
  }

  // async getNextNumDeposito(): Promise<number> {
  //   try {
  //     const result = await this.ingresoRepository
  //       .createQueryBuilder('ingresos')
  //       .select('MAX(ingresos.num_depo)', 'max')
  //       .where('ingresos.op_tipoemision = :value', { value: false })
  //       .getRawOne();

  //     const maxNum = result?.max ?? 0;
  //     return Number(maxNum) + 1;
  //   } catch (error) {
  //     console.error('Error fetching next num_depo:', error);
  //     throw new InternalServerErrorException('Error fetching next num_deposito');
  //   }
  // }
  async getMaxNumFactura(): Promise<number | null> {
    try {
      const result = await this.ingresoRepository
        .createQueryBuilder('ingresos')
        .select('MAX(ingresos.num_factura)', 'max')
        .where('ingresos.op_tipoemision = :value', { value: true })
        .getRawOne();

      const maxNum = result?.max ?? 0;
      return Number(maxNum) + 1;
    } catch (error) {
      console.error('Error fetching next num_factura:', error);
      throw new InternalServerErrorException('Error fetching next num_deposito');
    }
  }

  async generateReportLugar(fecha: string, lugar: string): Promise<Buffer> {
    // Se espera que la fecha venga en formato 'YYYY-MM-DD'
    const query = `
         SELECT
              fecha,
              lugar,
              fecha_reg,
              proveedor,
              detalle,
              tipo_ingres,
              monto,
              estado,
              SUM(monto) OVER () as total_montos
          FROM ingresos
          WHERE estado = 'CONSOLIDADO' AND baja = false AND CAST(fecha AS DATE) = '${fecha}' AND lugar= '${lugar}'
          ORDER BY fecha ASC`;

    const ingresosRaw = await this.ingresoRepository.query(query);
    let totalAcumulado = 0;
    let ultimoNumeroFormulario = 1000;
    const ingresos = ingresosRaw.map((item) => {
      if (

        !item.lugar ||
        !item.proveedor ||
        !item.detalle ||
        !item.tipo_ingres ||
        !item.fecha_reg ||
        item.monto == null

      ) {
        throw new Error('Invalid ingreso data: missing required fields');
      }

      totalAcumulado += Number(item.monto);

      return {
       fechaReporte: new Date().toLocaleDateString('es-ES'),
        total_montos: Number(item.total_montos).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        lugar: item.lugar,
        proveedor: item.proveedor,
        detalle: item.detalle,
        tipoIngreso: item.tipo_ingres,
        importe: Number(item.monto).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        totalAcumulado,
        montoOriginal: Number(item.monto).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        numeroFormulario: ultimoNumeroFormulario++,
        totalConsolidados: ingresosRaw.length,
        fecha2: new Date(item.fecha_reg).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }),
        fecha: new Date(item.fecha_reg).toLocaleDateString('es-ES', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      };
    });

    const templatePath = join(__dirname, '../../src/templates/ingresos-report-lugar.odt');
    console.log(ingresos);
    const montoOriginalTotal = totalAcumulado;
    const fecha1 = ingresos.length > 0 ? new Date(ingresos[0].fecha_reg).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : '';
    const fecha2 = ingresos.length > 0 ? new Date(ingresos[0].fecha_reg).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '';
    const totalConsolidados = ingresosRaw.length; 
    ultimoNumeroFormulario++;
    const numeroFormulario = ultimoNumeroFormulario;
    const data = {
      lugar: ingresos.length > 0 ? ingresos[0].lugar : '',
      fecha: new Date().toLocaleDateString(),
      fecha1,
      fecha2,
      numeroFormulario,
      totalConsolidados,
      montoOriginalTotal,
      ingresos: ingresos
    };
    const options = { convertTo: 'pdf' };
    return new Promise<Buffer>(async (resolve, reject) => {
      carbone.render(templatePath, data, options, async (err, result) => {
        if (!err && result) {
          return resolve(result);
        }
        // Fallback: render ODT y convertir con libreoffice-convert
        carbone.render(templatePath, data, (err2, odfBuffer) => {
          if (err2) return reject(err);
          this.convertWithLibreOffice(Buffer.from(odfBuffer), '.pdf')
            .then(resolve)
            .catch(() => reject(err));
        });
      });
    });
  }
  async generateReport(fecha: string): Promise<Buffer> {
    // Se espera que la fecha venga en formato 'YYYY-MM-DD'
    const query = `
         SELECT
              fecha,
              lugar,
              fecha_reg,
              proveedor,
              detalle,
              tipo_ingres,
              monto,
              estado,
              SUM(monto) OVER () as total_montos
          FROM ingresos
          WHERE estado = 'CONSOLIDADO' AND baja = false AND CAST(fecha AS DATE) = '${fecha}'
          ORDER BY fecha ASC`;

    const ingresosRaw = await this.ingresoRepository.query(query);
    let totalAcumulado = 0;
    let ultimoNumeroFormulario = 1000;
    const ingresos = ingresosRaw.map((item) => {
      if (

        !item.lugar ||
        !item.proveedor ||
        !item.detalle ||
        !item.tipo_ingres ||
        !item.fecha_reg ||
        item.monto == null

      ) {
        throw new Error('Invalid ingreso data: missing required fields');
      }

      totalAcumulado += Number(item.monto);

      return {
       fechaReporte: new Date().toLocaleDateString('es-ES'),
        total_montos: Number(item.total_montos).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        lugar: item.lugar,
        proveedor: item.proveedor,
        detalle: item.detalle,
        tipoIngreso: item.tipo_ingres,
        importe: Number(item.monto).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        totalAcumulado,
        montoOriginal: Number(item.monto).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        numeroFormulario: ultimoNumeroFormulario++,
        totalConsolidados: ingresosRaw.length,
        fecha2: new Date(item.fecha_reg).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }),
        fecha: new Date(item.fecha_reg).toLocaleDateString('es-ES', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      };
    });

    const templatePath = join(__dirname, '../../src/templates/ingresos-report.odt');
    console.log(ingresos);
    const montoOriginalTotal = totalAcumulado;
    const fecha1 = ingresos.length > 0 ? new Date(ingresos[0].fecha_reg).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : '';
    const fecha2 = ingresos.length > 0 ? new Date(ingresos[0].fecha_reg).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '';
    const totalConsolidados = ingresosRaw.length; 
    ultimoNumeroFormulario++;
    const numeroFormulario = ultimoNumeroFormulario;
    const data = {
      lugar: ingresos.length > 0 ? ingresos[0].lugar : '',
      fecha: new Date().toLocaleDateString(),
      fecha1,
      fecha2,
      numeroFormulario,
      totalConsolidados,
      montoOriginalTotal,
      ingresos: ingresos
    };
    const options = { convertTo: 'pdf' };
    return new Promise<Buffer>(async (resolve, reject) => {
      carbone.render(templatePath, data, options, async (err, result) => {
        if (!err && result) {
          return resolve(result);
        }
        // Fallback: render ODT y convertir con libreoffice-convert
        carbone.render(templatePath, data, (err2, odfBuffer) => {
          if (err2) return reject(err);
          this.convertWithLibreOffice(Buffer.from(odfBuffer), '.pdf')
            .then(resolve)
            .catch(() => reject(err));
        });
      });
    });
  }
/****************reporte diario en excel***************/ 
async generateReportLugarExcel(fecha: string, lugar: string): Promise<Buffer> {
  // Se espera que la fecha venga en formato 'YYYY-MM-DD'
  const query = `
       SELECT
            fecha,
            lugar,
            fecha_reg,
            proveedor,
            detalle,
            tipo_ingres,
            monto,
            estado,
            SUM(monto) OVER () as total_montos
        FROM ingresos
        WHERE estado = 'CONSOLIDADO' AND baja = false AND CAST(fecha AS DATE) = '${fecha}' AND lugar= '${lugar}'
        ORDER BY fecha ASC`;

  const ingresosRaw = await this.ingresoRepository.query(query);
  let totalAcumulado = 0;
  let ultimoNumeroFormulario = 1000;
  const ingresos = ingresosRaw.map((item) => {
    if (

      !item.lugar ||
      !item.proveedor ||
      !item.detalle ||
      !item.tipo_ingres ||
      !item.fecha_reg ||
      item.monto == null

    ) {
      throw new Error('Invalid ingreso data: missing required fields');
    }

    totalAcumulado += Number(item.monto);

    return {
     fechaReporte: new Date().toLocaleDateString('es-ES'),
      total_montos: Number(item.total_montos).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      lugar: item.lugar,
      proveedor: item.proveedor,
      detalle: item.detalle,
      tipoIngreso: item.tipo_ingres,
      importe: Number(item.monto).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      totalAcumulado,
      montoOriginal: Number(item.monto).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      numeroFormulario: ultimoNumeroFormulario++,
      totalConsolidados: ingresosRaw.length,
      fecha2: new Date(item.fecha_reg).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }),
      fecha: new Date(item.fecha_reg).toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    };
  });

  const templatePath = join(__dirname, '../../src/templates/ingresos-report-lugar.ods');
  console.log(ingresos);
  const montoOriginalTotal = totalAcumulado;
  const fecha1 = ingresos.length > 0 ? new Date(ingresos[0].fecha_reg).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : '';
  const fecha2 = ingresos.length > 0 ? new Date(ingresos[0].fecha_reg).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '';
  const totalConsolidados = ingresosRaw.length; 
  ultimoNumeroFormulario++;
  const numeroFormulario = ultimoNumeroFormulario;
  const data = {
    lugar: ingresos.length > 0 ? ingresos[0].lugar : '',
    fecha: new Date().toLocaleDateString(),
    fecha1,
    fecha2,
    numeroFormulario,
    totalConsolidados,
    montoOriginalTotal,
    ingresos: ingresos
  };
  const options = { convertTo: 'xlsx' };
  return new Promise<Buffer>(async (resolve, reject) => {
    carbone.render(templatePath, data, options, async (err, result) => {
      if (!err && result) {
        return resolve(result);
      }
      // Fallback: render ODS y convertir con libreoffice-convert
      carbone.render(templatePath, data, (err2, odfBuffer) => {
        if (err2) return reject(err);
        this.convertWithLibreOffice(Buffer.from(odfBuffer), '.xlsx')
          .then(resolve)
          .catch(() => reject(err));
      });
    });
  });
}
async generateReportExcel(fecha: string): Promise<Buffer> {
  // Se espera que la fecha venga en formato 'YYYY-MM-DD'
  const query = `
       SELECT
            fecha,
            lugar,
            fecha_reg,
            proveedor,
            detalle,
            tipo_ingres,
            monto,
            estado,
            SUM(monto) OVER () as total_montos
        FROM ingresos
        WHERE estado = 'CONSOLIDADO' AND baja = false AND CAST(fecha AS DATE) = '${fecha}'
        ORDER BY fecha ASC`;

  const ingresosRaw = await this.ingresoRepository.query(query);
  let totalAcumulado = 0;
  let ultimoNumeroFormulario = 1000;
  const ingresos = ingresosRaw.map((item) => {
    if (

      !item.lugar ||
      !item.proveedor ||
      !item.detalle ||
      !item.tipo_ingres ||
      !item.fecha_reg ||
      item.monto == null

    ) {
      throw new Error('Invalid ingreso data: missing required fields');
    }

    totalAcumulado += Number(item.monto);

    return {
     fechaReporte: new Date().toLocaleDateString('es-ES'),
      total_montos: Number(item.total_montos).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      lugar: item.lugar,
      proveedor: item.proveedor,
      detalle: item.detalle,
      tipoIngreso: item.tipo_ingres,
      importe: Number(item.monto).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      totalAcumulado,
      montoOriginal: Number(item.monto).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      numeroFormulario: ultimoNumeroFormulario++,
      totalConsolidados: ingresosRaw.length,
      fecha2: new Date(item.fecha_reg).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }),
      fecha: new Date(item.fecha_reg).toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    };
  });

  const templatePath = join(__dirname, '../../src/templates/ingresos-report.ods');
  console.log(ingresos);
  const montoOriginalTotal = totalAcumulado;
  const fecha1 = ingresos.length > 0 ? new Date(ingresos[0].fecha_reg).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : '';
  const fecha2 = ingresos.length > 0 ? new Date(ingresos[0].fecha_reg).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '';
  const totalConsolidados = ingresosRaw.length; 
  ultimoNumeroFormulario++;
  const numeroFormulario = ultimoNumeroFormulario;
  const data = {
    lugar: ingresos.length > 0 ? ingresos[0].lugar : '',
    fecha: new Date().toLocaleDateString(),
    fecha1,
    fecha2,
    numeroFormulario,
    totalConsolidados,
    montoOriginalTotal,
    ingresos: ingresos
  };
  const options = { convertTo: 'xlsx' };
  return new Promise<Buffer>(async (resolve, reject) => {
    carbone.render(templatePath, data, options, async (err, result) => {
      if (!err && result) {
        return resolve(result);
      }
      // Fallback: render ODS y convertir con libreoffice-convert
      carbone.render(templatePath, data, (err2, odfBuffer) => {
        if (err2) return reject(err);
        this.convertWithLibreOffice(Buffer.from(odfBuffer), '.xlsx')
          .then(resolve)
          .catch(() => reject(err));
      });
    });
  });
}

async generateReporteRecibo(id_ingresos: number): Promise<Buffer> {
  const query = `
  SELECT
       num_recibo,
       fecha,
       lugar,
       fecha_reg,
       proveedor,
       detalle,
       tipo_ingres,
       monto,
       importe_total,
       servicio,
       estado
   FROM ingresos
   WHERE estado = 'CONSOLIDADO' AND baja = false AND id_ingresos = ${id_ingresos}
   ORDER BY fecha ASC`;

   const ingresosRaw = await this.ingresoRepository.query(query);
   const ingresos = ingresosRaw.map((item) => {
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
      let textoDecimal = decimal > 0 ? " con " + convertirParte(decimal) : " con cero";
    
      return textoEntero + textoDecimal;
    }
       return {
           num_recibo: item.num_recibo,
           servicio: item.servicio,
           tipo_ingres: item.tipo_ingres,
           proveedor: item.proveedor,
           detalle: item.detalle,
           importe_total: Number(item.importe_total).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
           fecha: new Date(item.fecha).toLocaleDateString('es-ES'),
           fechaReporte: new Date().toLocaleDateString('es-ES'),
           importeTotalLetras: numeroALetras(Number(item.importe_total)),

       };
   });

   const templatePath = join(__dirname, '../../src/templates/recibo.odt');
   console.log(ingresos);

   const data = {
       //tipo_ingres,
       ingresos: ingresos
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

  /**
   * Extrae datos de un PDF con formularios (AcroForm)
   */
  async parsePdfForm(buffer: Buffer): Promise<Partial<IngresosEntity>> {
    try {
      const pdfDoc = await PDFDocument.load(buffer);
      const form = pdfDoc.getForm();

      const getFieldValue = (name: string) => {
        try {
          const field = form.getFieldMaybe(name);
          if (field && 'getText' in field) {
            return (field as any).getText?.() ?? null;
          }
          return null;
        } catch (error) {
          console.warn(`Error reading field ${name}:`, error.message);
          return null;
        }
      };

      // Mapeo de campos del PDF a la entidad IngresosEntity
      const data = {
        proveedor: getFieldValue('NOMBRE') || getFieldValue('RAZON_SOCIAL') || getFieldValue('PROVEEDOR') || getFieldValue('proveedor') || undefined,
        detalle: getFieldValue('DESCRIPCIÓN') || getFieldValue('DETALLE') || getFieldValue('CONCEPTO') || getFieldValue('FORMULARIO') || getFieldValue('AVISO') || getFieldValue('NOVEDADES') || undefined,
        monto: this.parseNumber(getFieldValue('MONTO_A_PAGAR')),
        num_factura: this.parseNumber(getFieldValue('FACTURA_N') || getFieldValue('FACTURA_N°') || getFieldValue('num_factura') || getFieldValue('FACTURA')) || undefined,
        
        // Campos de fecha - mapeo específico
        fecha: this.parseDate(getFieldValue('FECHA') || getFieldValue('fecha')) || undefined,
        nit: this.parseNumber(getFieldValue('NIT') || getFieldValue('CI') || getFieldValue('CEX') || getFieldValue('NIT_CI_CEX') || getFieldValue('nit')) || undefined,
      };
      return data;
    } catch (error) {
      console.error('Error parsing PDF form:', error);
      throw new InternalServerErrorException(`Error al procesar PDF: ${error.message}`);
    }
  }

  /**
   * Extrae el monto de forma robusta, aceptando variantes y formatos decimales
   */
  private extractMontoRobusto(text: string): number | undefined {
    const patterns = [
      /MONTO\s*A\s*PAGAR[^\d]*([\d.,]+)/i,
      /MONTO[^\d]*([\d.,]+)/i,
      /IMPORTE[^\d]*([\d.,]+)/i,
      /TOTAL[^\d]*([\d.,]+)/i,
      /A PAGAR[^\d]*([\d.,]+)/i
    ];
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        console.log(`Valor extraído con patrón ${pattern}: ${match[1]}`);
        const parsed = this.parseNumber(match[1]);
        console.log(`Valor parseado: ${parsed}`);
        return parsed;
      }
    }
    const generic = text.match(/([\d]{1,3}(?:[.,][\d]{3})*[.,][\d]{2})/);
    if (generic && generic[1]) {
      console.log(`Valor extraído genérico: ${generic[1]}`);
      const parsed = this.parseNumber(generic[1]);
      console.log(`Valor parseado genérico: ${parsed}`);
      return parsed;
    }
    return undefined;
  }

  /**
   * Extrae datos de un PDF de texto plano usando regex
   */
  async parsePdfText(buffer: Buffer): Promise<Partial<IngresosEntity>> {
    try {
      const { text } = await pdfParse(buffer);
      
      // Debug: Mostrar el texto extraído para debugging
      console.log('=== TEXTO EXTRAÍDO DEL PDF ===');
      console.log(text);
      console.log('=== FIN DEL TEXTO ===');
      
      // Función helper para extraer valores con regex
      const extractValue = (pattern: RegExp): string | null => {
        const match = text.match(pattern);
        if (match) {
          console.log(`Patrón encontrado: ${pattern} -> Valor: ${match[1]?.trim()}`);
        }
        return match ? match[1]?.trim() : null;
      };

      // Función helper para extraer valores multilínea
      // ... existing code ...
const extractMultilineValue = (pattern: RegExp): string | null => {
  const match = text.match(pattern);
  if (match) {
    let value = match[1]?.trim() || '';
    const lines = text.split('\n');
    const matchIndex = text.indexOf(match[0]);
    const matchLineIndex = text.substring(0, matchIndex).split('\n').length - 1;

    for (let i = matchLineIndex + 1; i < lines.length; i++) {
      const nextLine = lines[i].trim();

      // Check current and next 2 lines for "CÓDIGO PRODUCTO /" allowing spaces and line breaks
      const lookaheadLines = lines.slice(i, i + 3).map(l => l.trim()).join(' ');
      if (/CÓDIGO\s*PRODUCTO\s*\//i.test(lookaheadLines)) {
        break;
      }

      if (
        nextLine &&
        !nextLine.includes(':') &&
        !nextLine.match(/^\d+$/) &&
        !nextLine.match(/^\d+[.,]\d+$/) &&
        !nextLine.match(/^[A-Z\s]+$/) &&
        nextLine.length > 2
      ) {
        value += ' ' + nextLine;
      } else {
        break;
      }
    }
    return value;
  }
  return null;
};
// ... existing code ...
      // const extractMultilineValue = (pattern: RegExp): string | null => {
      //   const match = text.match(pattern);
      //   if (match) {
      //     let value = match[1]?.trim() || '';
      //     const lines = text.split('\n');
      //     const matchIndex = text.indexOf(match[0]);
      //     const matchLineIndex = text.substring(0, matchIndex).split('\n').length - 1;
      
      //     for (let i = matchLineIndex + 1; i < lines.length; i++) {
      //       const nextLine = lines[i].trim();
      //       // Exclude lines with trailing labels explicitly
      //       const trailingLabels = ['Cod. Cliente', 'OtroEtiqueta']; // Add other labels as needed
      //       const containsTrailingLabel = trailingLabels.some(label => nextLine.includes(label));
      
      //       if (nextLine &&
      //           !nextLine.includes(':') &&
      //           !nextLine.match(/^\d+$/) &&
      //           !nextLine.match(/^\d+[.,]\d+$/) &&
      //           !nextLine.match(/^[A-Z\s]+$/) &&
      //           nextLine.length > 2 &&
      //           !containsTrailingLabel) {
      //         value += ' ' + nextLine;
      //       } else {
      //         break;
      //       }
      //     }
      //     return value;
      //   }
      //   return null;
      // };
      // Función especial para extraer detalle con patrones específicos
      const extractDetalle = (): string | null => {
        const patterns = [
          /DESCRIPCIÓN[:\s]+(.+?)(?:\n|$)/i
        ];
      
        for (const pattern of patterns) {
          const match = text.match(pattern);
          if (match) {
            let value = match[1]?.trim() || '';
            const lines = text.split('\n');
            const matchIndex = text.indexOf(match[0]);
            const matchLineIndex = text.substring(0, matchIndex).split('\n').length - 1;
      
            for (let i = matchLineIndex + 1; i < lines.length; i++) {
              const nextLine = lines[i].trim();
      
              // Skip lines containing unwanted keywords anywhere in the line
              if (/PRECIO|UNITARIO|DESCUENTO|SUBTOTAL|P\d+(\.\d{2})?|Unidad \(Servicios\)/i.test(nextLine)) {
                continue; // skip this line, do not add to value
              }
      
              // Allow colons only if line looks like part of description, not a label (e.g., no digits before colon)
              const isLabelLine = nextLine.includes(':') && /^\D+:\s/.test(nextLine) === false;
      
              if (
                nextLine &&
                (!nextLine.includes(':') || !isLabelLine) &&
                !nextLine.match(/^\d+$/) &&
                !nextLine.match(/^\d+[.,]\d+$/) &&
                nextLine.length > 2
              ) {
                value += ' ' + nextLine; // Concatenate with space
              } else {
                break;
              }
            }
            return value;
          }
        }
        return null;
      };
      // Patrones de regex para extraer datos específicos de facturas
      const data = {
        proveedor: extractMultilineValue(/Nombre\/Razón Social[:\s]+([\s\S]+?)(?=Cod\. Cliente|CÓDIGO[\s\S]*?PRODUCTO\s*\/|$)/i) || undefined,
        detalle: extractDetalle() || undefined,  // Cambiado para evitar la cadena literal 'DESCRIPCIÓN'
        // Campos numéricos - mapeo específico para facturas
        monto: this.extractMontoRobusto(text),
      
        num_factura: this.parseNumber(extractValue(/FACTURA\s+N°?\s*(\d+)/i) || 
                                     extractValue(/Factura\s+N°?\s*(\d+)/i) ||
                                     extractValue(/FACTURA\s+(\d+)/i) ||
                                     extractValue(/Factura\s+(\d+)/i) ||
                                     extractValue(/N°?\s*(\d+)/i) ||
                                     extractValue(/FACTURA\s*N°\s*(\d+)/i)) || undefined,

        // Campos adicionales - mapeo específico para facturas
        nit: this.parseNumber(extractValue(/NIT\/CI\/CEX[:\s]+(\d+)/i) ) || undefined,
        fecha: this.parseDate(extractValue(/Fecha[:\s]+(.+?)(?:\n|$)/i) || extractValue(/FECHA[:\s]+(.+?)(?:\n|$)/i) || extractValue(/fecha[:\s]+(.+?)(?:\n|$)/i)) || undefined,
       // cuenta: extractValue(/Cuenta[:\s]+(.+?)(?:\n|$)/i) || undefined,
    
      };

      // Validar campos requeridos
      // if ( !data.proveedor || !data.detalle || !data.monto) {
      //   throw new Error('Faltan campos requeridos en el PDF:  proveedor, detalle o monto');
      // }
      console.log('Monto extraído y antes de parseNumber:', data.monto);
      return data;
    } catch (error) {
      console.error('Error parsing PDF text:', error);
      throw new InternalServerErrorException(`Error al procesar PDF: ${error.message}`);
    }
  }

  /**
   * Método principal para importar PDF (detecta automáticamente el tipo)
   */
  async importPdf(buffer: Buffer): Promise<IngresosEntity> {
    try {
      // Primero intentar como formulario
      let data: Partial<IngresosEntity>;
      try {
        data = await this.parsePdfForm(buffer);
      } catch (formError) {
        console.log('PDF no es formulario, intentando extracción de texto...');
        data = await this.parsePdfText(buffer);
      }

      // Crear y guardar el ingreso
      const nuevoIngreso = this.ingresoRepository.create(data);
      return await this.ingresoRepository.save(nuevoIngreso);
    } catch (error) {
      console.error('Error importing PDF:', error);
      throw new InternalServerErrorException(`Error al importar PDF: ${error.message}`);
    }
  }

  /**
   * Extrae datos del PDF sin guardarlos en la base de datos
   * Para uso en frontend - solo extrae y devuelve los datos
   */
  async extractPdfData(buffer: Buffer): Promise<Partial<IngresosEntity>> {
    try {
      // Primero intentar como formulario
      let data: Partial<IngresosEntity> = {};
      try {
        data = await this.parsePdfForm(buffer);
      } catch (formError) {
        // Silencioso, pasa a texto plano
      }
      // Si no se extrajo nada útil, intenta por texto
      if (!data || !data.proveedor || !data.detalle || !data.monto || !data.num_factura || !data.fecha || !data.nit) {
        data = await this.parsePdfText(buffer);
      }
      // Fallback: siempre retorna un objeto con los campos principales aunque estén vacíos
      return {
        proveedor: data.proveedor ?? undefined,
        detalle: data.detalle ?? undefined,
        monto: data.monto ?? undefined,
        num_factura: data.num_factura ?? undefined,
        fecha: data.fecha ?? undefined,
        nit: data.nit ?? undefined,
      };
    } catch (error) {
      console.error('Error extracting PDF data:', error);
      throw new InternalServerErrorException(`Error al extraer datos del PDF: ${error.message}`);
    }
  }

  private parseNumber(value: string | null): number | undefined {
    console.log("Valor recibido en parseNumber:", value);
    if (!value) return undefined;
  
    // Eliminar espacios en blanco
    let cleaned = value.toString().trim();
  
    // Detectar si el número usa coma como separador decimal (ejemplo: "1.234,56")
    const commaDecimal = cleaned.match(/^\d{1,3}(\.\d{3})*,\d+$/);
    // Detectar si el número usa punto como separador decimal (ejemplo: "1,234.56")
    const dotDecimal = cleaned.match(/^\d{1,3}(,\d{3})*\.\d+$/);
  
    if (commaDecimal) {
      // Formato europeo: eliminar puntos (miles) y cambiar coma por punto (decimal)
      cleaned = cleaned.replace(/\./g, '').replace(',', '.');
    } else if (dotDecimal) {
      // Formato anglosajón: eliminar comas (miles)
      cleaned = cleaned.replace(/,/g, '');
    } else {
      // Caso simple: eliminar comas (posibles miles), mantener puntos (decimales)
      cleaned = cleaned.replace(/,/g, '');
    }
  
    const parsed = parseFloat(cleaned);
    console.log(`Valor parseado: ${parsed}`);
    return isNaN(parsed) ? undefined : parsed;
  }
  /**
   * Helper para parsear fechas
   */
  private parseDate(value: string | null): Date | undefined {
    if (!value) return undefined;
    try {
      // Intentar diferentes formatos de fecha
      const formats = [
        /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/, // DD/MM/YYYY o DD-MM-YYYY
        /(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/, // YYYY/MM/DD o YYYY-MM-DD
      ];
      
      for (const format of formats) {
        const match = value.match(format);
        if (match) {
          const [, part1, part2, part3] = match;
          // Si el primer grupo tiene 4 dígitos, es año
          if (part1.length === 4) {
            return new Date(parseInt(part1), parseInt(part2) - 1, parseInt(part3));
          } else {
            return new Date(parseInt(part3), parseInt(part2) - 1, parseInt(part1));
          }
        }
      }
      
      // Fallback: intentar parsear directamente
      const date = new Date(value);
      return isNaN(date.getTime()) ? undefined : date;
    } catch (error) {
      console.warn('Error parsing date:', value, error);
      return undefined;
    }
  }
//   async importarExcel(file: Express.Multer.File): Promise<any> {
//     if (!file) {
//         throw new BadRequestException('No se subió ningún archivo.');
//     }
//     const workbook = XLSX.read(file.buffer, { type: 'buffer' });
//     const sheetName = workbook.SheetNames[0];
//     const datos: any[] = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

//     // Puedes mapear y guardar cada registro en la base de datos
//     let registrosImportados = 0;
//     for (const row of datos) {
//         if (Array.isArray(row)) {
//             continue;
//         }
//         console.log('Importing row:', row);  // <-- Add this line to see the data
//         const nuevo = this.ingresoRepository.create(row);
//         await this.ingresoRepository.save(nuevo);
//         registrosImportados++;
//     }
//     return { message: 'Importación exitosa', registros: registrosImportados };
// }
async importarExcel(file: Express.Multer.File): Promise<any> {
  if (!file) {
    throw new BadRequestException('No se subió ningún archivo.');
  }
  const workbook = XLSX.read(file.buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const datos: any[] = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

  let registrosProcesados = 0;
  for (const row of datos) {
    if (Array.isArray(row)) {
      continue;
    }
    console.log('Processing row:', row);
    // Do NOT save to database here
    registrosProcesados++;
  }
  return { message: 'Procesamiento exitoso (sin guardar en base de datos)', registros: registrosProcesados };
}
// async importarExcel(file: Express.Multer.File): Promise<any> {
//   if (!file) {
//       throw new BadRequestException('No se subió ningún archivo.');
//   }
//   const workbook = XLSX.read(file.buffer, { type: 'buffer' });
//   const sheetName = workbook.SheetNames[0];
//   const datos: any[] = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

//   let registrosImportados = 0;
//   for (const row of datos) {
//       if (Array.isArray(row)) {
//           continue;
//       }
//       console.log('Importing row:', row);

//       // Map Excel columns to entity fields explicitly
//       const mappedIngreso: Partial<IngresosEntity> = {
//         // Example mappings - adjust keys to your Excel column headers and entity properties
//         num_depo: row['Nro.DEPOSITO'] ?? row['Nro.DEPOSITO'],
//         proveedor: row['DESCRIPCIÓN'] ?? row['DESCRIPCIÓN'],
//         importe_total: row['IMPORTE TOTAL'] ?? row['IMPORTE TOTAL'],
//         fecha: row['FECHA'] ? new Date(row['FECHA']) : undefined,
//         // Add other fields as needed
//       };

//       const nuevo = this.ingresoRepository.create(mappedIngreso);
//       await this.ingresoRepository.save(nuevo);
//       registrosImportados++;
//   }
//   return { message: 'Importación exitosa', registros: registrosImportados };
// }
// async importarExcel(file: Express.Multer.File): Promise<any> {
//   if (!file) {
//       throw new BadRequestException('No se subió ningún archivo.');
//   }
//   const workbook = XLSX.read(file.buffer, { type: 'buffer' });
//   const sheetName = workbook.SheetNames[0];
//   const datos: any[] = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

//   // Helper to convert Excel serial date to JS Date
//   const excelDateToJSDate = (serial: number): Date => {
//     const utc_days = Math.floor(serial - 25569);
//     const utc_value = utc_days * 86400;                                        
//     const date_info = new Date(utc_value * 1000);
//     const fractional_day = serial - Math.floor(serial) + 0.0000001;
//     let total_seconds = Math.floor(86400 * fractional_day);
//     const seconds = total_seconds % 60;
//     total_seconds -= seconds;
//     const hours = Math.floor(total_seconds / (60 * 60));
//     const minutes = Math.floor(total_seconds / 60) % 60;
//     return new Date(date_info.getFullYear(), date_info.getMonth(), date_info.getDate(), hours, minutes, seconds);
//   };

//   let registrosImportados = 0;
//   for (const row of datos) {
//       if (Array.isArray(row)) {
//           continue;
//       }
//       console.log('Importing row:', row);

//       // Convert Excel serial date to JS Date if needed
//       let fecha: Date | undefined = undefined;
//       if (typeof row['FECHA'] === 'number') {
//         fecha = excelDateToJSDate(row['FECHA']);
//       } else if (typeof row['FECHA'] === 'string') {
//         fecha = new Date(row['FECHA']);
//       }

//       // Format importe_total as number with decimals
//       let importe_total = Number(row['IMPORTE TOTAL']);
//       if (isNaN(importe_total)) {
//         importe_total = 0;
//       }

//       const mappedIngreso: Partial<IngresosEntity> = {
//         num_depo: row['Nro. DEPOSITO'] ?? row['Nro.DEPOSITO'],
//         proveedor: row['DESCRIPCIÓN'] ?? row['DESCRIPCIÓN'],
//         importe_total: importe_total,
//         fecha: fecha,
//         // Add other fields as needed
//       };

//       const nuevo = this.ingresoRepository.create(mappedIngreso);
//       await this.ingresoRepository.save(nuevo);
//       registrosImportados++;
//   }
//   return { message: 'Importación exitosa', registros: registrosImportados };
// }
}