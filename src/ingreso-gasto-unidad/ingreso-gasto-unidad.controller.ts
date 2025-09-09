import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseIntPipe,
} from '@nestjs/common';

import { IngresoGastoUnidadService } from './ingreso-gasto-unidad.service';
import { IngresoGastoUnidadEntity } from './ingreso-gasto-unidad.entity';


@Controller('api/ingreso-gasto-unidad')
export class IngresoGastoUnidadController {

  constructor(
    private readonly IngresoGastoUnidadService: IngresoGastoUnidadService) { }

  @Post()
  async create(
    @Body() unidadData: Partial<IngresoGastoUnidadEntity>,
  ): Promise<IngresoGastoUnidadEntity> {
    return this.IngresoGastoUnidadService.create(unidadData);
  }
   @Get()
     async findAll(): Promise<IngresoGastoUnidadEntity[]> {
       return this.IngresoGastoUnidadService.findAll();
     }
@Get('/Unidad')
async getUnidadUno(): Promise<{ nombreUnidad: string }> {
  return this.IngresoGastoUnidadService.findOneUnidad();
}

  // @Get('name/:id') // Route: /products/name/:id
  // async findOneUnidad(
  //   @Param('id_unidad', ParseIntPipe) id_unidad: number
  // ): Promise<string | { message: string }> {
  //   const unidad = await this.IngresoGastoUnidadService.findOne(id_unidad);
  //   if (!unidad) {
  //     return { message: `El unidad con ID "${id_unidad}" no encontrada.` };
  //   }
  //   return unidad.nombreUnidad; // assuming 'unidad' is the string property you want to return
  // }
  @Get("/:id_unidad")
  async findOne(
    @Param("id_unidad") id_unidad: string,
  ): Promise<IngresoGastoUnidadEntity | null> {
    return this.IngresoGastoUnidadService.findOne(parseInt(id_unidad, 10));
  }

}
