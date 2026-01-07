import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IngresosPagoVariosController } from './ingresos-pago-varios.controller';
import { IngresosPagoVariosEntity } from './ingresos-pago-varios.entity';
import { IngresosPagoVariosService } from './ingresos-pago-varios.service';

@Module({
  imports: [TypeOrmModule.forFeature([IngresosPagoVariosEntity])],
  providers: [IngresosPagoVariosService],
  controllers: [IngresosPagoVariosController]
})
export class IngresosPagoVariosModule { }
