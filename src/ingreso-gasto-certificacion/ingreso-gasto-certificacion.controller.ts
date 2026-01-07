import { Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  HttpCode,
  ParseIntPipe,
  HttpStatus,
  Delete, } from '@nestjs/common';

import { IngresoGastoCertificacionService } from './ingreso-gasto-certificacion.service';
import { IngresoGastoCertificacionEntity } from './ingreso-gasto-certificacion.entity';



@Controller('api/ingreso-gasto-certificacion')
export class IngresoGastoCertificacionController {

  constructor(private certificacionservice: IngresoGastoCertificacionService) { }

  @Get('listar-certificaciones')
  async findAll(): Promise<IngresoGastoCertificacionEntity[]> {
    return this.certificacionservice.findAll();
  }

  @Get("/:numeroCertificacion")
  async findOne(
    @Param("numeroCertificacion") numeroCertificacion: string,
  ): Promise<any> {
      return this.certificacionservice.findOne(numeroCertificacion);
}

}

