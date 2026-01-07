import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put } from '@nestjs/common';
import { IngresosPagoServiciosService } from './ingresos-pago-servicios.service';
import { IngresosPagoServiciosEntity } from './ingresos-pago-servicios.entity';


@Controller('api/ingresos-pago-servicios')
export class IngresosPagoServiciosController {

  constructor(private pagosServicioService: IngresosPagoServiciosService) { }
  @Post()
  async create(
    @Body() rubroData: Partial<IngresosPagoServiciosEntity>,
  ): Promise<IngresosPagoServiciosEntity> {
    return this.pagosServicioService.create(rubroData);
  }

  @Get('listar-servicios')
  async findAll(): Promise<IngresosPagoServiciosEntity[]>{
   return this.pagosServicioService.findAll();
  }

  @Get("/:id_servicio")
  async findOne(
   @Param("id_servicio") id_servicio: string,
  ): Promise<IngresosPagoServiciosEntity | null>{
   return this.pagosServicioService.findOne(parseInt(id_servicio))
  }

   @Put("/:id_servicio")
    async update(
      @Param("id_servicio") id_servicio: string,
      @Body() servicioActualizada: Partial<IngresosPagoServiciosEntity>,
    ): Promise<IngresosPagoServiciosEntity | null> {
      return this.pagosServicioService.update(
        parseInt(id_servicio, 10),
        servicioActualizada,
      );
    }
     @Delete('/:id_servicio') // Use DELETE HTTP method
   async borradologico(@Param('id_servicio', ParseIntPipe) id_servicio: number) {
   await this.pagosServicioService.borradologico(id_servicio);
   //Optionally return a message, but NO_CONTENT is common for successful DELETE
    return { message: `Servicio con ID ${id_servicio} ha sido marcado como eliminado.` };
 }
}
