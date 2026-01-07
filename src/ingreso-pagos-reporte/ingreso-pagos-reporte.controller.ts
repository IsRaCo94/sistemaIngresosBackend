import { Controller, Get, Param, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { IngresoPagosReporteService } from './ingreso-pagos-reporte.service';
import { IngresoPagosReporteEntity } from './ingreso-pagos-reporte.entity';


@Controller('api/ingreso-pagos-reporte')
export class IngresoPagosReporteController {

  constructor(private service: IngresoPagosReporteService) { }

  /**
   * Genera reporte de pagos por partida presupuestaria
   * @param fechaInicio - Fecha de inicio del rango
   * @param fechaFin - Fecha final del rango
   * @param catProg - Categoría programática
   * @param res - Response object para enviar el PDF
   */
  @Get('reporte-por-partida/:fechaInicio/:fechaFin/:catProg')
  async generarReportePorPartida(
    @Param('fechaInicio') fechaInicio: string,
    @Param('fechaFin') fechaFin: string,
    @Param('catProg') catProg: string,
    @Res() res: Response
  ) {
    try {
      const reportBuffer = await this.service.generarReportePorPartidaPresupuestaria(
        catProg,
        fechaInicio,
        fechaFin
      );
      
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="reporte_pagos_partida_${fechaInicio}_a_${fechaFin}.pdf"`,
        'Content-Length': reportBuffer.length,
      });
      res.send(reportBuffer);
    } catch (error) {
      console.error('Report generation error:', error);
      res.status(500).json({ 
        message: 'Error generating report', 
        error: error.message, 
        stack: error.stack 
      });
    }
  }

}
