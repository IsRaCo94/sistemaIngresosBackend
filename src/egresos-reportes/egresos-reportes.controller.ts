import {
  Controller,
  Get,
  Param,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { EgresosReportesService } from './egresos-reportes.service';

@Controller('api/egresos-reportes')
export class EgresosReportesController {
  constructor(private readonly egresosReportesService: EgresosReportesService) { }

  @Get('reporte-egresos/:fechaInicio/:fechaFin/:lugar')
  async getReporteEgresos(
    @Param('fechaInicio') fechaInicio: string,
    @Param('fechaFin') fechaFin: string,
    @Param('lugar') lugar: string,
    @Res() res: Response
  ) {
    try {
      const reportBuffer = await this.egresosReportesService.generaReporteEgresos(
        fechaInicio,
        fechaFin,
        lugar
      );
      
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="reporte_egresos_${fechaInicio}_a_${fechaFin}.pdf"`,
        'Content-Length': reportBuffer.length,
      });
      res.send(reportBuffer);
    } catch (error) {
      console.error('Report generation error:', error);
      res.status(500).json({ 
        message: 'Error generating egresos report', 
        error: error.message, 
        stack: error.stack 
      });
    }
  }

  @Get('reporte-por-estado/:fechaInicio/:fechaFin/:estado/:lugar')
  async getReportePorEstado(
    @Param('fechaInicio') fechaInicio: string,
    @Param('fechaFin') fechaFin: string,
    @Param('estado') estado: string,
    @Param('lugar') lugar: string,
    @Res() res: Response
  ) {
    try {
      const reportBuffer = await this.egresosReportesService.generaReportePorEstado(
        fechaInicio,
        fechaFin,
        estado,
        lugar
      );
      
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="reporte_egresos_${estado}_${fechaInicio}_a_${fechaFin}.pdf"`,
        'Content-Length': reportBuffer.length,
      });
      res.send(reportBuffer);
    } catch (error) {
      console.error('Report by status generation error:', error);
      res.status(500).json({ 
        message: 'Error generating egresos report by status', 
        error: error.message, 
        stack: error.stack 
      });
    }
  }

  // Endpoint adicional para obtener resumen de egresos
  @Get('resumen/:fechaInicio/:fechaFin/:lugar')
  async getResumenEgresos(
    @Param('fechaInicio') fechaInicio: string,
    @Param('fechaFin') fechaFin: string,
    @Param('lugar') lugar: string,
  ) {
    try {
      // Este endpoint podría ser útil para obtener estadísticas sin generar PDF
      const query = `
        SELECT 
          COUNT(*) as total_registros,
          SUM(monto) as total_monto,
          COUNT(CASE WHEN estado = 'GIRADO' THEN 1 END) as total_girados,
          COUNT(CASE WHEN estado = 'ANULADO' THEN 1 END) as total_anulados,
          COUNT(CASE WHEN cobrado = 'SI' THEN 1 END) as total_cobrados,
          COUNT(CASE WHEN cerrado = 'SI' THEN 1 END) as total_cerrados
        FROM egresos
        WHERE baja = false 
        AND CAST(fecha AS DATE) BETWEEN '${fechaInicio}' AND '${fechaFin}'
        AND lugar = '${lugar}';
      `;

      const resumen = await this.egresosReportesService['egresosRepository'].query(query);
      
      return {
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
        lugar: lugar,
        resumen: resumen[0] || {},
        fecha_consulta: new Date().toISOString()
      };
    } catch (error) {
      console.error('Summary generation error:', error);
      return { 
        message: 'Error generating summary', 
        error: error.message 
      };
    }
  }
}