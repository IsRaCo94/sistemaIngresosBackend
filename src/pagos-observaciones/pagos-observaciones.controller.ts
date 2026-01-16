import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  ParseIntPipe
} from '@nestjs/common';

import { GastosObservacionesService } from '../gastos-observaciones/gastos-observaciones.service';
import { ObservPagosService } from './observ-pagos.service';

@Controller('api/pagos-observaciones')
export class PagosObservacionesController {

  constructor(
    private readonly observacionService: GastosObservacionesService,
    private readonly observPagosService: ObservPagosService
  ) { }

  // Obtener todas las observaciones disponibles (catálogo)
  @Get('listar-observaciones')
  async findAll() {
    return this.observacionService.findAll();
  }

  // Obtener observaciones de un pago específico
  @Get('/pago/:id_pago')
  async getObservacionesPago(@Param('id_pago', ParseIntPipe) id_pago: number) {
    return this.observPagosService.findByPago(id_pago);
  }

  // Guardar observaciones de un pago
  @Post('/pago/:id_pago')
  async createObservacionesPago(
    @Param('id_pago', ParseIntPipe) id_pago: number,
    @Body() observaciones: Array<{ id_observacion: number; observacion?: string; detalle: string; num_prev?: string }>
  ) {
    const observacionesPago = observaciones.map(obs => ({
      id_pago,
      id_observacion: obs.id_observacion,
      observacion: obs.observacion || '',
      detalle: obs.detalle,
      num_prev: obs.num_prev
    }));
    return this.observPagosService.create(observacionesPago);
  }

  // Eliminar una observación específica de un pago
  @Delete('/pago/:id_pago/observacion/:id_observacion')
  async deleteObservacionPago(
    @Param('id_pago', ParseIntPipe) id_pago: number,
    @Param('id_observacion', ParseIntPipe) id_observacion: number
  ) {
    await this.observPagosService.deleteByPagoAndObservacion(id_pago, id_observacion);
    return { message: 'Observación eliminada del pago' };
  }
}
