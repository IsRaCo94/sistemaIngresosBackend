// import { Body, Controller, Delete, Get, Param, Post, Put,  ParseIntPipe, } from '@nestjs/common';
// import { IngresosGastoPagoDetService } from './ingresos-gasto-pago-det.service';
// import { IngresosGastoPagoDetEntity } from './ingresos-gasto-pago-det.entity';

// @Controller('api/ingresos-gasto-pago-detalle')
// export class IngresosGastoPagoDetalleController {

//   constructor(private ingresosGastoPagoService: IngresosGastoPagoDetService) { }

//   @Post()
//   async create(
//     @Body() pagoData: Partial<IngresosGastoPagoDetEntity>,
//   ): Promise<IngresosGastoPagoDetEntity> {
//     return this.ingresosGastoPagoService.create(pagoData);
//   }

//   @Get('listar-pago-detalle')
//   async findAll(): Promise<IngresosGastoPagoDetEntity[]>{
//    return this.ingresosGastoPagoService.findAll();
//   }

//   @Get("/:id_pago")
//   async findOne(
//    @Param("id_pago") id_pago: string,
//   ): Promise<IngresosGastoPagoDetEntity | null>{
//    return this.ingresosGastoPagoService.findOne(parseInt(id_pago))
//   }

//    @Put("/:id_pago")
//     async update(
//       @Param("id_pago") id_pago: string,
//       @Body() pagoActualizado: Partial<IngresosGastoPagoDetEntity>,
//     ): Promise<IngresosGastoPagoDetEntity | null> {
//       return this.ingresosGastoPagoService.update(
//         parseInt(id_pago, 10),
//         pagoActualizado,
//       );
//     }
//     @Delete('/:id_pago') // Use DELETE HTTP method
//     async borradologico(@Param('id_pago', ParseIntPipe) id_pago: number) {
//     await this.ingresosGastoPagoService.borradologico(id_pago);
//     //Optionally return a message, but NO_CONTENT is common for successful DELETE
//      return { message: `Pago con ID ${id_pago} ha sido marcado como eliminado.` };
//   }
//   @Get('estado-cuentas/:numPrev')
//   async getEstadoCuentasPorNumPrev(
//     @Param('numPrev') numPrev: string
//   ) {
//     return this.ingresosGastoPagoService.getEstadoCuentasPorNumPrev(numPrev);
//   }
// }
import { Body, Controller, Delete, Get, Param, Post, Put, ParseIntPipe, Res, InternalServerErrorException } from '@nestjs/common';
import { Response } from 'express';
import { IngresosGastoPagoDetService } from './ingresos-gasto-pago-det.service';
import { IngresosGastoPagoDetEntity } from './ingresos-gasto-pago-det.entity';

@Controller('api/ingresos-gasto-pago-detalle')
export class IngresosGastoPagoDetalleController {

  constructor(private ingresosGastoPagoService: IngresosGastoPagoDetService) { }

  @Post()
  async create(
    @Body() pagoData: Partial<IngresosGastoPagoDetEntity>,
  ): Promise<IngresosGastoPagoDetEntity> {
    return this.ingresosGastoPagoService.create(pagoData);
  }
  @Get()
  async getLastNumOrdenPago(): Promise<number> {
    try {
      const maxNum = await this.ingresosGastoPagoService.getMaxNumOrdenPago();
      return maxNum >= 1 ? maxNum : 1;
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }
  @Get('listar-pago-detalle')
  async findAll(): Promise<IngresosGastoPagoDetEntity[]>{
   return this.ingresosGastoPagoService.findAll();
  }

  @Get('dashboard-pagos-area')
  async getDashboardPagosPorArea() {
    return this.ingresosGastoPagoService.getDashboardPagosPorArea();
  }

  @Get("/:id_pago")
  async findOne(
   @Param("id_pago", ParseIntPipe) id_pago: number,
  ): Promise<IngresosGastoPagoDetEntity | null>{
   return this.ingresosGastoPagoService.findOne(id_pago)
  }

   @Put("/:id_pago")
    async update(
      @Param("id_pago", ParseIntPipe) id_pago: number,
      @Body() pagoActualizado: Partial<IngresosGastoPagoDetEntity>,
    ): Promise<IngresosGastoPagoDetEntity | null> {
      return this.ingresosGastoPagoService.update(
        id_pago,
        pagoActualizado,
      );
    }
    @Delete('/:id_pago') // Use DELETE HTTP method
    async borradologico(@Param('id_pago', ParseIntPipe) id_pago: number) {
    await this.ingresosGastoPagoService.borradologico(id_pago);
    //Optionally return a message, but NO_CONTENT is common for successful DELETE
     return { message: `Pago con ID ${id_pago} ha sido marcado como eliminado.` };
  }
  @Get('estado-cuentas/:numPrev')
  async getEstadoCuentasPorNumPrev(
    @Param('numPrev') numPrev: string
  ) {
    return this.ingresosGastoPagoService.getEstadoCuentasPorNumPrev(numPrev);
  }

  @Get('reporte-orden-pago/:numPrev/:factura/:orden_pago/:contrato/:contrato_modf')
  async generateOrdenPagoFactura(
    @Param('numPrev') numPrev: string,
    @Param('factura') factura: string,
    @Param('orden_pago', ParseIntPipe) orden_pago: number,
    @Param('contrato') contrato: string,
    @Param('contrato_modf') contrato_modf: string,
    @Res() res: Response
  ) {
    try {
      // Si la factura es "NO", fuerza el template especial pasando info al service
      const useRetenCeroTemplate = factura.trim().toUpperCase() === 'NO';
      const pdfBuffer = await this.ingresosGastoPagoService.generateOrdenPagoReport(
        numPrev,
        factura,
        orden_pago,
        contrato,
        contrato_modf,
        useRetenCeroTemplate // NUEVO PARÁMETRO para el service
      );
  
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="orden-pago-${orden_pago}.pdf"`,
        'Content-Length': pdfBuffer.length,
      });
  
      res.send(pdfBuffer);
    } catch (error) {
      res.status(500).json({
        message: 'Error al generar el reporte de órdenes de pago',
        error: error.message
      });
    }
  }
  @Get('reporte-orden-pago-sin-fact/:numPrev/:factura/:orden_pago')
  async generateOrdenPagoSinFactura(
    @Param('numPrev') numPrev: string,
    @Param('factura') factura: string,
    @Param('orden_pago', ParseIntPipe) orden_pago: number,
    @Res() res: Response
  ) {
    try {
      const pdfBuffer = await this.ingresosGastoPagoService.generateOrdenPagoSinFac(numPrev, factura, orden_pago);

      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="orden-pago-${orden_pago}.pdf"`,
        'Content-Length': pdfBuffer.length,
      });

      res.send(pdfBuffer);
    } catch (error) {
      res.status(500).json({
        message: 'Error al generar el reporte de órdenes de pago',
        error: error.message
      });
    }
  }
}