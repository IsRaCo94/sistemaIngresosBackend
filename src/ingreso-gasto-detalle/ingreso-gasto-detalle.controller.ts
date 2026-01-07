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

import { IngresoGastoDetalleService } from './ingreso-gasto-detalle.service';
import { IngresoGastoDetalleEntity } from './ingreso-gasto-detalle.entity';

@Controller('api/ingreso-gasto-detalle')
export class IngresoGastoDetalleController {

  constructor(private detalleGastoservice: IngresoGastoDetalleService) { }
 @Post()
  async create(
    @Body() detaGastoData: Partial<IngresoGastoDetalleEntity>,
  ): Promise<IngresoGastoDetalleEntity> {
    return this.detalleGastoservice.create(detaGastoData);
  }

  @Get('listar-gastos-detalle')
  async findAll(): Promise<IngresoGastoDetalleEntity[]> {
    return this.detalleGastoservice.findAll();
  }
    @Get('dashboard/ejecucion-por-partida')
  async getEjecucionPorPartida() {
    return await this.detalleGastoservice.getEjecucionPorPartida();
  }

  @Get("/:id_gasto_det")
  async findOne(
    @Param("id_gasto_det") id_gasto_det: string,
  ): Promise<IngresoGastoDetalleEntity | null> {
    return this.detalleGastoservice.findOne(parseInt(id_gasto_det))
  }

  @Get('by-gasto/:id_gasto')
  async findByGastoId(
    @Param("id_gasto") id_gasto: string,
  ): Promise<IngresoGastoDetalleEntity[]> {
    return this.detalleGastoservice.findByGastoId(parseInt(id_gasto));
  }
  
  @Put("/:id_gasto_det")
  async update(
    @Param("id_gasto_det") id_gasto_det: string,
    @Body() detalleActualizado: Partial<IngresoGastoDetalleEntity>,
  ): Promise<IngresoGastoDetalleEntity | null> {
    return this.detalleGastoservice.update(
      parseInt(id_gasto_det, 10),
      detalleActualizado,
    );
   
  }
  @Delete('/:id_gasto_det') // Use DELETE HTTP method
  async borradologico(@Param('id_gasto_det', ParseIntPipe) id_gasto_det: number) {
    await this.detalleGastoservice.borradologico(id_gasto_det);
    //Optionally return a message, but NO_CONTENT is common for successful DELETE
    return { message: `Ingreso con ID ${id_gasto_det} ha sido marcado como eliminado.` };
  }

  // Endpoints para Dashboard de Ejecución de Gastos
  @Get('dashboard/ejecucion-gastos')
  async getDashboardEjecucionGastos() {
    return await this.detalleGastoservice.getDashboardEjecucionGastos();
  }

  @Get('dashboard/resumen-general')
  async getResumenGeneral() {
    return await this.detalleGastoservice.getResumenGeneral();
  }





}
