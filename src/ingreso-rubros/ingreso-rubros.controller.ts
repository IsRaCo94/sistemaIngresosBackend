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

import { IngresoRubrosService } from './ingreso-rubros.service';
import { IngresoRubrosEntity } from './ingreso-rubros.entity';




@Controller('api/ingreso-rubros')
export class IngresoRubrosController {

  constructor(private ingresoRubroService: IngresoRubrosService) { }
@Post()
    async create(
      @Body() rubroData: Partial<IngresoRubrosEntity>,
    ): Promise<IngresoRubrosEntity> {
      return this.ingresoRubroService.create(rubroData);
    }
 
    @Get('listar-rubros')
    async findAll(): Promise<IngresoRubrosEntity[]>{
     return this.ingresoRubroService.findAll();
    }
 
    @Get("/:id_tipo_rubro")
    async findOne(
     @Param("id_tipo_rubro") id_tipo_rubro: string,
    ): Promise<IngresoRubrosEntity | null>{
     return this.ingresoRubroService.findOne(parseInt(id_tipo_rubro))
    }
 
     @Put("/:id_tipo_rubro")
      async update(
        @Param("id_tipo_rubro") id_tipo_rubro: string,
        @Body() rubroActualizada: Partial<IngresoRubrosEntity>,
      ): Promise<IngresoRubrosEntity | null> {
        return this.ingresoRubroService.update(
          parseInt(id_tipo_rubro, 10),
          rubroActualizada,
        );
      }
       @Delete('/:id_tipo_rubro') // Use DELETE HTTP method
     async borradologico(@Param('id_tipo_rubro', ParseIntPipe) id_tipo_rubro: number) {
     await this.ingresoRubroService.borradologico(id_tipo_rubro);
     //Optionally return a message, but NO_CONTENT is common for successful DELETE
      return { message: `Egreso con ID ${id_tipo_rubro} ha sido marcado como eliminado.` };
   }
  
}
