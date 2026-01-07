import { Body, Controller, Delete, Get, Param, Post, Put,  ParseIntPipe, } from '@nestjs/common';
import { IngresosPagoServicioDetalleService } from './ingresos-pago-servicio-detalle.service';
import { IngresosPagoServicioDetalleEntity } from './ingresos-pago-servicio-detalle.entity';


@Controller('api/ingresos-pago-servicio-detalle')
export class IngresosPagoServicioDetalleController {

  constructor(private ingresosGastoPagoService: IngresosPagoServicioDetalleService) { }
  @Post()
  async create(
    @Body() pagoData: Partial<IngresosPagoServicioDetalleEntity>,
  ): Promise<IngresosPagoServicioDetalleEntity> {
    return this.ingresosGastoPagoService.create(pagoData);
  }

  @Get('listar-pago-detalle')
  async findAll(): Promise<IngresosPagoServicioDetalleEntity[]>{
   return this.ingresosGastoPagoService.findAll();
  }

  @Get("/:id_pagos_serv_det")
  async findOne(
   @Param("id_pagos_serv_det") id_pagos_serv_det: string,
  ): Promise<IngresosPagoServicioDetalleEntity | null>{
   return this.ingresosGastoPagoService.findOne(parseInt(id_pagos_serv_det))
  }

   @Put("/:id_pagos_serv_det")
    async update(
      @Param("id_pagos_serv_det") id_pagos_serv_det: string,
      @Body() pagoActualizado: Partial<IngresosPagoServicioDetalleEntity>,
    ): Promise<IngresosPagoServicioDetalleEntity | null> {
      return this.ingresosGastoPagoService.update(
        parseInt(id_pagos_serv_det, 10),
        pagoActualizado,
      );
    }
    @Delete('/:id_pagos_serv_det') // Use DELETE HTTP method
    async borradologico(@Param('id_pagos_serv_det', ParseIntPipe) id_pagos_serv_det: number) {
    await this.ingresosGastoPagoService.borradologico(id_pagos_serv_det);
    //Optionally return a message, but NO_CONTENT is common for successful DELETE
     return { message: `Pago con ID ${id_pagos_serv_det} ha sido marcado como eliminado.` };
  }

}
