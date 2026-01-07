import { Body, Controller, Get, Param, Post } from '@nestjs/common';

import { IngresosPagoPresupuestoService } from './ingresos-pago-presupuesto.service';
import { IngresosPagoPresupuestoEntity } from './ingresos-pago-presupuesto.entity';

@Controller('api/ingresos-pago-presupuesto')
export class IngresosPagoPresupuestoController {

  constructor(private PresupuestoService: IngresosPagoPresupuestoService) { }
  @Post()
  async create(
    @Body() id_gasto_det: Partial<IngresosPagoPresupuestoEntity>,
  ): Promise<IngresosPagoPresupuestoEntity> {
    return this.PresupuestoService.create(id_gasto_det);
  }
  @Get('listar-presupuesto')
  async findAll(): Promise<IngresosPagoPresupuestoEntity[]>{
   return this.PresupuestoService.findAll();
  }
  @Get('/:num_prev')
  async findOne(@Param('num_prev') num_prev: string): Promise<IngresosPagoPresupuestoEntity[]> {
    return this.PresupuestoService.findOne(num_prev);
  }
}
