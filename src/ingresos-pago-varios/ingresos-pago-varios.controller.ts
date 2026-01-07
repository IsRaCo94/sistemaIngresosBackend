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

import { IngresosPagoVariosService } from './ingresos-pago-varios.service';
import { IngresosPagoVariosEntity } from './ingresos-pago-varios.entity';


@Controller('api/ingresos-pago-varios')
export class IngresosPagoVariosController {
 constructor( 
    private readonly variosService: IngresosPagoVariosService) { }

    @Post()
    async create(
      @Body() personaData: Partial<IngresosPagoVariosEntity>,
    ): Promise<IngresosPagoVariosEntity> {
      return this.variosService.create(personaData);
    }
 
    @Get('listar-varios')
    async findAll(): Promise<IngresosPagoVariosEntity[]>{
     return this.variosService.findAll();
    }
 
    @Get("/:id_varios")
    async findOne(
     @Param("id_varios") id_persona: string,
    ): Promise<IngresosPagoVariosEntity | null>{
     return this.variosService.findOne(parseInt(id_persona))
    }
 
     @Put("/:id_varios")
      async update(
        @Param("id_varios") id_persona: string,
        @Body() personaActualizada: Partial<IngresosPagoVariosEntity>,
      ): Promise<IngresosPagoVariosEntity | null> {
        return this.variosService.update(
          parseInt(id_persona, 10),
          personaActualizada,
        );
      }
       @Delete('/:id_varios') // Use DELETE HTTP method
     async borradologico(@Param('id_varios', ParseIntPipe) id_varios: number) {
     await this.variosService.borradologico(id_varios);
     //Optionally return a message, but NO_CONTENT is common for successful DELETE
      return { message: `Egreso con ID ${id_varios} ha sido marcado como eliminado.` };
   }

}
