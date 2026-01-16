
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IngresoGastoEntity } from './ingreso-gasto.entity';
import { IngresoGastoDetalleEntity } from '../ingreso-gasto-detalle/ingreso-gasto-detalle.entity';
import { Repository } from 'typeorm';
import { join } from 'path';
import * as carbone from 'carbone';
import * as libreofficeConvert from 'libreoffice-convert';

@Injectable()
export class IngresoGastoService  {
  certificacionRepository: any;
    constructor(
        @InjectRepository(IngresoGastoEntity) 
        private readonly ingresoGastoRepository: Repository<IngresoGastoEntity>,
        @InjectRepository(IngresoGastoDetalleEntity)
        private readonly detalleGastoRepository: Repository<IngresoGastoDetalleEntity>,
    ) {
    // Forzar la ruta de LibreOffice para libreoffice-convert
    process.env.LIBREOFFICE_BIN = '/usr/bin/soffice';
  }

  // Función de conversión con libreoffice-convert
  private async convertWithLibreOffice(inputBuffer: Buffer, outputFormat: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      libreofficeConvert.convert(inputBuffer, outputFormat, undefined, (err, result) => {
        if (err) return reject(err);
        resolve(result);
      });
    });
  }

async create(
        id_gasto: Partial<IngresoGastoEntity>,
    ):Promise<IngresoGastoEntity>{
        const nuevoPago=this.ingresoGastoRepository.create(id_gasto);
        
        // Si el estado es ELABORADO, guardar el usuario que elabora
        if (nuevoPago.estado === 'ELABORADO' && nuevoPago.usuario) {
          nuevoPago.usuario_elaboro = nuevoPago.usuario;
          nuevoPago.fecha_elaboro = new Date();
        }
        
        return await this.ingresoGastoRepository.save(nuevoPago)
    }



    async findAll():Promise<IngresoGastoEntity[]>{
        return await this.ingresoGastoRepository.find()
    }

    async findOne(id_gasto: number): Promise<IngresoGastoEntity | null> {
        return await this.ingresoGastoRepository.findOneBy({ id_gasto });
      }
    async update(
        id_gasto: number,
        pagoActualizado: Partial<IngresoGastoEntity>,
      ): Promise<IngresoGastoEntity> {
        await this.ingresoGastoRepository.update(id_gasto, pagoActualizado);
        const pagoActualizadoDesdeDb = await this.ingresoGastoRepository.findOneBy({
          id_gasto,
        });
        if (!pagoActualizadoDesdeDb) {
          throw new NotFoundException(
            `No se pudo encontrar el insumo con ID ${id_gasto} después de la actualización.`,
          );
        }
        return pagoActualizadoDesdeDb;
      }

    async borradologico(id_gasto: number): Promise<{ deleted: boolean; message?: string }> {
    const pagoToUpdate = await this.ingresoGastoRepository.findOne({
      where: { id_gasto }, 
    });
    if (!pagoToUpdate) {
      throw new NotFoundException(`Ingreso con ID ${id_gasto} no encontrado.`);
    }
    if (pagoToUpdate.baja === true) {
      return { deleted: false, message: `Ingreso con ID ${id_gasto} ya estaba dado de baja lógicamente.` };
    }
    pagoToUpdate.baja = true; 
    await this.ingresoGastoRepository.save(pagoToUpdate);
    return { deleted: true, message: `Ingreso con ID ${id_gasto} dado de baja lógicamente.` };
  }

  obtenerAnioActual(): number {
    return new Date().getFullYear();
  }

  async generarReportePresupuesto(num_prev?: string): Promise<Buffer> {
    // Función para convertir número a letras
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

    // Query para obtener los datos haciendo JOIN con la cabecera para datos actualizados
    let query = `
      SELECT 
        d.id_gasto_det,
        d.id_gasto_id,
        d.id_certificado_id,
        d."numeroCertificacion",
        d.nota_solicitud,
        d.area_organizacional,
        d."descripcionEspecificaRequerimientos",
        d.operaciones,
        d.tareas,
        d.descripcion,
        d.cantidad,
        d."precioUnitario",
        d.saldofinal,
        d."costoTotal",
        d.ejecutado,
        d.saldo,
        d."catProg",
        d.partida,
        d.programado,
        c.num_prev,
        c.num_dev,
        c.num_comp,
        c.num_pag,
        c.num_sec,
        c.tipo_ejec,
        c.tipo_impu,
        c.regularizacion,
        c.entidad,
        c.estado,
        c.moneda,
        c.unidad,
        c.tipo_doc,
        c.preventivo,
        c.compromiso,
        c.devengado,
        c.pagado,
        c."fechaElab",
        c.doc_respa,
        c.num_doc,
        c.gestion,
        c.id_num_clasif_id,
        c.des_clasif,
        c."fechaRec",
        c.glosa,
        c.usuario,
        c.rol,
        c.regional,
        c."idUsuario",
        c.usuario_elaboro,
        c.fecha_elaboro,
        c.usuario_verifico,
        c.fecha_verifico,
        c.usuario_aprobo,
        c.fecha_aprobo
      FROM "gastos_ejecucionPresu_det" d
      INNER JOIN "gastos_ejecucionPresu" c ON d.id_gasto_id = c.id_gasto
      WHERE d.baja = false AND c.baja = false
    `;

    // Si se proporciona num_prev, filtrar por él
    if (num_prev) {
      query += ` AND c.num_prev = '${num_prev}'`;
    }

    query += ` ORDER BY c."fechaElab" DESC, d.id_gasto_det DESC`;

    const gastosRaw = await this.ingresoGastoRepository.query(query);

    // Mapear los datos para el template
    const gastos = gastosRaw.map((item) => {
      return {
        id_gasto_det: item.id_gasto_det,
        numeroCertificacion: item.numeroCertificacion || '',
        usuario: item.usuario || '',
        nota_solicitud: item.nota_solicitud || '',
        area_organizacional: item.area_organizacional || '',
        descripcionEspecificaRequerimientos: item.descripcionEspecificaRequerimientos || '',
        operaciones: item.operaciones || '',
        tareas: item.tareas || '',
        catProg: item.catProg || '',
        partida: item.partida || '',
        cantidad: Number(item.cantidad || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        precioUnitario: Number(item.precioUnitario || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        programado: Number(item.programado || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        costoTotal: Number(item.costoTotal || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        ejecutado: Number(item.ejecutado || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        saldo: Number(item.saldo || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        num_prev: item.num_prev || '',
        num_comp: item.num_comp || '',
        num_dev: item.num_dev || '',
        num_pag: item.num_pag || '',
        num_sec: item.num_sec || '',
        tipo_ejec: item.tipo_ejec || '',
        tipo_impu: item.tipo_impu ? 'CON IMPUTACION' : 'SIN IMPUTACION',
        regularizacion: item.regularizacion || '',
        entidad: item.entidad || '',
        estado: item.estado || '',
        moneda: item.moneda || '',
        unidad: item.unidad || '',
        tipo_doc: item.tipo_doc || '',
        preventivo: item.preventivo ? 'X' : '',
        compromiso: item.compromiso ? 'X' : '',
        devengado: item.devengado ? 'X' : '',
        pagado: item.pagado ? 'X' : '',
        fechaElab: item.fechaElab ? new Date(item.fechaElab).toLocaleDateString('es-ES') : '',
        doc_respa: item.doc_respa || '',
        num_doc: item.num_doc || '',
        gestion: item.gestion || new Date().getFullYear(),
        des_clasif: item.des_clasif || '',
        fechaRec: item.fechaRec ? new Date(item.fechaRec).toLocaleDateString('es-ES') : '',
        glosa: item.glosa || '',
        descripcion: item.descripcion || '',
        usuario_aprobo: item.usuario_aprobo || '',
        fecha_aprobo: item.fecha_aprobo ? new Date(item.fecha_aprobo).toLocaleDateString('es-ES') : '',
        usuario_verifico: item.usuario_verifico || '',
        fecha_verifico: item.fecha_verifico ? new Date(item.fecha_verifico).toLocaleDateString('es-ES') : '',
        usuario_elaboro: item.usuario_elaboro || '',
        fecha_elaboro: item.fecha_elaboro ? new Date(item.fecha_elaboro).toLocaleDateString('es-ES') : '',
      };
    });

    // Calcular totales
    const totalCostoTotal = gastosRaw.reduce((acc, cur) => acc + Number(cur.costoTotal || 0), 0);
    const totalEjecutado = gastosRaw.reduce((acc, cur) => acc + Number(cur.ejecutado || 0), 0);
    const totalSaldo = gastosRaw.reduce((acc, cur) => acc + Number(cur.saldo || 0), 0);

    const templatePath = join(__dirname, '../../src/templates/documento-presupuesto.odt');

    const fechaActual = new Date();
    
    // Obtener los usuarios únicos de elaboración, verificación y aprobación
    const usuario_elaboro = gastosRaw.length > 0 ? (gastosRaw[0].usuario_elaboro || '') : '';
    const fecha_elaboro = gastosRaw.length > 0 && gastosRaw[0].fecha_elaboro ? 
      new Date(gastosRaw[0].fecha_elaboro).toLocaleDateString('es-ES') : '';
    const usuario_verifico = gastosRaw.length > 0 ? (gastosRaw[0].usuario_verifico || '') : '';
    const fecha_verifico = gastosRaw.length > 0 && gastosRaw[0].fecha_verifico ? 
      new Date(gastosRaw[0].fecha_verifico).toLocaleDateString('es-ES') : '';
    const usuario_aprobo = gastosRaw.length > 0 ? (gastosRaw[0].usuario_aprobo || '') : '';
    const fecha_aprobo = gastosRaw.length > 0 && gastosRaw[0].fecha_aprobo ? 
      new Date(gastosRaw[0].fecha_aprobo).toLocaleDateString('es-ES') : '';
    
    const data = {
      gastos: gastos,
      totalRegistros: gastos.length,
      totalCostoTotal: totalCostoTotal.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      totalEjecutado: totalEjecutado.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      totalSaldo: totalSaldo.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      totalCostoTotalLetras: numeroALetras(totalCostoTotal).toUpperCase() + ' BOLIVIANOS',
      totalEjecutadoLetras: numeroALetras(totalEjecutado).toUpperCase() + ' BOLIVIANOS',
      totalSaldoLetras: numeroALetras(totalSaldo).toUpperCase() + ' BOLIVIANOS',
      fechaHoraReporte: `${fechaActual.toLocaleDateString('es-ES')} ${fechaActual.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`,
      num_prev: num_prev || 'TODOS',
      gestion: new Date().getFullYear(),
      // Usuarios para pies de firma
      usuario_elaboro: usuario_elaboro,
      fecha_elaboro: fecha_elaboro,
      usuario_verifico: usuario_verifico,
      fecha_verifico: fecha_verifico,
      usuario_aprobo: usuario_aprobo,
      fecha_aprobo: fecha_aprobo
    };

    const options = { convertTo: 'pdf' };

    return new Promise<Buffer>(async (resolve, reject) => {
      carbone.render(templatePath, data, options, async (err, result) => {
        if (!err && result) {
          return resolve(result);
        }
        // Fallback: renderizar ODT y convertir con libreoffice-convert
        carbone.render(templatePath, data, (err2, odfBuffer) => {
          if (err2) return reject(err2);
          this.convertWithLibreOffice(Buffer.from(odfBuffer), '.pdf')
            .then(resolve)
            .catch(() => reject(err2));
        });
      });
    });
  }

  async cambiarEstado(
    id_gasto: number,
    datosEstado: { estado: string; usuario: string; idUsuario: string; regional: string; rol: string }
  ): Promise<IngresoGastoEntity> {
    // Obtener el registro original
    const gastoOriginal = await this.ingresoGastoRepository.findOneBy({ id_gasto });
    
    if (!gastoOriginal) {
      throw new NotFoundException(`Gasto con ID ${id_gasto} no encontrado.`);
    }

    console.log('=== CREAR NUEVO REGISTRO CON NUEVO ESTADO ===');
    console.log('ID original:', id_gasto);
    console.log('Estado original:', gastoOriginal.estado);
    console.log('Nuevo estado:', datosEstado.estado);

    const fechaActual = new Date();

    // Crear un NUEVO registro copiando todos los datos del original
    const nuevoGasto = this.ingresoGastoRepository.create({
      ...gastoOriginal,
      id_gasto: undefined, // Esto hará que se genere un nuevo ID
      estado: datosEstado.estado,
      usuario: datosEstado.usuario,
      idUsuario: datosEstado.idUsuario,
      regional: datosEstado.regional,
      rol: datosEstado.rol,
    });

    // Agregar el usuario según el nuevo estado (preservando los anteriores)
    switch(datosEstado.estado) {
      case 'VERIFICADO':
        nuevoGasto.usuario_verifico = datosEstado.usuario;
        nuevoGasto.fecha_verifico = fechaActual;
        break;
      case 'APROBADO':
        nuevoGasto.usuario_aprobo = datosEstado.usuario;
        nuevoGasto.fecha_aprobo = fechaActual;
        break;
    }

    // Guardar el NUEVO registro
    const gastoGuardado = await this.ingresoGastoRepository.save(nuevoGasto);

    console.log('✅ NUEVO REGISTRO CREADO');
    console.log('Nuevo ID:', gastoGuardado.id_gasto);
    console.log('Estado:', gastoGuardado.estado);
    console.log('usuario_elaboro:', gastoGuardado.usuario_elaboro);
    console.log('usuario_verifico:', gastoGuardado.usuario_verifico);
    console.log('usuario_aprobo:', gastoGuardado.usuario_aprobo);

    // Copiar también todos los detalles del gasto original al nuevo gasto
    const detallesOriginales = await this.detalleGastoRepository.find({
      where: { id_gasto_id: id_gasto }
    });

    for (const detalleOriginal of detallesOriginales) {
      const nuevoDetalle = this.detalleGastoRepository.create({
        ...detalleOriginal,
        id_gasto_det: undefined, // Generar nuevo ID
        id_gasto_id: gastoGuardado.id_gasto, // Asociar al nuevo gasto
        estado: gastoGuardado.estado, // Copiar el mismo estado del gasto padre
        usuario_elaboro: gastoGuardado.usuario_elaboro,
        fecha_elaboro: gastoGuardado.fecha_elaboro,
        usuario_verifico: gastoGuardado.usuario_verifico,
        fecha_verifico: gastoGuardado.fecha_verifico,
        usuario_aprobo: gastoGuardado.usuario_aprobo,
        fecha_aprobo: gastoGuardado.fecha_aprobo,
      });
      await this.detalleGastoRepository.save(nuevoDetalle);
    }

    console.log(`✅ ${detallesOriginales.length} detalles copiados al nuevo registro con estado ${gastoGuardado.estado}`);

    return gastoGuardado;
  }
  
}
