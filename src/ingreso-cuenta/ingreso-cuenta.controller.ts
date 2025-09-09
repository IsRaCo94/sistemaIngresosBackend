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

import { IngresoCuentaService } from './ingreso-cuenta.service';
import { IngresoCuentaEntity } from './ingreso-cuenta.entity';



@Controller('api/ingreso-cuenta')
export class IngresoCuentaController {


  constructor( 
    private readonly IngresoCuentaService: IngresoCuentaService) { }

    @Post()
    async create(
      @Body() personaData: Partial<IngresoCuentaEntity>,
    ): Promise<IngresoCuentaEntity> {
      return this.IngresoCuentaService.create(personaData);
    }
 
    @Get('listar-cuentas')
    async findAll(): Promise<IngresoCuentaEntity[]>{
     return this.IngresoCuentaService.findAll();
    }
 
    @Get("/:id_cuenta")
    async findOne(
     @Param("id_cuenta") id_cuenta: string,
    ): Promise<IngresoCuentaEntity | null>{
     return this.IngresoCuentaService.findOne(parseInt(id_cuenta))
    }
 
     @Put("/:id_cuenta")
      async update(
        @Param("id_cuenta") id_cuenta: string,
        @Body() cuentaActualizada: Partial<IngresoCuentaEntity>,
      ): Promise<IngresoCuentaEntity | null> {
        return this.IngresoCuentaService.update(
          parseInt(id_cuenta, 10),
          cuentaActualizada,
        );
      }
       @Delete('/:id_cuenta') // Use DELETE HTTP method
     async borradologico(@Param('id_cuenta', ParseIntPipe) id_cuenta: number) {
     await this.IngresoCuentaService.borradologico(id_cuenta);
     //Optionally return a message, but NO_CONTENT is common for successful DELETE
      return { message: `Egreso con ID ${id_cuenta} ha sido marcado como eliminado.` };
   }
  
}
