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

import { EgresosService } from './egresos.service';
import { EgresosEntity } from './egresos.entity';

@Controller('api/egresos/')
export class EgresosController {
  constructor(
    private readonly egresoService: EgresosService) { }

   @Post()
   async create(
     @Body() egresoData: Partial<EgresosEntity>,
   ): Promise<EgresosEntity> {
     return this.egresoService.create(egresoData);
   }

   @Get('listar-egresos')
   async findAll(): Promise<EgresosEntity[]>{
    return this.egresoService.findAll();
   }

   @Get("/:id_egresos")
   async findOne(
    @Param("id_egresos") id_egresos: string,
   ): Promise<EgresosEntity | null>{
    return this.egresoService.findOne(parseInt(id_egresos))
   }

    @Put("/:id_egresos")
     async update(
       @Param("id_egresos") id_egresos: string,
       @Body() egresoActualizado: Partial<EgresosEntity>,
     ): Promise<EgresosEntity | null> {
       return this.egresoService.update(
         parseInt(id_egresos, 10),
         egresoActualizado,
       );
     }
      @Delete('/:id_egresos') // Use DELETE HTTP method
    async borradologico(@Param('id_egresos', ParseIntPipe) id_egresos: number) {
    await this.egresoService.borradologico(id_egresos);
    //Optionally return a message, but NO_CONTENT is common for successful DELETE
     return { message: `Egreso con ID ${id_egresos} ha sido marcado como eliminado.` };
  }
 
}