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
  NotFoundException
} from '@nestjs/common';

import { IngresoRubrosDetalleService } from './ingreso-rubros-detalle.service';
import { IngresoRubrosDetalleEntity } from './ingreso-rubros-detalle.entity';



@Controller('api/ingreso-rubros-detalle')
export class IngresoRubrosDetalleController {

  constructor(private detalleRubroService: IngresoRubrosDetalleService) { }
@Post()
    async create(
      @Body() rubroData: Partial<IngresoRubrosDetalleEntity>,
    ): Promise<IngresoRubrosDetalleEntity> {
      return this.detalleRubroService.create(rubroData);
    }
 
    @Get('listar-rubros-detalle')
    async findAll(): Promise<IngresoRubrosDetalleEntity[]>{
     return this.detalleRubroService.findAll();
    }

    @Get("/:id_detalle_rubro")
    async findOne(
     @Param("id_detalle_rubro") id_detalle_rubro: string,
    ): Promise<IngresoRubrosDetalleEntity | null>{
     return this.detalleRubroService.findOne(parseInt(id_detalle_rubro))
    }
 
     @Put("/:id_detalle_rubro")
      async update(
        @Param("id_detalle_rubro") id_detalle_rubro: string,
        @Body() rubroActualizada: Partial<IngresoRubrosDetalleEntity>,
      ): Promise<IngresoRubrosDetalleEntity | null> {
        return this.detalleRubroService.update(
          parseInt(id_detalle_rubro, 10),
          rubroActualizada,
        );
      }
       @Delete('/:id_detalle_rubro') // Use DELETE HTTP method
     async borradologico(@Param('id_detalle_rubro', ParseIntPipe) id_detalle_rubro: number) {
     await this.detalleRubroService.borradologico(id_detalle_rubro);
     //Optionally return a message, but NO_CONTENT is common for successful DELETE
      return { message: `Egreso con ID ${id_detalle_rubro} ha sido marcado como eliminado.` };
   }
}
