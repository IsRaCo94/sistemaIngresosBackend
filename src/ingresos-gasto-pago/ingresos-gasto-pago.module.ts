import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IngresosGastoPagoController } from './ingresos-gasto-pago.controller';
import { IngresosGastoPagoEntity } from './ingresos-gasto-pago.entity';
import { IngresosGastoPagoService } from './ingresos-gasto-pago.service';
import { IngresosGastoPagoDetEntity } from '../ingresos-gasto-pago-detalle/ingresos-gasto-pago-det.entity';

@Module({
  imports: [TypeOrmModule.forFeature([IngresosGastoPagoEntity, IngresosGastoPagoDetEntity])],
  providers: [IngresosGastoPagoService],
  controllers: [IngresosGastoPagoController],
  exports: [TypeOrmModule],
})
export class IngresosGastoPagoModule { }
