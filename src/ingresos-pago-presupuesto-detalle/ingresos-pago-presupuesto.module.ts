import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IngresosPagoPresupuestoController } from './ingresos-pago-presupuesto.controller';
import { IngresosPagoPresupuestoEntity } from './ingresos-pago-presupuesto.entity';
import { IngresosPagoPresupuestoService } from './ingresos-pago-presupuesto.service';

@Module({
  imports: [TypeOrmModule.forFeature([IngresosPagoPresupuestoEntity])],
  providers: [IngresosPagoPresupuestoService],
  controllers: [IngresosPagoPresupuestoController]
})
export class IngresosPagoPresupuestoModule { }
