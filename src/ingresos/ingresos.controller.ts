import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  Patch,
  ParseIntPipe,
  Query,
  NotFoundException,
  InternalServerErrorException,
  Res,
  UseInterceptors,
  UploadedFile
} from '@nestjs/common';
import { Response } from 'express';
import { IngresosService } from './ingresos.service';
import { IngresosEntity } from './ingresos.entity';
import { IngresosDto } from 'src/dtos/ingresos.dto';
import { ApiBody, ApiResponse } from '@nestjs/swagger';
import { Any } from 'typeorm';
import { FileInterceptor } from '@nestjs/platform-express';
import * as multer from 'multer';
import { IngresoExternoService } from './ingreso-externo.service';

@Controller('api/ingresos/')
export class IngresosController {
  constructor(
    private readonly ingresoService: IngresosService,
    private readonly ingresoExternoService: IngresoExternoService,
  ) { }
  // @Post()
  // // @ApiOperation({ summary: 'Crear un nuevo insumo' }) // Operation summary
  // @ApiBody({
  //   type: IngresosDto, // Use the DTO to define the expected request body for Swagger
  //   description: 'Autogenerico.',
  // })
  // @ApiResponse({ status: 201, description: 'Creado exitosamente.', type: IngresosDto }) // Success response
  // @ApiResponse({ status: 400, description: 'error' }) // Error response
  @Get('pagos-aportes/by-com-nro/:num_form')
  async getAportes(
    @Param("num_form") num_form: number,
  ): Promise<IngresosEntity | null> {
    return this.ingresoExternoService.getAportes(num_form);
  }
  @Post()
  async create(
    @Body() ingresoData: Partial<IngresosEntity>,
  ): Promise<IngresosEntity> {
    return this.ingresoService.create(ingresoData);
  }

  @Post('import-pdf')
  @UseInterceptors(FileInterceptor('file'))
  async extractPdfData(@UploadedFile() file: Express.Multer.File): Promise<Partial<IngresosEntity>> {
    if (!file) {
      throw new InternalServerErrorException('No se proporcionó archivo PDF');
    }
    
    if (file.mimetype !== 'application/pdf') {
      throw new InternalServerErrorException('El archivo debe ser un PDF');
    }

    return this.ingresoService.extractPdfData(file.buffer);
  }


  @Get('listar-ingresos')
  async findAll(): Promise<IngresosEntity[]> {
    return this.ingresoService.findAll();
  }
// ... existing code ...
@Get()
async getLastNumRecibo(): Promise<number> {
  try {
    const maxNum = await this.ingresoService.getMaxNumRecibo();
    return maxNum >= 1000 ? maxNum : 1000;
  } catch (error) {
    throw new InternalServerErrorException(error.message);
  }
}
// ... existing code ...

  @Get('maximonumFact')
  async getLastNumFactura(): Promise<number | null> {
    try {
      return await this.ingresoService.getMaxNumFactura();
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }
  @Get('reporte-informe-diario/:fecha/:lugar')
  async getReporteLugar(
    @Param('fecha') fecha : string,
    @Param('lugar') lugar: string,
   
  @Res() res: Response) {
    try {
      const reportBuffer = await this.ingresoService.generateReportLugar(fecha, lugar);
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="reporte_ingresosDiarios_${fecha}.pdf"`,
        'Content-Length': reportBuffer.length,
      });
      res.send(reportBuffer);
    } catch (error) {
      console.error('Report generation error:', error);
      res.status(500).json({ message: 'Error generating report', error: error.message, stack: error.stack });
    }
  }
  @Get('reporte-informe-diario/:fecha')
  async getReporte(
    @Param('fecha') fecha : string,
   
  @Res() res: Response) {
    try {
      const reportBuffer = await this.ingresoService.generateReport(fecha);
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="reporte_ingresosDiarios_${fecha}.pdf"`,
        'Content-Length': reportBuffer.length,
      });
      res.send(reportBuffer);
    } catch (error) {
      console.error('Report generation error:', error);
      res.status(500).json({ message: 'Error generating report', error: error.message, stack: error.stack });
    }
  }
  @Get('reporte-informe-diario-excel/:fecha/:lugar')
  async getReporteLugarExcel(
    @Param('fecha') fecha : string,
    @Param('lugar') lugar: string,
   
  @Res() res: Response) {
    try {
      const reportBuffer = await this.ingresoService.generateReportLugarExcel(fecha, lugar);
      res.set({
        'Content-Type': 'application/vnd.ms-excel',
        'Content-Disposition': `attachment; filename="reporte_ingresosDiarios_lugar_${fecha}.xlsx"`,
        'Content-Length': reportBuffer.length,
      });
      res.send(reportBuffer);
    } catch (error) {
      console.error('Report generation error:', error);
      res.status(500).json({ message: 'Error generating report', error: error.message, stack: error.stack });
    }
  }

  @Get('reporte-informe-diario-excel/:fecha')
  async getReporteExcel(
    @Param('fecha') fecha : string,
   
  @Res() res: Response) {
    try {
      const reportBuffer = await this.ingresoService.generateReportExcel(fecha);
      res.set({
        'Content-Type': 'application/vnd.ms-excel',
        'Content-Disposition': `attachment; filename="reporte_ingresosDiarios_${fecha}.xlsx"`,
        'Content-Length': reportBuffer.length,
      });
      res.send(reportBuffer);
    } catch (error) {
      console.error('Report generation error:', error);
      res.status(500).json({ message: 'Error generating report', error: error.message, stack: error.stack });
    }
  }
  @Get('reporte-recibo/:id_ingresos')
  async getReporteRecibo(
    @Param('id_ingresos') id_ingresos: number,
    @Res() res: Response) {
      try {
        const reportBuffer = await this.ingresoService.generateReporteRecibo(id_ingresos);
        res.set({
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="reporte_ingresosDiarios_${id_ingresos}.pdf"`,
          'Content-Length': reportBuffer.length,
        });
        res.send(reportBuffer);
      } catch (error) {
        console.error('Report generation error:', error);
        res.status(500).json({ message: 'Error generating report', error: error.message, stack: error.stack });
      }
    }


  
  @Get("/:id_ingresos")
  async findOne(
    @Param("id_ingresos") id_ingresos: number,
  ): Promise<IngresosEntity | null> {
    return this.ingresoService.findOne((id_ingresos))
  }

  @Put("/:id_ingresos")
  async update(
    @Param("id_ingresos", ParseIntPipe) id_ingresos: number,
    @Body() ingresoActualizado: Partial<IngresosEntity>,
  ): Promise<IngresosEntity | null> {
    return this.ingresoService.update(
      id_ingresos,
      ingresoActualizado,
    );
  }
  @Delete('/:id_ingresos') // Use DELETE HTTP method
  async borradologico(@Param('id_ingresos', ParseIntPipe) id_ingresos: number) {
    await this.ingresoService.borradologico(id_ingresos);
    //Optionally return a message, but NO_CONTENT is common for successful DELETE
    return { message: `Ingreso con ID ${id_ingresos} ha sido marcado como eliminado.` };
  }
  @Post('importar-excel')
  @UseInterceptors(FileInterceptor('file', {
    storage: multer.memoryStorage(),
  }))
  async importarExcel(
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.ingresoService.importarExcel(file);
  }


  // @Post('/auth/login')
  // async loginToExternalApi() {
  //   return this.ingresoExternoService.loginToExternalApi();
  // }
}