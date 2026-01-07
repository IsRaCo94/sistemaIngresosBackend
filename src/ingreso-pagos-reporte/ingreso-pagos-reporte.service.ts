
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IngresoPagosReporteEntity } from './ingreso-pagos-reporte.entity';
import { join } from 'path';
import * as carbone from 'carbone';
import * as libreofficeConvert from 'libreoffice-convert';

@Injectable()
export class IngresoPagosReporteService {

    constructor(
        @InjectRepository(IngresoPagosReporteEntity) 
        private readonly ingresoPagosReporteRepository: Repository<IngresoPagosReporteEntity>
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

    async generarReportePorPartidaPresupuestaria(catProg?: string, fechaInicio?: string, fechaFin?: string): Promise<Buffer> {
        // Validar y formatear fechas
        let fechaInicioFormatted: string | null = null;
        let fechaFinFormatted: string | null = null;
        
        if (fechaInicio) {
            const fechaInicioDate = new Date(fechaInicio);
            if (!isNaN(fechaInicioDate.getTime())) {
                fechaInicioFormatted = fechaInicioDate.toISOString().split('T')[0];
            }
        }
        
        if (fechaFin) {
            const fechaFinDate = new Date(fechaFin);
            if (!isNaN(fechaFinDate.getTime())) {
                fechaFinFormatted = fechaFinDate.toISOString().split('T')[0];
            }
        }

        // Query con los campos específicos necesarios
        const query = `
            SELECT 
                pag.num_prev, 
                pag.num_comp, 
                pag.num_dev, 
                pag.num_pag, 
                pag.num_sec, 
                pag."fechaElab",
                pag.area_organizacional, 
                det.glosa,
                det.importe,
                pag.partida,
                pag."catProg",
                pag.gestion,
                pag.descripcion
            FROM gastos_pagos_det det
            JOIN gastos_pagos pag ON det.id_pago = pag.id_pago
            WHERE (pag.baja IS NULL OR pag.baja = false) 
                AND (det.baja IS NULL OR det.baja = false)
                AND pag."catProg" = '${catProg}'
                AND CAST(det.fecha AS DATE) BETWEEN '${fechaInicio}' AND '${fechaFin}'
            ORDER BY pag."catProg", pag.partida, det.fecha DESC, det.id_pago_det DESC
        `;

        const pagosRaw = await this.ingresoPagosReporteRepository.query(query);

        const pagos = pagosRaw.map((item) => {
            return {
                num_prev: item.num_prev || '',
                num_comp: item.num_comp || '',
                num_dev: item.num_dev || '',
                num_pag: item.num_pag || '',
                num_sec: item.num_sec || '',
                fechaElab: item.fechaElab ? new Date(item.fechaElab).toLocaleDateString('es-ES') : '',
                area_organizacional: item.area_organizacional || '',
                glosa: item.glosa || '',
                importe: Number(item.importe || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
                partida: item.partida || '',
                catProg: item.catProg || '',
                gestion: item.gestion || new Date().getFullYear(),
                descripcion: item.descripcion || ''
            };
        });

        // Calcular sumatoria total del importe
        const totalImporte = pagosRaw.reduce((total, item) => {
            return total + Number(item.importe || 0);
        }, 0);

        const templatePath = join(__dirname, '../../src/templates/reporte-pagos-por-partida.odt');
        console.log(pagos);

        // Obtener fecha y hora actual para el reporte
        const fechaActual = new Date();
        const fechaHoraReporte = `${fechaActual.toLocaleDateString('es-ES')} ${fechaActual.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;

        const data = {
            fechaInicio,
            fechaFin,
            catProg,
            pagos: pagos,
            fechaHoraReporte: fechaHoraReporte,
            totalImporte: totalImporte.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
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

}
