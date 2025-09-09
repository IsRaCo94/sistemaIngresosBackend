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

import { LibretaOrigenService } from './libreta-origen.service';
import { LibretaOrigenEntity } from './libreta-origen.entity';
@Controller('api/libreta-origen/')
export class LibretaOrigenController {

 constructor(
     private readonly LibretaOrigenService: LibretaOrigenService) { }
 
    @Post()
    async create(
      @Body() libretaData: Partial<LibretaOrigenEntity>,
    ): Promise<LibretaOrigenEntity> {
      return this.LibretaOrigenService.create(libretaData);
    }
 
    @Get('listar-libretas')
    async findAll(): Promise<LibretaOrigenEntity[]>{
     return this.LibretaOrigenService.findAll();
    }
 
    @Get("/:id_libreta")
    async findOne(
     @Param("id_libreta") id_libreta: string,
    ): Promise<LibretaOrigenEntity | null>{
     return this.LibretaOrigenService.findOne(parseInt(id_libreta))
    }
 
     @Put("/:id_libreta")
      async update(
        @Param("id_libreta") id_libreta: string,
        @Body() libretaActualizada: Partial<LibretaOrigenEntity>,
      ): Promise<LibretaOrigenEntity | null> {
        return this.LibretaOrigenService.update(
          parseInt(id_libreta, 10),
          libretaActualizada,
        );
      }
       @Delete('/:id_libreta') // Use DELETE HTTP method
     async borradologico(@Param('id_libreta', ParseIntPipe) id_libreta: number) {
     await this.LibretaOrigenService.borradologico(id_libreta);
     //Optionally return a message, but NO_CONTENT is common for successful DELETE
      return { message: `Egreso con ID ${id_libreta} ha sido marcado como eliminado.` };
   }
  
}
