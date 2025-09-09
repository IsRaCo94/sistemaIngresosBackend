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

import { IngresoPersonaService } from './ingreso-persona.service';
import { IngresoPersonaEntity } from './ingreso-persona.entity';

@Controller('api/ingreso-persona')
export class IngresoPersonaController {

  constructor( 
    private readonly IngresoPersonaService: IngresoPersonaService) { }

    @Post()
    async create(
      @Body() personaData: Partial<IngresoPersonaEntity>,
    ): Promise<IngresoPersonaEntity> {
      return this.IngresoPersonaService.create(personaData);
    }
 
    @Get('listar-personas')
    async findAll(): Promise<IngresoPersonaEntity[]>{
     return this.IngresoPersonaService.findAll();
    }
 
    @Get("/:id_persona")
    async findOne(
     @Param("id_persona") id_persona: string,
    ): Promise<IngresoPersonaEntity | null>{
     return this.IngresoPersonaService.findOne(parseInt(id_persona))
    }
 
     @Put("/:id_persona")
      async update(
        @Param("id_persona") id_persona: string,
        @Body() personaActualizada: Partial<IngresoPersonaEntity>,
      ): Promise<IngresoPersonaEntity | null> {
        return this.IngresoPersonaService.update(
          parseInt(id_persona, 10),
          personaActualizada,
        );
      }
       @Delete('/:id_persona') // Use DELETE HTTP method
     async borradologico(@Param('id_libreta', ParseIntPipe) id_libreta: number) {
     await this.IngresoPersonaService.borradologico(id_libreta);
     //Optionally return a message, but NO_CONTENT is common for successful DELETE
      return { message: `Egreso con ID ${id_libreta} ha sido marcado como eliminado.` };
   }
  
}
