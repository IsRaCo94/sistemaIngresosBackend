import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, Res, Query } from '@nestjs/common';
import { IngresosGastoPagoService } from './ingresos-gasto-pago.service';
import {IngresosGastoPagoEntity} from './ingresos-gasto-pago.entity';
import { Response } from 'express';


@Controller('api/ingresos-gasto-pago')
export class IngresosGastoPagoController {

  constructor(private readonly ingresopagoservice: IngresosGastoPagoService) { }
       @Get()
  obtenerAnioActual(): number {
    return this.ingresopagoservice.obtenerAnioActual();
  }
  @Post()
  async create(
    @Body() ingresopagoData: Partial<IngresosGastoPagoEntity>,
  ): Promise<IngresosGastoPagoEntity> {
    return this.ingresopagoservice.create(ingresopagoData);
  }

  @Get('listar-pagos')
  async findAll(): Promise<IngresosGastoPagoEntity[]> {
    return this.ingresopagoservice.findAll();
  }

  @Get("/:id_pago")
  async findOne(
    @Param("id_pago") id_pago: string,
  ): Promise<IngresosGastoPagoEntity | null> {
    return this.ingresopagoservice.findOne(parseInt(id_pago))
  }

  @Put("/:id_pago")
  async update(
    @Param("id_pago") id_pago: string,
    @Body() ingresoActualizado: Partial<IngresosGastoPagoEntity>,
  ): Promise<IngresosGastoPagoEntity | null> {
    return this.ingresopagoservice.update(
      parseInt(id_pago, 10),
      ingresoActualizado,
    );
  }
  @Delete('/:id_pago') // Use DELETE HTTP method
  async borradologico(@Param('id_pago', ParseIntPipe) id_pago: number) {
    await this.ingresopagoservice.borradologico(id_pago);
    //Optionally return a message, but NO_CONTENT is common for successful DELETE
    return { message: `Ingreso con ID ${id_pago} ha sido marcado como eliminado.` };
  }

  @Get('reporte/documento-pagos/:num_prev')
  async generarReporteDocumentoPagos(
    @Param('num_prev') num_prev: string,
    @Res() res: Response,
  ) {
    try {
      const pdfBuffer = await this.ingresopagoservice.generarReporteDocumentoPagos(num_prev);
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="documento-pagos-${num_prev || 'todos'}-${new Date().toISOString().split('T')[0]}.pdf"`,
      });
      res.send(pdfBuffer);
    } catch (error) {
      console.error('Error generando reporte de pagos:', error);
      res.status(500).json({ error: 'Error interno al generar el reporte' });
    }
  }

}
// import { Body, Controller, Get, Param, Post, Put, ParseIntPipe } from '@nestjs/common';
// import { IngresosGastoPagoService } from './ingresos-gasto-pago.service';
// import { IngresosGastoPagoEntity } from './ingresos-gasto-pago.entity';

// @Controller('api/ingresos-gasto-pago')
// export class IngresosGastoPagoController {

//   constructor(private ingresosGastoPagoService: IngresosGastoPagoService) { }

//   @Post()
//   async create(@Body() pagoData: Partial<IngresosGastoPagoEntity>): Promise<IngresosGastoPagoEntity> {
//     return this.ingresosGastoPagoService.create(pagoData);
//   }

//   @Get('listar-pagos')
//   async listarPagos() {
//     return this.ingresosGastoPagoService.findAll();
//   }
//   @Get("/:id_pago")
//   async findOne(@Param("id_pago", ParseIntPipe) id_pago: number): Promise<IngresosGastoPagoEntity | null> {
//     return this.ingresosGastoPagoService.findOne(id_pago);
//   }

//   @Put("/:id_pago")
//   async update(
//     @Param("id_pago", ParseIntPipe) id_pago: number,
//     @Body() pagoActualizado: Partial<IngresosGastoPagoEntity>,
//   ): Promise<IngresosGastoPagoEntity | null> {
//     return this.ingresosGastoPagoService.update(id_pago, pagoActualizado);
//   }
// }