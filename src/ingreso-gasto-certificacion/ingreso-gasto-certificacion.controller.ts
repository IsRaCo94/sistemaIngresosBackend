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

  @Post()
  async create(@Body() certificacionData: Partial<IngresoGastoCertificacionEntity>): Promise<IngresoGastoCertificacionEntity> {
    return this.certificacionservice.create(certificacionData);
  }

  @Get('listar-certificaciones')
  async findAll(): Promise<IngresoGastoCertificacionEntity[]> {
    return this.certificacionservice.findAll();
  }

  @Get("/:id_certificacion")
  async findOne(
    @Param("id_certificacion") id_certificacion: string,
  ): Promise<IngresoGastoCertificacionEntity | null> {
      return this.certificacionservice.findOne(parseInt(id_certificacion, 10));
}

}

