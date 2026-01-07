import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IngresosPagoServicioDetalleController } from './ingresos-pago-servicio-detalle.controller';
import { IngresosPagoServicioDetalleEntity } from './ingresos-pago-servicio-detalle.entity';
import { IngresosPagoServicioDetalleService } from './ingresos-pago-servicio-detalle.service';

@Module({
  imports: [TypeOrmModule.forFeature([IngresosPagoServicioDetalleEntity])],
  providers: [IngresosPagoServicioDetalleService],
  controllers: [IngresosPagoServicioDetalleController]
})
export class IngresosPagoServicioDetalleModule { }
