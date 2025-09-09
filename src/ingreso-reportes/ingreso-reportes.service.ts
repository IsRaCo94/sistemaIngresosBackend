
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IngresoReportesEntity } from './ingreso-reportes.entity';
import { Repository } from 'typeorm';
import { join } from 'path';
import * as carbone from 'carbone';
import * as ExcelJS from 'exceljs'
@Injectable()
export class IngresoReportesService {

    constructor(@InjectRepository(IngresoReportesEntity)
    private readonly ingresoRepository: Repository<IngresoReportesEntity>) {

    }
    async generaReporteTipoIngreso(fechaInicio: string, fechaFin: string, lugar: string): Promise<Buffer> {
        const query = `
           SELECT 
         
            fecha,
            lugar,
            fecha_reg,
            proveedor,
            detalle,
            tipo_ingres,
            SUM(importe_total) as importe_total,
            estado,
             SUM(importe_total) OVER () as total_montos,
            SUM(COUNT(*)) OVER (PARTITION BY fecha) as total_registros_fecha,
            SUM(SUM(importe_total)) OVER (PARTITION BY fecha) as total_diario,
            SUM(SUM(importe_total)) OVER () as total_general
        FROM ingresos
        WHERE estado IS NOT NULL AND
        baja = false 
        AND CAST(fecha AS DATE) BETWEEN '${fechaInicio}' AND '${fechaFin}'
        AND lugar = '${lugar}' AND estado !='' 
        GROUP BY fecha, lugar, fecha_reg, proveedor, detalle, tipo_ingres, estado, importe_total
        ORDER BY fecha, importe_total ASC;`;

        const ingresosRaw = await this.ingresoRepository.query(query);

        const ingresos = ingresosRaw.map((item) => {
            return {
                
                total_montos: Number(item.total_montos).toFixed(2),
                lugar: item.lugar,
                tipo_ingres: item.tipo_ingres,
                proveedor: item.proveedor,
                detalle: item.detalle,
                tipoIngreso: item.tipo_ingres,
                importe_total: Number(item.importe_total).toFixed(2), // Cambiado de item.monto a item.monto_total
                total_general: Number(item.total_general).toFixed(2),
                // total_registros: Number(item.total_registros),
                total_diario: Number(item.total_diario).toFixed(2),
                fechaInicio: fechaInicio,
                fechaFin: fechaFin,
                estado: item.estado,
                fecha_reg: new Date(item.fecha_reg).toLocaleDateString('es-ES'),
                fecha: new Date(item.fecha).toLocaleDateString('es-ES'),
                total_registros_fecha: Number(item.total_registros_fecha),
                //totalMonto: ingresosRaw.reduce((acc, cur) => acc + Number(cur.monto_total), 0), // También cambiado aquí
                fechaReporte: new Date().toLocaleDateString('es-ES'),
            };
        });


        const templatePath = join(__dirname, '../../src/templates/ingresos-tipos-report.odt');
        console.log(ingresos);

        const data = {

            fechaInicio,
            fechaFin,
            //tipo_ingres,
            ingresos: ingresos,
        };
        const options = { convertTo: 'pdf' };
        return new Promise<Buffer>((resolve, reject) => {
            carbone.render(templatePath, data, options, (err, result) => {
                if (err) {
                    return reject(err);
                }
                resolve(result);
            });
        });
    }
    async generaReportePorTipoIngreso(fechaInicio: string, fechaFin: string, tipo_ingres: string, lugar): Promise<Buffer> {
        const query = `
             SELECT 
                fecha,
                lugar,
                fecha_reg,
                proveedor,
                detalle,
                tipo_ingres,
                importe_total,
                estado,
                SUM(importe_total) OVER () as total_montos
            FROM ingresos
            WHERE estado IS NOT NULL AND
            baja = false 
            AND CAST(fecha AS DATE) BETWEEN '${fechaInicio}' AND '${fechaFin}'
            AND tipo_ingres = '${tipo_ingres}'
            AND lugar = '${lugar}'AND estado !=''
            ORDER BY fecha ASC`;

        const ingresosRaw = await this.ingresoRepository.query(query);
        const ingresos = ingresosRaw.map((item) => {
            return {
                total_montos: Number(item.total_montos).toFixed(2),
                lugar: item.lugar,
                tipo_ingres: item.tipo_ingres,
                proveedor: item.proveedor,
                detalle: item.detalle,
                tipoIngreso: item.tipo_ingres,
                importe_total: Number(item.importe_total).toFixed(2),
                fechaInicio: fechaInicio,
                fechaFin: fechaFin,
                estado: item.estado,
                fecha_reg: new Date(item.fecha_reg).toLocaleDateString('es-ES'),
                fecha: new Date(item.fecha).toLocaleDateString('es-ES'),
                totalRegistros: ingresosRaw.length,
                totalMonto: ingresosRaw.reduce((acc, cur) => acc + Number(cur.importe_total), 0).toFixed(2),
                fechaReporte: new Date().toLocaleDateString('es-ES'),

            };
        });

        const templatePath = join(__dirname, '../../src/templates/ingresos-por-tipos-report.odt');
        console.log(ingresos);

        const data = {

            fechaInicio,
            fechaFin,
            //tipo_ingres,
            ingresos: ingresos
        };
        const options = { convertTo: 'pdf' };
        return new Promise<Buffer>((resolve, reject) => {
            carbone.render(templatePath, data, options, (err, result) => {
                if (err) {
                    return reject(err);
                }
                resolve(result);
            });
        });
    }
    async generaReportRubros(fechaInicio: string, fechaFin: string, lugar: string): Promise<Buffer> {
        const query = `
            SELECT 
                CONCAT(num_rubro, ' - ',nombre) as rubros,
                CAST(fecha AS DATE) as fecha,
                lugar,
                fecha_reg,
                proveedor,
                detalle,
                tipo_ingres,
                SUM(importe_total) as importe_total,
                estado,
                SUM(SUM(importe_total)) OVER(PARTITION BY CONCAT(num_rubro, ' - ',nombre )) as total_nombre
            FROM ingresos
            WHERE estado IS NOT NULL AND estado !=''AND
            baja = false 
            AND CAST(fecha AS DATE) BETWEEN '${fechaInicio}' AND '${fechaFin}' AND lugar = '${lugar}'
            GROUP BY CONCAT(num_rubro, ' - ',nombre), CAST(fecha AS DATE), lugar, fecha_reg, proveedor, detalle, tipo_ingres, estado
            ORDER BY CONCAT(num_rubro, ' - ',nombre), CAST(fecha AS DATE)`;

        const ingresosRaw = await this.ingresoRepository.query(query);
        const ingresos = ingresosRaw.map((item) => {
            return {
                lugar: item.lugar,
                rubros: item.rubros,
                nombre: item.nombre,
                proveedor: item.proveedor,
                detalle: item.detalle,
                tipoIngreso: item.tipo_ingres,
                importe_total: Number(item.importe_total).toFixed(2),
                fechaInicio: fechaInicio,
                fechaFin: fechaFin,
                estado: item.estado,
                fecha_reg: new Date(item.fecha_reg).toLocaleDateString('es-ES'),
                fecha: new Date(item.fecha).toLocaleDateString('es-ES'),
                totalRegistros: ingresosRaw.length,
                totalMonto: ingresosRaw.reduce((acc, cur) => acc + Number(cur.importe_total), 0).toFixed(2),
                fechaReporte: new Date().toLocaleDateString('es-ES'),

            };
        });

        const templatePath = join(__dirname, '../../src/templates/ingresos-rubros-report.odt');
        console.log(ingresos);

        const data = {

            fechaInicio,
            fechaFin,
            //tipo_ingres,
            ingresos: ingresos
        };
        const options = { convertTo: 'pdf' };
        return new Promise<Buffer>((resolve, reject) => {
            carbone.render(templatePath, data, options, (err, result) => {
                if (err) {
                    return reject(err);
                }
                resolve(result);
            });
        });
    }

    async generaReportPorRubro(fechaInicio: string, fechaFin: string, nombre: string, lugar: string): Promise<Buffer> {
        const query = `
            SELECT 
                CONCAT(num_rubro, ' - ',nombre) as rubros,
                CAST(fecha AS DATE) as fecha,
                lugar,
                fecha_reg,
                proveedor,
                detalle,
                tipo_ingres,
                SUM(importe_total) as importe_total,
                estado,
                SUM(SUM(importe_total)) OVER(PARTITION BY CONCAT(num_rubro, ' - ',nombre )) as total_nombre
            FROM ingresos
            WHERE estado IS NOT NULL AND estado !=''AND
            baja = false 
            AND CAST(fecha AS DATE) BETWEEN '${fechaInicio}' AND '${fechaFin}'
            AND nombre= '${nombre}' AND lugar= '${lugar}'
            GROUP BY CONCAT(num_rubro, ' - ',nombre), CAST(fecha AS DATE), lugar, fecha_reg, proveedor, detalle, tipo_ingres, estado
            ORDER BY CONCAT(num_rubro, ' - ',nombre), CAST(fecha AS DATE)`;

        const ingresosRaw = await this.ingresoRepository.query(query);
        const ingresos = ingresosRaw.map((item) => {
            return {
                lugar: item.lugar,
                rubros: item.rubros,
                nombre: item.nombre,
                proveedor: item.proveedor,
                detalle: item.detalle,
                tipoIngreso: item.tipo_ingres,
                importe_total: Number(item.importe_total).toFixed(2),
                fechaInicio: fechaInicio,
                fechaFin: fechaFin,
                estado: item.estado,
                fecha_reg: new Date(item.fecha_reg).toLocaleDateString('es-ES'),
                fecha: new Date(item.fecha).toLocaleDateString('es-ES'),
                totalRegistros: ingresosRaw.length,
                totalMonto: ingresosRaw.reduce((acc, cur) => acc + Number(cur.importe_total), 0).toFixed(2),
                fechaReporte: new Date().toLocaleDateString('es-ES'),

            };
        });

        const templatePath = join(__dirname, '../../src/templates/ingresos-tipos-rubros-report.odt');
        console.log(ingresos);

        const data = {

            fechaInicio,
            fechaFin,
            //tipo_ingres,
            ingresos: ingresos
        };
        const options = { convertTo: 'pdf' };
        return new Promise<Buffer>((resolve, reject) => {
            carbone.render(templatePath, data, options, (err, result) => {
                if (err) {
                    return reject(err);
                }
                resolve(result);
            });
        });
    }

    async generaReportRegional(fechaInicio: string, fechaFin: string): Promise<Buffer> {
        const query = `
            SELECT 
                CONCAT(num_rubro, ' - ',nombre) as rubros,
                CAST(fecha AS DATE) as fecha,
                lugar,
                fecha_reg,
                proveedor,
                detalle,
                tipo_ingres,
                SUM(importe_total) as importe_total,
                estado,
                SUM(SUM(importe_total)) OVER(PARTITION BY CONCAT(num_rubro, ' - ',nombre )) as total_nombre
            FROM ingresos
            WHERE estado IS NOT NULL AND estado !=''AND
            baja = false 
            AND CAST(fecha AS DATE) BETWEEN '${fechaInicio}' AND '${fechaFin}'
            GROUP BY CONCAT(num_rubro, ' - ',nombre), CAST(fecha AS DATE), lugar, fecha_reg, proveedor, detalle, tipo_ingres, estado
            ORDER BY CONCAT(num_rubro, ' - ',nombre), CAST(fecha AS DATE)`;

        const ingresosRaw = await this.ingresoRepository.query(query);
        const ingresos = ingresosRaw.map((item) => {
            return {
                lugar: item.lugar,
                rubros: item.rubros,
                nombre: item.nombre,
                proveedor: item.proveedor,
                detalle: item.detalle,
                tipoIngreso: item.tipo_ingres,
                importe_total: Number(item.importe_total).toFixed(2),
                fechaInicio: fechaInicio,
                fechaFin: fechaFin,
                estado: item.estado,
                fecha_reg: new Date(item.fecha_reg).toLocaleDateString('es-ES'),
                fecha: new Date(item.fecha).toLocaleDateString('es-ES'),
                totalRegistros: ingresosRaw.length,
                totalMonto: ingresosRaw.reduce((acc, cur) => acc + Number(cur.monto), 0).toFixed(2),
                fechaReporte: new Date().toLocaleDateString('es-ES'),

            };
        });

        const templatePath = join(__dirname, '../../src/templates/ingresos-rubros-report.odt');
        console.log(ingresos);

        const data = {

            fechaInicio,
            fechaFin,
            //tipo_ingres,
            ingresos: ingresos
        };
        const options = { convertTo: 'pdf' };
        return new Promise<Buffer>((resolve, reject) => {
            carbone.render(templatePath, data, options, (err, result) => {
                if (err) {
                    return reject(err);
                }
                resolve(result);
            });
        });
    }

    // async generaReportPorRegional(fechaInicio: string, fechaFin: string, lugar: string): Promise<Buffer> {
    //     const query = `
    //         SELECT 
    //             CONCAT(num_rubro, ' - ',nombre) as rubros,
    //             CAST(fecha AS DATE) as fecha,
    //             lugar,
    //             fecha_reg,
    //             proveedor,
    //             detalle,
    //             tipo_ingres,
    //             SUM(importe_total) as importe_total,
    //             estado,
    //             SUM(SUM(importe_total)) OVER(PARTITION BY CONCAT(num_rubro, ' - ',nombre )) as total_nombre
    //         FROM ingresos
    //         WHERE estado IS NOT NULL AND estado !=''AND
    //         baja = false 
    //         AND CAST(fecha AS DATE) BETWEEN '${fechaInicio}' AND '${fechaFin}'
    //         AND nombre= '${lugar}'
    //         GROUP BY CONCAT(num_rubro, ' - ',nombre), CAST(fecha AS DATE), lugar, fecha_reg, proveedor, detalle, tipo_ingres, estado
    //         ORDER BY CONCAT(num_rubro, ' - ',nombre), CAST(fecha AS DATE)`;

    //     const ingresosRaw = await this.ingresoRepository.query(query);
    //     const ingresos = ingresosRaw.map((item) => {
    //         return {
    //             lugar: item.lugar,
    //             rubros: item.rubros,
    //             nombre: item.nombre,
    //             proveedor: item.proveedor,
    //             detalle: item.detalle,
    //             tipoIngreso: item.tipo_ingres,
    //             importe_total: Number(item.importe_total),
    //             fechaInicio: fechaInicio,
    //             fechaFin: fechaFin,
    //             estado: item.estado,
    //             fecha_reg: new Date(item.fecha_reg).toLocaleDateString('es-ES'),
    //             fecha: new Date(item.fecha).toLocaleDateString('es-ES'),
    //             totalRegistros: ingresosRaw.length,
    //             totalMonto: ingresosRaw.reduce((acc, cur) => acc + Number(cur.monto), 0),
    //             fechaReporte: new Date().toLocaleDateString('es-ES'),

    //         };
    //     });

    //     const templatePath = join(__dirname, '../../src/templates/ingresos-tipos-rubros-report.odt');
    //     console.log(ingresos);

    //     const data = {

    //         fechaInicio,
    //         fechaFin,
    //         //tipo_ingres,
    //         ingresos: ingresos
    //     };
    //     const options = { convertTo: 'pdf' };
    //     return new Promise<Buffer>((resolve, reject) => {
    //         carbone.render(templatePath, data, options, (err, result) => {
    //             if (err) {
    //                 return reject(err);
    //             }
    //             resolve(result);
    //         });
    //     });
    // }
    async generaReportGeneralRubrosPorLugar(fechaInicio: string, fechaFin: string, lugar: string): Promise<Buffer> {
        const query = `
          SELECT 
             CONCAT(num_rubro, ' - ', nombre) as rubros,
             COALESCE(SUM(importe_total), 0) as totalMonto,
             MIN(CAST(fecha AS DATE)) as fechaInicio,
             MAX(CAST(fecha AS DATE)) as fechaFin,
             lugar 
        FROM ingresos
        WHERE estado IS NOT NULL AND estado != '' AND
            baja = false 
            AND CAST(fecha AS DATE) BETWEEN '${fechaInicio}' AND '${fechaFin}'
            AND lugar='${lugar}'
            GROUP BY 
                CONCAT(num_rubro, ' - ', nombre),
                lugar
            ORDER BY CONCAT(num_rubro, ' - ', nombre)`;

        const ingresosRaw = await this.ingresoRepository.query(query);
        const ingresos = ingresosRaw.map((item) => {
            return {
                lugar: item.lugar,
                rubros: item.rubros,
                importe_total: Number(item.totalmonto).toFixed(2),  // Cambiado de item.monto a item.totalmonto
                fechaInicio: fechaInicio,
                fechaFin: fechaFin,
                totalRegistros: ingresosRaw.length,
                totalMonto: ingresosRaw.reduce((acc, cur) => acc + Number(cur.totalmonto), 0).toFixed(2),  // Cambiado aquí también
                fechaReporte: new Date().toLocaleDateString('es-ES'),
            };
        });
        const templatePath = join(__dirname, '../../src/templates/ingresos-resumen-rubros-lugar-report.odt');
        console.log(ingresos);

        const data = {

            fechaInicio,
            fechaFin,
            //tipo_ingres,
            ingresos: ingresos
        };
        const options = { convertTo: 'pdf' };
        return new Promise<Buffer>((resolve, reject) => {
            carbone.render(templatePath, data, options, (err, result) => {
                if (err) {
                    return reject(err);
                }
                resolve(result);
            });
        });
    }
    async generaReportGeneralRubros(fechaInicio: string, fechaFin: string): Promise<Buffer> {
        const query = `
         SELECT 
             CONCAT(num_rubro, ' - ', nombre) as rubros,
             COALESCE(SUM(importe_total), 0) as totalMonto,
             MIN(CAST(fecha AS DATE)) as fechaInicio,
             MAX(CAST(fecha AS DATE)) as fechaFin,
             lugar
        FROM ingresos
        WHERE estado IS NOT NULL AND estado != '' AND
            baja = false 
            AND CAST(fecha AS DATE) BETWEEN '${fechaInicio}' AND '${fechaFin}'
        GROUP BY 
            lugar,
            CONCAT(num_rubro, ' - ', nombre)
        ORDER BY 
            lugar,
            CONCAT(num_rubro, ' - ', nombre)`;

        const ingresosRaw = await this.ingresoRepository.query(query);


        const ingresos = ingresosRaw.map((item) => {
            return {
                lugar: item.lugar,
                rubros: item.rubros,
                importe_total: Number(item.totalmonto).toFixed(2),  // Cambiado de item.monto a item.totalmonto
                fechaInicio: fechaInicio,
                fechaFin: fechaFin,
                totalRegistros: ingresosRaw.length,
                totalMonto: ingresosRaw.reduce((acc, cur) => acc + Number(cur.totalmonto), 0).toFixed(2),  // Cambiado aquí también
                fechaReporte: new Date().toLocaleDateString('es-ES'),
            };
        });
        const templatePath = join(__dirname, '../../src/templates/ingresos-resumen-rubros-report.odt');
        console.log(ingresos);

        const data = {

            fechaInicio,
            fechaFin,
            //tipo_ingres,
            ingresos: ingresos
        };
        const options = { convertTo: 'pdf' };
        return new Promise<Buffer>((resolve, reject) => {
            carbone.render(templatePath, data, options, (err, result) => {
                if (err) {
                    return reject(err);
                }
                resolve(result);
            });
        });
    }

    async generaReportEmisionLugar(fechaInicio: string, fechaFin: string, tipo_emision: string, lugar: string): Promise<Buffer> {
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
		        tipo_emision,
                importe_total,
                SUM(monto) OVER () as total_montos
        FROM ingresos
        WHERE estado IS NOT NULL AND
                baja = false 
                AND CAST(fecha AS DATE) BETWEEN '${fechaInicio}' AND '${fechaFin}'
                AND tipo_emision = '${tipo_emision}'
                AND lugar='${lugar}'
        ORDER BY fecha ASC`;

        const ingresosRaw = await this.ingresoRepository.query(query);


        const ingresos = ingresosRaw.map((item) => {
            return {
                importe_total: Number(item.importe_total).toFixed(2),
                estado: item.estado,
                total_montos: Number(item.total_montos).toFixed(2),
                proveedor: item.proveedor,
                detalle: item.detalle,
                tipoIngreso: item.tipo_ingres,
                lugar: item.lugar,
                tipo_emision: item.tipo_emision,
                fecha_reg: new Date(item.fecha_reg).toLocaleDateString('es-ES'),
                monto: Number(item.monto).toFixed(2),  // Cambiado de item.monto a item.totalmonto
                fechaInicio: fechaInicio,
                fechaFin: fechaFin,
                totalRegistros: ingresosRaw.length,
                fechaReporte: new Date().toLocaleDateString('es-ES'),
            };
        });
        const templatePath = join(__dirname, '../../src/templates/ingresos-emisionLugar-report.odt');
        console.log(ingresos);

        const data = {

            fechaInicio,
            fechaFin,
            ingresos: ingresos
        };
        const options = { convertTo: 'pdf' };
        return new Promise<Buffer>((resolve, reject) => {
            carbone.render(templatePath, data, options, (err, result) => {
                if (err) {
                    return reject(err);
                }
                resolve(result);
            });
        });
    }
     async generaReportEmision(fechaInicio: string, fechaFin: string, tipo_emision: string): Promise<Buffer> {
        const query = `
         SELECT
                fecha,
                lugar,
                fecha_reg,
                proveedor,
                detalle,
                tipo_ingres,
                importe_total,
                estado,
		        tipo_emision,
                SUM(importe_total) OVER () as total_montos
        FROM ingresos
        WHERE estado IS NOT NULL AND
                baja = false 
                AND CAST(fecha AS DATE) BETWEEN '${fechaInicio}' AND '${fechaFin}'
                AND tipo_emision = '${tipo_emision}'
        ORDER BY fecha ASC`;

        const ingresosRaw = await this.ingresoRepository.query(query);


        const ingresos = ingresosRaw.map((item) => {
            return {
                estado: item.estado,
                total_montos: Number(item.total_montos).toFixed(2),
                proveedor: item.proveedor,
                detalle: item.detalle,
                tipoIngreso: item.tipo_ingres,
                tipo_emision: item.tipo_emision,
                fecha_reg: new Date(item.fecha_reg).toLocaleDateString('es-ES'),
                importe_total: Number(item.importe_total).toFixed(2),  // Cambiado de item.monto a item.totalmonto
                fechaInicio: fechaInicio,
                fechaFin: fechaFin,
                totalRegistros: ingresosRaw.length,
                fechaReporte: new Date().toLocaleDateString('es-ES'),
            };
        });
        const templatePath = join(__dirname, '../../src/templates/ingresos-emision-report.odt');
        console.log(ingresos);

        const data = {

            fechaInicio,
            fechaFin,
            ingresos: ingresos
        };
        const options = { convertTo: 'pdf' };
        return new Promise<Buffer>((resolve, reject) => {
            carbone.render(templatePath, data, options, (err, result) => {
                if (err) {
                    return reject(err);
                }
                resolve(result);
            });
        });
    }


/*genera reportes en formato excel */
async generaReporteTipoIngresoExcel(fechaInicio: string, fechaFin: string, lugar: string): Promise<Buffer> {
    // Reuse the same query from PDF version
    const query = `
        SELECT 
            fecha,
            lugar,
            fecha_reg,
            proveedor,
            detalle,
            tipo_ingres,
            SUM(importe_total) as importe_total,
            estado,
            SUM(importe_total) OVER () as total_montos,
            SUM(COUNT(*)) OVER (PARTITION BY fecha) as total_registros_fecha,
            SUM(SUM(importe_total)) OVER (PARTITION BY fecha) as total_diario,
            SUM(SUM(importe_total)) OVER () as total_general
        FROM ingresos
        WHERE estado IS NOT NULL AND
        baja = false 
        AND CAST(fecha AS DATE) BETWEEN '${fechaInicio}' AND '${fechaFin}'
        AND lugar = '${lugar}' AND estado !='' 
        GROUP BY fecha, lugar, fecha_reg, proveedor, detalle, tipo_ingres, estado, importe_total
        ORDER BY fecha, importe_total ASC;`;

    const ingresosRaw = await this.ingresoRepository.query(query);

    // Format data for Excel template
        const ingresos = ingresosRaw.map((item) => {
            return {
                lugar: item.lugar,
                estado: item.estado,
                total_montos: Number(item.total_montos).toFixed(2),
                proveedor: item.proveedor,
                detalle: item.detalle,
                tipo_ingres: item.tipo_ingres,
                fecha_reg: new Date(item.fecha_reg).toLocaleDateString('es-ES'),
                importe_total: Number(item.importe_total),  // Cambiado de item.monto a item.totalmonto
                fechaInicio: fechaInicio,
                fechaFin: fechaFin,
                total_general: Number(item.total_general).toFixed(2),
                totalRegistros: ingresosRaw.length,
                fechaReporte: new Date().toLocaleDateString('es-ES'),
                fecha: new Date(item.fecha).toLocaleDateString('es-ES'),
                total_registros_fecha: Number(item.total_registros_fecha)
            };
        });

    // Create Excel template path
    const templatePath = join(__dirname, '../../src/templates/ingresos-tipos-report.ods');
       console.log(ingresos);
    const data = {
        fechaInicio,
        fechaFin,
        ingresos: ingresos,
       
    };
    
    const options = { convertTo: 'xlsx' };
    
    return new Promise<Buffer>((resolve, reject) => {
        carbone.render(templatePath, data, options, (err, result) => {
            if (err) {
                return reject(err);
            }
            resolve(result);
        });
    });
}
async generaReportePorTipoIngresoExcel(fechaInicio: string, fechaFin: string, tipo_ingres: string, lugar): Promise<Buffer> {
    // Reuse the same query from PDF version
    const query = `
        SELECT 
                fecha,
                lugar,
                fecha_reg,
                proveedor,
                detalle,
                tipo_ingres,
                importe_total,
                estado,
                SUM(importe_total) OVER () as total_montos
            FROM ingresos
            WHERE estado IS NOT NULL AND
            baja = false 
            AND CAST(fecha AS DATE) BETWEEN '${fechaInicio}' AND '${fechaFin}'
            AND tipo_ingres = '${tipo_ingres}'
            AND lugar = '${lugar}'AND estado !=''
            ORDER BY fecha ASC`;

    const ingresosRaw = await this.ingresoRepository.query(query);
        const ingresos = ingresosRaw.map((item) => {
         return {
                total_montos: Number(item.total_montos).toFixed(2),
                lugar: item.lugar,
                tipo_ingres: item.tipo_ingres,
                proveedor: item.proveedor,
                detalle: item.detalle,
                tipoIngreso: item.tipo_ingres,
                importe_total: Number(item.importe_total).toFixed(2),
                fechaInicio: fechaInicio,
                fechaFin: fechaFin,
                estado: item.estado,
                fecha_reg: new Date(item.fecha_reg).toLocaleDateString('es-ES'),
                fecha: new Date(item.fecha).toLocaleDateString('es-ES'),
                totalRegistros: ingresosRaw.length,
                totalMonto: ingresosRaw.reduce((acc, cur) => acc + Number(cur.monto), 0).toFixed(2),
                fechaReporte: new Date().toLocaleDateString('es-ES'),

            };
        });
    // Create Excel template path
      const templatePath = join(__dirname, '../../src/templates/ingresos-por-tipos-report.ods');
       console.log(ingresos);
    const data = {
        fechaInicio,
        fechaFin,
        ingresos: ingresos,
       
    };
    
    const options = { convertTo: 'xlsx' };
    
    return new Promise<Buffer>((resolve, reject) => {
        carbone.render(templatePath, data, options, (err, result) => {
            if (err) {
                return reject(err);
            }
            resolve(result);
        });
    });
}
 async generaReportRubrosExcel(fechaInicio: string, fechaFin: string, lugar: string): Promise<Buffer> {
        const query = `
            SELECT 
                CONCAT(num_rubro, ' - ',nombre) as rubros,
                CAST(fecha AS DATE) as fecha,
                lugar,
                fecha_reg,
                proveedor,
                detalle,
                tipo_ingres,
                SUM(importe_total) as importe_total,
                estado,
                SUM(SUM(importe_total)) OVER(PARTITION BY CONCAT(num_rubro, ' - ',nombre )) as total_nombre
            FROM ingresos
            WHERE estado IS NOT NULL AND estado !=''AND
            baja = false 
            AND CAST(fecha AS DATE) BETWEEN '${fechaInicio}' AND '${fechaFin}' AND lugar = '${lugar}'
            GROUP BY CONCAT(num_rubro, ' - ',nombre), CAST(fecha AS DATE), lugar, fecha_reg, proveedor, detalle, tipo_ingres, estado
            ORDER BY CONCAT(num_rubro, ' - ',nombre), CAST(fecha AS DATE)`;

        const ingresosRaw = await this.ingresoRepository.query(query);
        const ingresos = ingresosRaw.map((item) => {
            return {
                lugar: item.lugar,
                rubros: item.rubros,
                nombre: item.nombre,
                proveedor: item.proveedor,
                detalle: item.detalle,
                tipoIngreso: item.tipo_ingres,
                importe_total: Number(item.importe_total).toFixed(2),
                fechaInicio: fechaInicio,
                fechaFin: fechaFin,
                estado: item.estado,
                fecha_reg: new Date(item.fecha_reg).toLocaleDateString('es-ES'),
                fecha: new Date(item.fecha).toLocaleDateString('es-ES'),
                totalRegistros: ingresosRaw.length,
                totalMonto: ingresosRaw.reduce((acc, cur) => acc + Number(cur.importe_total), 0).toFixed(2),
                fechaReporte: new Date().toLocaleDateString('es-ES'),

            };
        });

     // Create Excel template path
      const templatePath = join(__dirname, '../../src/templates/ingresos-rubros-report.ods');
       console.log(ingresos);
    const data = {
        fechaInicio,
        fechaFin,
        ingresos: ingresos,
       
    };
    
    const options = { convertTo: 'xlsx' };
    
    return new Promise<Buffer>((resolve, reject) => {
        carbone.render(templatePath, data, options, (err, result) => {
            if (err) {
                return reject(err);
            }
            resolve(result);
        });
    });
}
 async generaReportPorRubroExcel(fechaInicio: string, fechaFin: string, nombre: string, lugar: string): Promise<Buffer> {
        const query = `
            SELECT 
                CONCAT(num_rubro, ' - ',nombre) as rubros,
                CAST(fecha AS DATE) as fecha,
                lugar,
                fecha_reg,
                proveedor,
                detalle,
                tipo_ingres,
                SUM(importe_total) as importe_total,
                estado,
                SUM(SUM(importe_total)) OVER(PARTITION BY CONCAT(num_rubro, ' - ',nombre )) as total_nombre
            FROM ingresos
            WHERE estado IS NOT NULL AND estado !=''AND
            baja = false 
            AND CAST(fecha AS DATE) BETWEEN '${fechaInicio}' AND '${fechaFin}'
            AND nombre= '${nombre}' AND lugar= '${lugar}'
            GROUP BY CONCAT(num_rubro, ' - ',nombre), CAST(fecha AS DATE), lugar, fecha_reg, proveedor, detalle, tipo_ingres, estado
            ORDER BY CONCAT(num_rubro, ' - ',nombre), CAST(fecha AS DATE)`;

        const ingresosRaw = await this.ingresoRepository.query(query);
        const ingresos = ingresosRaw.map((item) => {
            return {
                lugar: item.lugar,
                rubros: item.rubros,
                nombre: item.nombre,
                proveedor: item.proveedor,
                detalle: item.detalle,
                tipoIngreso: item.tipo_ingres,
                importe_total: Number(item.importe_total).toFixed(2),
                fechaInicio: fechaInicio,
                fechaFin: fechaFin,
                estado: item.estado,
                fecha_reg: new Date(item.fecha_reg).toLocaleDateString('es-ES'),
                fecha: new Date(item.fecha).toLocaleDateString('es-ES'),
                totalRegistros: ingresosRaw.length,
                totalMonto: ingresosRaw.reduce((acc, cur) => acc + Number(cur.importe_total), 0).toFixed(2),
                fechaReporte: new Date().toLocaleDateString('es-ES'),

            };
        });

        const templatePath = join(__dirname, '../../src/templates/ingresos-tipos-rubros-report.ods');
        console.log(ingresos);

        const data = {

            fechaInicio,
            fechaFin,
            //tipo_ingres,
            ingresos: ingresos
        };
      const options = { convertTo: 'xlsx' };
    
    return new Promise<Buffer>((resolve, reject) => {
        carbone.render(templatePath, data, options, (err, result) => {
            if (err) {
                return reject(err);
            }
            resolve(result);
        });
    });
}
  async generaReportRegionalExcel(fechaInicio: string, fechaFin: string): Promise<Buffer> {
        const query = `
            SELECT 
                CONCAT(num_rubro, ' - ',nombre) as rubros,
                CAST(fecha AS DATE) as fecha,
                lugar,
                fecha_reg,
                proveedor,
                detalle,
                tipo_ingres,
                SUM(importe_total) as importe_total,
                estado,
                SUM(SUM(importe_total)) OVER(PARTITION BY CONCAT(num_rubro, ' - ',nombre )) as total_nombre
            FROM ingresos
            WHERE estado IS NOT NULL AND estado !=''AND
            baja = false 
            AND CAST(fecha AS DATE) BETWEEN '${fechaInicio}' AND '${fechaFin}'
            GROUP BY CONCAT(num_rubro, ' - ',nombre), CAST(fecha AS DATE), lugar, fecha_reg, proveedor, detalle, tipo_ingres, estado
            ORDER BY CONCAT(num_rubro, ' - ',nombre), CAST(fecha AS DATE)`;

        const ingresosRaw = await this.ingresoRepository.query(query);
        const ingresos = ingresosRaw.map((item) => {
            return {
                lugar: item.lugar,
                rubros: item.rubros,
                nombre: item.nombre,
                proveedor: item.proveedor,
                detalle: item.detalle,
                tipoIngreso: item.tipo_ingres,
                importe_total: Number(item.importe_total).toFixed(2),
                fechaInicio: fechaInicio,
                fechaFin: fechaFin,
                estado: item.estado,
                fecha_reg: new Date(item.fecha_reg).toLocaleDateString('es-ES'),
                fecha: new Date(item.fecha).toLocaleDateString('es-ES'),
                totalRegistros: ingresosRaw.length,
                totalMonto: ingresosRaw.reduce((acc, cur) => acc + Number(cur.importe_total), 0).toFixed(2),
                fechaReporte: new Date().toLocaleDateString('es-ES'),

            };
        });

        const templatePath = join(__dirname, '../../src/templates/ingresos-rubros-report.ods');
        console.log(ingresos);

        const data = {

            fechaInicio,
            fechaFin,
            //tipo_ingres,
            ingresos: ingresos
        };
       const options = { convertTo: 'xlsx' };
    
    return new Promise<Buffer>((resolve, reject) => {
        carbone.render(templatePath, data, options, (err, result) => {
            if (err) {
                return reject(err);
            }
            resolve(result);
        });
    });
}
// async generaReportPorRegionalExcel(fechaInicio: string, fechaFin: string, lugar: string): Promise<Buffer> {
//         const query = `
//             SELECT 
//                 CONCAT(num_rubro, ' - ',nombre) as rubros,
//                 CAST(fecha AS DATE) as fecha,
//                 lugar,
//                 fecha_reg,
//                 proveedor,
//                 detalle,
//                 tipo_ingres,
//                 SUM(importe_total) as importe_total,
//                 estado,
//                 SUM(SUM(importe_total)) OVER(PARTITION BY CONCAT(num_rubro, ' - ',nombre )) as total_nombre
//             FROM ingresos
//             WHERE estado IS NOT NULL AND estado !=''AND
//             baja = false 
//             AND CAST(fecha AS DATE) BETWEEN '${fechaInicio}' AND '${fechaFin}'
//             AND nombre= '${lugar}'
//             GROUP BY CONCAT(num_rubro, ' - ',nombre), CAST(fecha AS DATE), lugar, fecha_reg, proveedor, detalle, tipo_ingres, estado
//             ORDER BY CONCAT(num_rubro, ' - ',nombre), CAST(fecha AS DATE)`;

//         const ingresosRaw = await this.ingresoRepository.query(query);
//         const ingresos = ingresosRaw.map((item) => {
//             return {
//                 lugar: item.lugar,
//                 rubros: item.rubros,
//                 nombre: item.nombre,
//                 proveedor: item.proveedor,
//                 detalle: item.detalle,
//                 tipoIngreso: item.tipo_ingres,
//                 importe_total: Number(item.importe_total),
//                 fechaInicio: fechaInicio,
//                 fechaFin: fechaFin,
//                 estado: item.estado,
//                 fecha_reg: new Date(item.fecha_reg).toLocaleDateString('es-ES'),
//                 fecha: new Date(item.fecha).toLocaleDateString('es-ES'),
//                 totalRegistros: ingresosRaw.length,
//                 totalMonto: ingresosRaw.reduce((acc, cur) => acc + Number(cur.importe_total), 0),
//                 fechaReporte: new Date().toLocaleDateString('es-ES'),

//             };
//         });

//         const templatePath = join(__dirname, '../../src/templates/ingresos-tipos-rubros-report.ods');
//         console.log(ingresos);

//         const data = {

//             fechaInicio,
//             fechaFin,
//             //tipo_ingres,
//             ingresos: ingresos
//         };
//          const options = { convertTo: 'xlsx' };
    
//     return new Promise<Buffer>((resolve, reject) => {
//         carbone.render(templatePath, data, options, (err, result) => {
//             if (err) {
//                 return reject(err);
//             }
//             resolve(result);
//         });
//     });
// }
 async generaReportGeneralRubrosPorLugarExcel(fechaInicio: string, fechaFin: string, lugar: string): Promise<Buffer> {
        const query = `
          SELECT 
             CONCAT(num_rubro, ' - ', nombre) as rubros,
             COALESCE(SUM(importe_total), 0) as totalMonto,
             MIN(CAST(fecha AS DATE)) as fechaInicio,
             MAX(CAST(fecha AS DATE)) as fechaFin,
             lugar,
             fecha_reg 
        FROM ingresos
        WHERE estado IS NOT NULL AND estado != '' AND
            baja = false 
            AND CAST(fecha AS DATE) BETWEEN '${fechaInicio}' AND '${fechaFin}'
            AND lugar='${lugar}'
            GROUP BY 
                CONCAT(num_rubro, ' - ', nombre),
                lugar,
                fecha_reg
            ORDER BY CONCAT(num_rubro, ' - ', nombre)`;

        const ingresosRaw = await this.ingresoRepository.query(query);
        const ingresos = ingresosRaw.map((item) => {
            return {
                lugar: item.lugar,
                rubros: item.rubros,
                importe_total: Number(item.totalmonto).toFixed(2),  // Cambiado de item.monto a item.totalmonto
                fechaInicio: fechaInicio,
                fechaFin: fechaFin,
                totalRegistros: ingresosRaw.length,
                totalMonto: ingresosRaw.reduce((acc, cur) => acc + Number(cur.totalmonto), 0).toFixed(2),  // Cambiado aquí también
                fechaReporte: new Date().toLocaleDateString('es-ES'),
                fecha_reg: new Date(item.fecha_reg).toLocaleDateString('es-ES'),
            };
        });
        const templatePath = join(__dirname, '../../src/templates/ingresos-resumen-rubros-lugar-report.ods');
        console.log(ingresos);

        const data = {

            fechaInicio,
            fechaFin,
            //tipo_ingres,
            ingresos: ingresos
        };
       const options = { convertTo: 'xlsx' };
    
    return new Promise<Buffer>((resolve, reject) => {
        carbone.render(templatePath, data, options, (err, result) => {
            if (err) {
                return reject(err);
            }
            resolve(result);
        });
    });
}
    async generaReportGeneralRubrosExcel(fechaInicio: string, fechaFin: string): Promise<Buffer> {
        const query = `
         SELECT 
             CONCAT(num_rubro, ' - ', nombre) as rubros,
             COALESCE(SUM(importe_total), 0) as totalMonto,
             MIN(CAST(fecha AS DATE)) as fechaInicio,
             MAX(CAST(fecha AS DATE)) as fechaFin,
             lugar,
            fecha_reg
        FROM ingresos
        WHERE estado IS NOT NULL AND estado != '' AND
            baja = false 
            AND CAST(fecha AS DATE) BETWEEN '${fechaInicio}' AND '${fechaFin}'
        GROUP BY 
            lugar,
            fecha_reg,
            CONCAT(num_rubro, ' - ', nombre)
        ORDER BY 
            lugar,
            CONCAT(num_rubro, ' - ', nombre)`;

        const ingresosRaw = await this.ingresoRepository.query(query);


        const ingresos = ingresosRaw.map((item) => {
            return {
                fecha_reg: new Date(item.fecha_reg).toLocaleDateString('es-ES'),
                lugar: item.lugar,
                rubros: item.rubros,
                importe_total: Number(item.totalmonto).toFixed(2),  // Cambiado de item.monto a item.totalmonto
                fechaInicio: fechaInicio,
                fechaFin: fechaFin,
                totalRegistros: ingresosRaw.length,
                totalMonto: ingresosRaw.reduce((acc, cur) => acc + Number(cur.totalmonto), 0).toFixed(2),  // Cambiado aquí también
                fechaReporte: new Date().toLocaleDateString('es-ES'),
            };
        });
        const templatePath = join(__dirname, '../../src/templates/ingresos-resumen-rubros-report.ods');
        console.log(ingresos);

        const data = {

            fechaInicio,
            fechaFin,
            //tipo_ingres,
            ingresos: ingresos
        };
       const options = { convertTo: 'xlsx' };
    
    return new Promise<Buffer>((resolve, reject) => {
        carbone.render(templatePath, data, options, (err, result) => {
            if (err) {
                return reject(err);
            }
            resolve(result);
        });
    });
}

    async generaReportEmisionLugarExcel(fechaInicio: string, fechaFin: string, tipo_emision: string, lugar: string): Promise<Buffer> {
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
		        tipo_emision,
                importe_total,
                SUM(monto) OVER () as total_montos
        FROM ingresos
        WHERE estado IS NOT NULL AND
                baja = false 
                AND CAST(fecha AS DATE) BETWEEN '${fechaInicio}' AND '${fechaFin}'
                AND tipo_emision = '${tipo_emision}'
                AND lugar='${lugar}'
        ORDER BY fecha ASC`;

        const ingresosRaw = await this.ingresoRepository.query(query);


        const ingresos = ingresosRaw.map((item) => {
            return {
                importe_total: Number(item.importe_total).toFixed(2),
                estado: item.estado,
                total_montos: Number(item.total_montos).toFixed(2),
                proveedor: item.proveedor,
                detalle: item.detalle,
                tipoIngreso: item.tipo_ingres,
                lugar: item.lugar,
                tipo_emision: item.tipo_emision,
                fecha_reg: new Date(item.fecha_reg).toLocaleDateString('es-ES'),
                monto: Number(item.monto).toFixed(2),  // Cambiado de item.monto a item.totalmonto
                fechaInicio: fechaInicio,
                fechaFin: fechaFin,
                totalRegistros: ingresosRaw.length,
                fechaReporte: new Date().toLocaleDateString('es-ES'),
            };
        });
        const templatePath = join(__dirname, '../../src/templates/ingresos-emisionLugar-report.ods');
        console.log(ingresos);

        const data = {

            fechaInicio,
            fechaFin,
            ingresos: ingresos
        };
       const options = { convertTo: 'xlsx' };
    
    return new Promise<Buffer>((resolve, reject) => {
        carbone.render(templatePath, data, options, (err, result) => {
            if (err) {
                return reject(err);
            }
            resolve(result);
        });
    });
}
     async generaReportEmisionExcel(fechaInicio: string, fechaFin: string, tipo_emision: string): Promise<Buffer> {
        const query = `
         SELECT
                fecha,
                lugar,
                fecha_reg,
                proveedor,
                detalle,
                tipo_ingres,
                importe_total,
                estado,
		        tipo_emision,
                SUM(importe_total) OVER () as total_montos
        FROM ingresos
        WHERE estado IS NOT NULL AND
                baja = false 
                AND CAST(fecha AS DATE) BETWEEN '${fechaInicio}' AND '${fechaFin}'
                AND tipo_emision = '${tipo_emision}'
        ORDER BY fecha ASC`;

        const ingresosRaw = await this.ingresoRepository.query(query);


        const ingresos = ingresosRaw.map((item) => {
            return {
                estado: item.estado,
                total_montos: Number(item.total_montos).toFixed(2),
                proveedor: item.proveedor,
                detalle: item.detalle,
                tipoIngreso: item.tipo_ingres,
                tipo_emision: item.tipo_emision,
                fecha_reg: new Date(item.fecha_reg).toLocaleDateString('es-ES'),
                importe_total: Number(item.importe_total).toFixed(2),  // Cambiado de item.monto a item.totalmonto
                fechaInicio: fechaInicio,
                fechaFin: fechaFin,
                totalRegistros: ingresosRaw.length,
                fechaReporte: new Date().toLocaleDateString('es-ES'),
            };
        });
        const templatePath = join(__dirname, '../../src/templates/ingresos-emision-report.ods');
        console.log(ingresos);

        const data = {

            fechaInicio,
            fechaFin,
            ingresos: ingresos
        };
       const options = { convertTo: 'xlsx' };
    
    return new Promise<Buffer>((resolve, reject) => {
        carbone.render(templatePath, data, options, (err, result) => {
            if (err) {
                return reject(err);
            }
            resolve(result);
        });
    });
}
}
