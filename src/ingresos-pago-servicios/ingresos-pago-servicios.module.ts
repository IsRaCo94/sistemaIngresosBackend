import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IngresosPagoServiciosController } from './ingresos-pago-servicios.controller';
import { IngresosPagoServiciosEntity } from './ingresos-pago-servicios.entity';
import { IngresosPagoServiciosService } from './ingresos-pago-servicios.service';

@Module({
  imports: [TypeOrmModule.forFeature([IngresosPagoServiciosEntity])],
  providers: [IngresosPagoServiciosService],
  controllers: [IngresosPagoServiciosController]
})
export class IngresosPagoServiciosModule { }
