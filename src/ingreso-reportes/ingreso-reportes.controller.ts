import {
  Controller,
  Get,
  Param,
  Res,
 
} from '@nestjs/common';
import { Response } from 'express';
import { IngresoReportesService } from './ingreso-reportes.service';
import { IngresoReportesEntity } from './ingreso-reportes.entity';
@Controller('api/ingreso-reportes')
export class IngresoReportesController {
  constructor(private readonly IngresoReportesService: IngresoReportesService) { }

@Get('reporte-ingreso/:fechaInicio/:fechaFin/:lugar')

async getReporteTipoIngreso(
  @Param('fechaInicio') fechaInicio: string,
  @Param('fechaFin') fechaFin: string,
  @Param('lugar') lugar: string,
  @Res() res: Response
) {
  try {
    const reportBuffer = await this.IngresoReportesService.generaReporteTipoIngreso(
      fechaInicio,
      fechaFin,
      lugar
    );
    
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="reporte_ingresos_${fechaInicio}_a_${fechaFin}.pdf"`,
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

@Get('reporte-tipo-ingreso/:fechaInicio/:fechaFin/:tipo_ingres/:lugar')
async getReportePorTipoIngreso(
  @Param('fechaInicio') fechaInicio: string,
  @Param('fechaFin') fechaFin: string,
  @Param('tipo_ingres') tipo_ingres: string,
  @Param('lugar') lugar: string,
  @Res() res: Response
) {
  try {
    const reportBuffer = await this.IngresoReportesService.generaReportePorTipoIngreso(
      fechaInicio,
      fechaFin,
      tipo_ingres,
      lugar
    );
    
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="reporte_ingresos_${fechaInicio}_a_${fechaFin}.pdf"`,
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
@Get('reporte-ingreso-tipo-rubro/:fechaInicio/:fechaFin/:nombre/:lugar')
async getReportePorRubro(
  @Param('fechaInicio') fechaInicio: string,
  @Param('fechaFin') fechaFin: string,
  @Param('nombre') nombre: string,
  @Param('lugar') lugar: string,
  @Res() res: Response
) {
  try {
    const reportBuffer = await this.IngresoReportesService.generaReportPorRubro(
      fechaInicio,
      fechaFin,
      nombre,
      lugar
    );
    
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="reporte_ingresos_${fechaInicio}_a_${fechaFin}.pdf"`,
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
@Get('reporte-ingreso-rubro/:fechaInicio/:fechaFin/:lugar')
async getReporteRubros(
  @Param('fechaInicio') fechaInicio: string,
  @Param('fechaFin') fechaFin: string,
  @Param('lugar') lugar: string,
  @Res() res: Response
) {
  try {
    const reportBuffer = await this.IngresoReportesService.generaReportRubros(
      fechaInicio,
      fechaFin,
      lugar
    );
    
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="reporte_ingresos_${fechaInicio}_a_${fechaFin}.pdf"`,
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
// @Get('reporte-ingreso-regional/:fechaInicio/:fechaFin/:lugar')
// async getReportePorRegional(
//   @Param('fechaInicio') fechaInicio: string,
//   @Param('fechaFin') fechaFin: string,
//   @Param('lugar') lugar: string,
//   @Res() res: Response
// ) {
//   try {
//     const reportBuffer = await this.IngresoReportesService.generaReportPorRegional(
//       fechaInicio,
//       fechaFin,
//       lugar
//     );
    
//     res.set({
//       'Content-Type': 'application/pdf',
//       'Content-Disposition': `attachment; filename="reporte_ingresos_${fechaInicio}_a_${fechaFin}.pdf"`,
//       'Content-Length': reportBuffer.length,
//     });
//     res.send(reportBuffer);
//   } catch (error) {
//     console.error('Report generation error:', error);
//     res.status(500).json({ 
//       message: 'Error generating report', 
//       error: error.message, 
//       stack: error.stack 
//     });
//   }
// }
@Get('reporte-ingreso-regional/:fechaInicio/:fechaFin')
async getReporteRegional(
  @Param('fechaInicio') fechaInicio: string,
  @Param('fechaFin') fechaFin: string,
  @Res() res: Response
) {
  try {
    const reportBuffer = await this.IngresoReportesService.generaReportRegional(
      fechaInicio,
      fechaFin,
    );
    
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="reporte_ingresos_${fechaInicio}_a_${fechaFin}.pdf"`,
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

@Get('reporte-ingreso-resumen-rubros-lugar/:fechaInicio/:fechaFin/:lugar')
async getReportGeneralRubrosPorLugar(
  @Param('fechaInicio') fechaInicio: string,
  @Param('fechaFin') fechaFin: string,
  @Param('lugar') lugar: string,
  @Res() res: Response
) {
  try {
    const reportBuffer = await this.IngresoReportesService.generaReportGeneralRubrosPorLugar(
      fechaInicio,
      fechaFin,
      lugar
    );
    
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="reporte_ingresos_${fechaInicio}_a_${fechaFin}.pdf"`,
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
@Get('reporte-ingreso-resumen-rubros/:fechaInicio/:fechaFin')
async getReportGeneralRubros(
  @Param('fechaInicio') fechaInicio: string,
  @Param('fechaFin') fechaFin: string,
  @Res() res: Response
) {
  try {
    const reportBuffer = await this.IngresoReportesService.generaReportGeneralRubros(
      fechaInicio,
      fechaFin,
    );
    
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="reporte_ingresos_${fechaInicio}_a_${fechaFin}.pdf"`,
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
@Get('reporte-ingreso-emision-lugar/:fechaInicio/:fechaFin/:lugar/:tipo_emision')
async getReportEmisionPorLugar(
  @Param('fechaInicio') fechaInicio: string,
  @Param('fechaFin') fechaFin: string,
  @Param('lugar') lugar: string,
  @Param('tipo_emision') tipo_emision: string,
  @Res() res: Response
) {
  try {
    const reportBuffer = await this.IngresoReportesService.generaReportEmisionLugar(
      fechaInicio,
      fechaFin,
      tipo_emision,
      lugar
    );
    
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="reporte_ingresos_${fechaInicio}_a_${fechaFin}.pdf"`,
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
@Get('reporte-ingreso-emision/:fechaInicio/:fechaFin/:tipo_emision')
async getReportEmision(
  @Param('fechaInicio') fechaInicio: string,
  @Param('fechaFin') fechaFin: string,
  @Param('tipo_emision') tipo_emision: string,
  @Res() res: Response
) {
  try {
    const reportBuffer = await this.IngresoReportesService.generaReportEmision(
      fechaInicio,
      fechaFin,
      tipo_emision,
    );
    
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="reporte_ingresos_${fechaInicio}_a_${fechaFin}.pdf"`,
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

/* genera reporte en formato excel*/
@Get('reporte-ingreso-excel/:fechaInicio/:fechaFin/:lugar')
async getReporteTipoIngresoExcel(
  @Param('fechaInicio') fechaInicio: string,
  @Param('fechaFin') fechaFin: string,
  @Param('lugar') lugar: string,
  @Res() res: Response
) {
  try {
    const excelBuffer = await this.IngresoReportesService.generaReporteTipoIngresoExcel(
      fechaInicio,
      fechaFin,
      lugar
    );
    

    
    const fileName = `reporte_ingresos_${fechaInicio}_a_${fechaFin}.xlsx`;
   
    
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${fileName}"`,
      'Content-Length': excelBuffer.length,
    });
    res.send(excelBuffer);
  } catch (error) {
    console.error('Error generando reporte Excel:', error);
    res.status(500).json({ 
      message: 'Error generando reporte Excel', 
      error: error.message, 
      stack: error.stack 
    });
  }
}
@Get('reporte-tipo-ingreso-excel/:fechaInicio/:fechaFin/:tipo_ingres/:lugar')
async getReportePorTipoIngresoExcel(
  @Param('fechaInicio') fechaInicio: string,
  @Param('fechaFin') fechaFin: string,
  @Param('tipo_ingres') tipo_ingres: string,
  @Param('lugar') lugar: string,
  @Res() res: Response
) {
try {
    const excelBuffer = await this.IngresoReportesService.generaReportePorTipoIngresoExcel(
      fechaInicio,
      fechaFin,
      tipo_ingres,
      lugar
    );
    
 
    const fileName = `reporte_ingresos_tipos_${fechaInicio}_a_${fechaFin}.xlsx`;
   
    
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${fileName}"`,
      'Content-Length': excelBuffer.length,
    });
    res.send(excelBuffer);
  } catch (error) {
    console.error('Error generando reporte Excel:', error);
    res.status(500).json({ 
      message: 'Error generando reporte Excel', 
      error: error.message, 
      stack: error.stack 
    });
  }
}
@Get('reporte-ingreso-rubro-excel/:fechaInicio/:fechaFin/:lugar')
async getReporteRubrosExcel(
  @Param('fechaInicio') fechaInicio: string,
  @Param('fechaFin') fechaFin: string,
  @Param('lugar') lugar: string,
  @Res() res: Response
) {
  try {
    const excelBuffer = await this.IngresoReportesService.generaReportRubrosExcel(
      fechaInicio,
      fechaFin,
      lugar
    );
    
   
    const fileName = `reporte_ingresos_rubros_${fechaInicio}_a_${fechaFin}.xlsx`;
  
    
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${fileName}"`,
      'Content-Length': excelBuffer.length,
    });
    res.send(excelBuffer);
  } catch (error) {
    console.error('Error generando reporte Excel:', error);
    res.status(500).json({ 
      message: 'Error generando reporte Excel', 
      error: error.message, 
      stack: error.stack 
    });
  }

}
@Get('reporte-ingreso-tipo-rubro-excel/:fechaInicio/:fechaFin/:nombre/:lugar')
async getReportePorRubroExcel(
  @Param('fechaInicio') fechaInicio: string,
  @Param('fechaFin') fechaFin: string,
  @Param('nombre') nombre: string,
  @Param('lugar') lugar: string,
  @Res() res: Response
) {
  try {
    const excelBuffer = await this.IngresoReportesService.generaReportPorRubroExcel(
      fechaInicio,
      fechaFin,
      nombre,
      lugar
    );
  
    const fileName = `reporte_ingresos_rubros_${fechaInicio}_a_${fechaFin}.xlsx`;
  
     res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${fileName}"`,
      'Content-Length': excelBuffer.length,
    });
    res.send(excelBuffer);
  } catch (error) {
    console.error('Error generando reporte Excel:', error);
    res.status(500).json({ 
      message: 'Error generando reporte Excel', 
      error: error.message, 
      stack: error.stack 
    });
  }
}
@Get('reporte-ingreso-regional-excel/:fechaInicio/:fechaFin')
async getReporteRegionalExcel(
  @Param('fechaInicio') fechaInicio: string,
  @Param('fechaFin') fechaFin: string,
  @Res() res: Response
) {
  try {
    const excelBuffer = await this.IngresoReportesService.generaReportRegionalExcel(
      fechaInicio,
      fechaFin,
    );
    
 
    const fileName = `reporte_ingresos_regional_${fechaInicio}_a_${fechaFin}.xlsx`;
  
     res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${fileName}"`,
      'Content-Length': excelBuffer.length,
    });
    res.send(excelBuffer);
  } catch (error) {
    console.error('Error generando reporte Excel:', error);
    res.status(500).json({ 
      message: 'Error generando reporte Excel', 
      error: error.message, 
      stack: error.stack 
    });
  }
}
// @Get('reporte-ingreso-por-regional-excel/:fechaInicio/:fechaFin/:lugar')
// async generaReportPorRegionalExcel(
//   @Param('fechaInicio') fechaInicio: string,
//   @Param('fechaFin') fechaFin: string,
//   @Param('lugar') lugar: string,
//   @Res() res: Response
// ) {
//   try {
//     const excelBuffer = await this.IngresoReportesService.generaReportPorRegionalExcel(
//       fechaInicio,
//       fechaFin,
//       lugar
//     );
    
//      const fs = require('fs');
//     const fileName = `reporte_ingresos_regional_lugar_${fechaInicio}_a_${fechaFin}.xlsx`;
//     fs.writeFileSync(fileName, excelBuffer);
//      res.set({
//       'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
//       'Content-Disposition': `attachment; filename="${fileName}"`,
//       'Content-Length': excelBuffer.length,
//     });
//     res.send(excelBuffer);
//   } catch (error) {
//     console.error('Error generando reporte Excel:', error);
//     res.status(500).json({ 
//       message: 'Error generando reporte Excel', 
//       error: error.message, 
//       stack: error.stack 
//     });
//   }
// }
@Get('reporte-ingreso-resumen-rubros-lugar-excel/:fechaInicio/:fechaFin/:lugar')
async getReportGeneralRubrosPorLugarExcel(
  @Param('fechaInicio') fechaInicio: string,
  @Param('fechaFin') fechaFin: string,
  @Param('lugar') lugar: string,
  @Res() res: Response
) {
  try {
    const excelBuffer = await this.IngresoReportesService.generaReportGeneralRubrosPorLugarExcel(
      fechaInicio,
      fechaFin,
      lugar
    );
    
   
    const fileName = `reporte_ingresos_resumen_rubros_${fechaInicio}_a_${fechaFin}.xlsx`;
  
     res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${fileName}"`,
      'Content-Length': excelBuffer.length,
    });
    res.send(excelBuffer);
  } catch (error) {
    console.error('Error generando reporte Excel:', error);
    res.status(500).json({ 
      message: 'Error generando reporte Excel', 
      error: error.message, 
      stack: error.stack 
    });
  }
}
@Get('reporte-ingreso-resumen-rubros-excel/:fechaInicio/:fechaFin')
async getReportGeneralRubrosExcel(
  @Param('fechaInicio') fechaInicio: string,
  @Param('fechaFin') fechaFin: string,
  @Res() res: Response
) {
  try {
    const excelBuffer = await this.IngresoReportesService.generaReportGeneralRubrosExcel(
      fechaInicio,
      fechaFin,
    );
    

    const fileName = `reporte_ingresos_resumen_rubros_${fechaInicio}_a_${fechaFin}.xlsx`;

     res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${fileName}"`,
      'Content-Length': excelBuffer.length,
    });
    res.send(excelBuffer);
  } catch (error) {
    console.error('Error generando reporte Excel:', error);
    res.status(500).json({ 
      message: 'Error generando reporte Excel', 
      error: error.message, 
      stack: error.stack 
    });
  }
}
@Get('reporte-ingreso-emision-lugar-excel/:fechaInicio/:fechaFin/:lugar/:tipo_emision')
async getReportEmisionPorLugarExcel(
  @Param('fechaInicio') fechaInicio: string,
  @Param('fechaFin') fechaFin: string,
  @Param('lugar') lugar: string,
  @Param('tipo_emision') tipo_emision: string,
  @Res() res: Response
) {
  try {
    const excelBuffer = await this.IngresoReportesService.generaReportEmisionLugarExcel(
      fechaInicio,
      fechaFin,
      tipo_emision,
      lugar
    );
    
  
    const fileName = `reporte_ingresos_emision_${fechaInicio}_a_${fechaFin}.xlsx`;
 
     res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${fileName}"`,
      'Content-Length': excelBuffer.length,
    });
    res.send(excelBuffer);
  } catch (error) {
    console.error('Error generando reporte Excel:', error);
    res.status(500).json({ 
      message: 'Error generando reporte Excel', 
      error: error.message, 
      stack: error.stack 
    });
  }
}
@Get('reporte-ingreso-emision-excel/:fechaInicio/:fechaFin/:tipo_emision')
async getReportEmisionExcel(
  @Param('fechaInicio') fechaInicio: string,
  @Param('fechaFin') fechaFin: string,
  @Param('tipo_emision') tipo_emision: string,
  @Res() res: Response
) {
  try {
    const excelBuffer = await this.IngresoReportesService.generaReportEmisionExcel(
      fechaInicio,
      fechaFin,
      tipo_emision,
    );
    
 
    const fileName = `reporte_ingresos_emision_${fechaInicio}_a_${fechaFin}.xlsx`;
  
     res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${fileName}"`,
      'Content-Length': excelBuffer.length,
    });
    res.send(excelBuffer);
  } catch (error) {
    console.error('Error generando reporte Excel:', error);
    res.status(500).json({ 
      message: 'Error generando reporte Excel', 
      error: error.message, 
      stack: error.stack 
    });
  }
}
}