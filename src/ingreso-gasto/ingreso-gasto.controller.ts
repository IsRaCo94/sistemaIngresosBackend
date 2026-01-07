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
  Res,
  HttpStatus
} from '@nestjs/common';
import { Response } from 'express';

import { IngresoGastoService } from './ingreso-gasto.service';
import { IngresoGastoEntity } from './ingreso-gasto.entity';

@Controller('api/ingreso-gasto')
export class IngresoGastoController {

  constructor(
    private readonly ingresopagoservice: IngresoGastoService) { }
     @Get()
  obtenerAnioActual(): number {
    return this.ingresopagoservice.obtenerAnioActual();
  }
  @Post()
  async create(
    @Body() ingresopagoData: Partial<IngresoGastoEntity>,
  ): Promise<IngresoGastoEntity> {
    return this.ingresopagoservice.create(ingresopagoData);
  }

  @Get('listar-gastos')
  async findAll(): Promise<IngresoGastoEntity[]> {
    return this.ingresopagoservice.findAll();
  }

  @Get("/:id_gasto")
  async findOne(
    @Param("id_gasto") id_gasto: string,
  ): Promise<IngresoGastoEntity | null> {
    return this.ingresopagoservice.findOne(parseInt(id_gasto))
  }

  @Put("/:id_gasto")
  async update(
    @Param("id_gasto") id_gasto: string,
    @Body() ingresoActualizado: Partial<IngresoGastoEntity>,
  ): Promise<IngresoGastoEntity | null> {
    return this.ingresopagoservice.update(
      parseInt(id_gasto, 10),
      ingresoActualizado,
    );
  }
  @Delete('/:id_gasto') // Use DELETE HTTP method
  async borradologico(@Param('id_gasto', ParseIntPipe) id_gasto: number) {
    await this.ingresopagoservice.borradologico(id_gasto);
    //Optionally return a message, but NO_CONTENT is common for successful DELETE
    return { message: `Ingreso con ID ${id_gasto} ha sido marcado como eliminado.` };
  }

  @Get('reporte/documento-presupuesto/:num_prev')
  async generarReportePresupuesto(
    @Param('num_prev') num_prev: string,
    @Res() res: Response
  ) {
    try {
      const pdfBuffer = await this.ingresopagoservice.generarReportePresupuesto(num_prev);
      
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="reporte-presupuesto-${num_prev || 'general'}-${new Date().getTime()}.pdf"`,
        'Content-Length': pdfBuffer.length,
      });
      
      res.status(HttpStatus.OK).send(pdfBuffer);
    } catch (error) {
      console.error('Error generando reporte:', error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: 'Error al generar el reporte de presupuesto',
        error: error.message,
      });
    }
  }

 
}