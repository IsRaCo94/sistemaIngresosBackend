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

import { GastosObservacionesService } from './gastos-observaciones.service';
import { GastosObservacionesEntity } from './gastos-observaciones.entity';
import { ObservEjecGastosService } from './observ-ejec-gastos.service';
import { ObservEjecGastosEntity } from './observ-ejec-gastos.entity';


@Controller('api/gastos-observaciones')
export class GastosObservacionesController {

  constructor(
    private readonly ObservacionService: GastosObservacionesService,
    private readonly ObservEjecGastosService: ObservEjecGastosService
  ) { }

  @Post()
  async create(
    @Body() observacionData: Partial<GastosObservacionesEntity>,
  ): Promise<GastosObservacionesEntity> {
    return this.ObservacionService.create(observacionData);
  }

  @Get('listar-observaciones')
  async findAll(): Promise<GastosObservacionesEntity[]> {
    return this.ObservacionService.findAll();
  }

  // Endpoints para observ_ejec_gastos (DEBEN IR ANTES de rutas genéricas con parámetros)
  @Get('/gasto/:id_gasto')
  async getObservacionesGasto(@Param('id_gasto', ParseIntPipe) id_gasto: number) {
    return this.ObservEjecGastosService.findByGasto(id_gasto);
  }

  @Post('/gasto/:id_gasto')
  async createObservacionesGasto(
    @Param('id_gasto', ParseIntPipe) id_gasto: number,
    @Body() observaciones: Array<{ id_observacion: number; observacion?: string; detalle: string; num_prev?: string }>
  ) {
    const observacionesGasto = observaciones.map(obs => ({
      id_gasto,
      id_observacion: obs.id_observacion,
      observacion: obs.observacion || '',
      detalle: obs.detalle,
      num_prev: obs.num_prev
    }));
    return this.ObservEjecGastosService.create(observacionesGasto);
  }

  @Delete('/gasto/:id_gasto/observacion/:id_observacion')
  async deleteObservacionGasto(
    @Param('id_gasto', ParseIntPipe) id_gasto: number,
    @Param('id_observacion', ParseIntPipe) id_observacion: number
  ) {
    await this.ObservEjecGastosService.deleteByGastoAndObservacion(id_gasto, id_observacion);
    return { message: 'Observación eliminada del gasto' };
  }

  @Delete('/gasto/:id_gasto/todas')
  async deleteTodasObservacionesGasto(@Param('id_gasto', ParseIntPipe) id_gasto: number) {
    await this.ObservEjecGastosService.deleteByGasto(id_gasto);
    return { message: 'Todas las observaciones del gasto han sido eliminadas' };
  }

  @Get("/:id_observaciones")
  async findOne(
    @Param("id_observaciones") id_observaciones: string,
  ): Promise<GastosObservacionesEntity | null> {
    return this.ObservacionService.findOne(parseInt(id_observaciones))
  }

  @Put("/:id_observaciones")
  async update(
    @Param("id_observaciones") id_observaciones: string,
    @Body() observacionActualizada: Partial<GastosObservacionesEntity>,
  ): Promise<GastosObservacionesEntity | null> {
    return this.ObservacionService.update(
      parseInt(id_observaciones, 10),
      observacionActualizada,
    );
  }
  @Delete('/:id_observaciones') // Use DELETE HTTP method
  async borradologico(@Param('id_observaciones', ParseIntPipe) id_observaciones: number) {
    await this.ObservacionService.borradologico(id_observaciones);
    //Optionally return a message, but NO_CONTENT is common for successful DELETE
    return { message: `Egreso con ID ${id_observaciones} ha sido marcado como eliminado.` };
  }
}
