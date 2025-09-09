import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IngresoGastoDetalleController } from './ingreso-gasto-detalle.controller';
import { IngresoGastoDetalleEntity } from './ingreso-gasto-detalle.entity';
import { IngresoGastoDetalleService } from './ingreso-gasto-detalle.service';

@Module({
  imports: [TypeOrmModule.forFeature([IngresoGastoDetalleEntity])],
  providers: [IngresoGastoDetalleService],
  controllers: [IngresoGastoDetalleController]
})
export class IngresoGastoDetalleModule { }
