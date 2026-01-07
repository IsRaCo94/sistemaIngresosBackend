import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EgresosReportesEntity } from './egresos-reportes.entity';
import { Repository } from 'typeorm';
import { join } from 'path';
import * as carbone from 'carbone';
import * as ExcelJS from 'exceljs';
import * as libreofficeConvert from 'libreoffice-convert';

@Injectable()
export class EgresosReportesService {

    constructor(@InjectRepository(EgresosReportesEntity)
    private readonly egresosRepository: Repository<EgresosReportesEntity>) {
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

    async generaReporteEgresos(fechaInicio: string, fechaFin: string, lugar: string): Promise<Buffer> {
        const query = `
           SELECT 
            fecha,
            lugar,
            fecha_reg,
            num_cheque,
            proveedor,
            monto,
            estado,
            fecha_cobro,
            cobrado,
            cerrado,
            observacion,
            SUM(monto) OVER () as total_montos,
            COUNT(*) OVER (PARTITION BY fecha) as total_registros_fecha,
            SUM(monto) OVER (PARTITION BY fecha) as total_diario,
            SUM(monto) OVER () as total_general
        FROM egresos
        WHERE estado IS NOT NULL AND
        baja = false 
        AND CAST(fecha AS DATE) BETWEEN '${fechaInicio}' AND '${fechaFin}'
        AND lugar = '${lugar}' AND estado != '' 
        ORDER BY fecha, monto ASC;`;

        const egresosRaw = await this.egresosRepository.query(query);

        console.log(`=== DEBUG REPORTE EGRESOS ===`);
        console.log(`Fechas: ${fechaInicio} a ${fechaFin}, Lugar: ${lugar}`);
        console.log(`Total registros encontrados: ${egresosRaw.length}`);
        if (egresosRaw.length > 0) {
            const totalCalculado = egresosRaw.reduce((sum, item) => sum + Number(item.monto || 0), 0);
            console.log(`Total calculado manualmente: ${totalCalculado}`);
            console.log(`Total desde query (primer registro): ${egresosRaw[0].total_montos}`);
            console.log('Primeros 3 registros:', egresosRaw.slice(0, 3).map(r => ({
                proveedor: r.proveedor,
                monto: r.monto,
                num_cheque: r.num_cheque,
                estado: r.estado
            })));
        }

        const egresos = egresosRaw.map((item) => {
            return {
                total_montos: Number(item.total_montos).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
                lugar: item.lugar,
                num_cheque: item.num_cheque,
                proveedor: item.proveedor,
                observacion: item.observacion,
                monto: Number(item.monto).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
                total_general: Number(item.total_general).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
                total_diario: Number(item.total_diario).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
                fechaInicio: fechaInicio,
                fechaFin: fechaFin,
                estado: item.estado,
                fecha_cobro: new Date(item.fecha_cobro).toLocaleDateString('es-ES'),
                fecha: new Date(item.fecha).toLocaleDateString('es-ES'),
                fecha_reg: new Date(item.fecha_reg).toLocaleDateString('es-ES'),
                cobrado: item.cobrado,
                cerrado: item.cerrado,
                total_registros_fecha: Number(item.total_registros_fecha),
                fechaReporte: new Date().toLocaleDateString('es-ES'),
            };
        });

        const templatePath = join(__dirname, '../../src/templates/egresos-report.odt');
        console.log(egresos);

        const data = {
            fechaInicio,
            fechaFin,
            egresos: egresos,
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

    // Método adicional para generar reporte por estado
    async generaReportePorEstado(fechaInicio: string, fechaFin: string, estado: string, lugar: string): Promise<Buffer> {
        try {
            const query = `
               SELECT 
                fecha,
                lugar,
                fecha_reg,
                num_cheque,
                proveedor,
                monto,
                estado,
                fecha_cobro,
                cobrado,
                cerrado,
                observacion,
                SUM(monto) OVER () as total_montos,
                COUNT(*) OVER (PARTITION BY fecha) as total_registros_fecha,
                SUM(monto) OVER (PARTITION BY fecha) as total_diario,
                COUNT(*) OVER () as total_registros
            FROM egresos
            WHERE estado IS NOT NULL AND
            baja = false 
            AND CAST(fecha AS DATE) BETWEEN $1 AND $2
            AND lugar = $3 
            AND estado = $4
            ORDER BY fecha, monto ASC`;

            const egresosRaw = await this.egresosRepository.query(query, [fechaInicio, fechaFin, lugar, estado]);

            console.log(`=== DEBUG REPORTE EGRESOS POR ESTADO ===`);
            console.log(`Fechas: ${fechaInicio} a ${fechaFin}, Lugar: ${lugar}, Estado: ${estado}`);
            console.log(`Total registros encontrados: ${egresosRaw.length}`);
            
            if (egresosRaw.length > 0) {
                const totalCalculado = egresosRaw.reduce((sum, item) => sum + Number(item.monto || 0), 0);
                console.log(`Total calculado manualmente: ${totalCalculado}`);
                console.log(`Total desde query (primer registro): ${egresosRaw[0].total_montos}`);
                console.log('Primeros 3 registros:', egresosRaw.slice(0, 3).map(r => ({
                    proveedor: r.proveedor,
                    monto: r.monto,
                    num_cheque: r.num_cheque,
                    estado: r.estado
                })));
            }

            const egresos = egresosRaw.map((item) => {
                return {
                    total_montos: Number(item.total_montos).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
                    lugar: item.lugar,
                    num_cheque: item.num_cheque,
                    proveedor: item.proveedor,
                    observacion: item.observacion,
                    monto: Number(item.monto).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
                    total_general: Number(item.total_montos).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
                    total_diario: Number(item.total_diario).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
                    fechaInicio: fechaInicio,
                    fechaFin: fechaFin,
                    estado: item.estado,
                    estado_filtro: estado,
                    fecha_cobro: new Date(item.fecha_cobro).toLocaleDateString('es-ES'),
                    fecha: new Date(item.fecha).toLocaleDateString('es-ES'),
                    fecha_reg: new Date(item.fecha_reg).toLocaleDateString('es-ES'),
                    cobrado: item.cobrado,
                    cerrado: item.cerrado,
                    total_registros_fecha: Number(item.total_registros_fecha),
                    total_registros: Number(item.total_registros),
                    fechaReporte: new Date().toLocaleDateString('es-ES'),
                };
            });

            const templatePath = join(__dirname, '../../src/templates/egresos-report-estado.odt');
            console.log(egresos);

            const data = {
                fechaInicio,
                fechaFin,
                estado,
                egresos: egresos,
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
        } catch (error) {
            console.error('Error generating egresos report by status:', error);
            throw new Error(`Error generating report by status: ${error.message}`);
        }
    }
}