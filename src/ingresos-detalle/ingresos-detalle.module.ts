import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IngresosDetalleController } from './ingresos-detalle.controller';
import { IngresosDetalleEntity } from './ingresos-detalle.entity';
import { IngresosDetalleService } from './ingresos-detalle.service';

@Module({
  imports: [TypeOrmModule.forFeature([IngresosDetalleEntity])],
  providers: [IngresosDetalleService],
  controllers: [IngresosDetalleController]
})
export class IngresosDetalleModule { }
