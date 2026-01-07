import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IngresosGastoPagoDetalleController } from './ingresos-gasto-pago-det.controller';
import { IngresosGastoPagoDetEntity } from './ingresos-gasto-pago-det.entity';
import { IngresosGastoPagoDetService } from './ingresos-gasto-pago-det.service';
import { IngresosGastoPagoEntity } from '../ingresos-gasto-pago/ingresos-gasto-pago.entity';
@Module({
  imports: [TypeOrmModule.forFeature([IngresosGastoPagoDetEntity, IngresosGastoPagoEntity])],
  providers: [IngresosGastoPagoDetService],
  controllers: [IngresosGastoPagoDetalleController]
})
export class IngresosGastoPagoDetalleModule { }
