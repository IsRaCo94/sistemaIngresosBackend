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

import { IngresoGastoReversionService } from './ingreso-gasto-reversion.service';
import { IngresoGastoReversionEntity } from './ingreso-gasto-reversion.entity';


@Controller('api/ingreso-gasto-reversion')
export class IngresoGastoReversionController {

  constructor(private readonly gastoReversionService: IngresoGastoReversionService) { }
  @Get()  
  obtenerAnioActual(): number {
    return this.gastoReversionService.obtenerAnioActual();
  }
@Post()
    async create(
      @Body() personaData: Partial<IngresoGastoReversionEntity>,
    ): Promise<IngresoGastoReversionEntity> {
      return this.gastoReversionService.create(personaData);
    }
 
    @Get('listar-reversion')
    async findAll(): Promise<IngresoGastoReversionEntity[]>{
     return this.gastoReversionService.findAll();
    }
 
    @Get("/:id_gasto_det_rev")
    async findOne(
     @Param("id_gasto_det_rev") id_gasto_det_rev: string,
    ): Promise<IngresoGastoReversionEntity | null>{
     return this.gastoReversionService.findOne(parseInt(id_gasto_det_rev))
    }
 
     @Put("/:id_gasto_det_rev")
      async update(
        @Param("id_gasto_det_rev") id_gasto_det_rev: string,
        @Body() personaActualizada: Partial<IngresoGastoReversionEntity>,
      ): Promise<IngresoGastoReversionEntity | null> {
        return this.gastoReversionService.update(
          parseInt(id_gasto_det_rev, 10),
          personaActualizada,
        );
      }
       @Delete('/:id_gasto_det_rev') // Use DELETE HTTP method
     async borradologico(@Param('id_gasto_det_rev', ParseIntPipe) id_gasto_det_rev: number) {
     await this.gastoReversionService.borradologico(id_gasto_det_rev);
     //Optionally return a message, but NO_CONTENT is common for successful DELETE
      return { message: `Egreso con ID ${id_gasto_det_rev} ha sido marcado como eliminado.` };
   }

     @Get('reporte/documento-presupuesto-reversion/:num_prev')
     async generarReportePresupuesto(
       @Param('num_prev') num_prev: string,
       @Res() res: Response
     ) {
       try {
         const pdfBuffer = await this.gastoReversionService.generarReportePresupuestoReversion(num_prev);
         
         res.set({
           'Content-Type': 'application/pdf',
           'Content-Disposition': `attachment; filename="reporte-presupuesto-reversion-${this.obtenerAnioActual()}-${num_prev || 'general'}-${new Date().getTime()}.pdf"`,
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
