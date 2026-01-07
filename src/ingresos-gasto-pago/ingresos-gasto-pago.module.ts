import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IngresosGastoPagoController } from './ingresos-gasto-pago.controller';
import { IngresosGastoPagoEntity } from './ingresos-gasto-pago.entity';
import { IngresosGastoPagoService } from './ingresos-gasto-pago.service';

@Module({
  imports: [TypeOrmModule.forFeature([IngresosGastoPagoEntity])],
  providers: [IngresosGastoPagoService],
  controllers: [IngresosGastoPagoController],
  exports: [TypeOrmModule],
})
export class IngresosGastoPagoModule { }
