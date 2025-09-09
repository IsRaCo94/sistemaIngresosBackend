import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IngresoRubrosDetalleController } from './ingreso-rubros-detalle.controller';
import { IngresoRubrosDetalleEntity } from './ingreso-rubros-detalle.entity';
import { IngresoRubrosDetalleService } from './ingreso-rubros-detalle.service';

@Module({
  imports: [TypeOrmModule.forFeature([IngresoRubrosDetalleEntity])],
  providers: [IngresoRubrosDetalleService],
  controllers: [IngresoRubrosDetalleController]
})
export class IngresoRubrosDetalleModule { }
