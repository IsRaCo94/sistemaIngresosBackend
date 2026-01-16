import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GastosObservacionesController } from './gastos-observaciones.controller';
import { GastosObservacionesEntity } from './gastos-observaciones.entity';
import { GastosObservacionesService } from './gastos-observaciones.service';
import { ObservEjecGastosEntity } from './observ-ejec-gastos.entity';
import { ObservEjecGastosService } from './observ-ejec-gastos.service';

@Module({
  imports: [TypeOrmModule.forFeature([GastosObservacionesEntity, ObservEjecGastosEntity])],
  providers: [GastosObservacionesService, ObservEjecGastosService],
  controllers: [GastosObservacionesController]
})
export class GastosObservacionesModule { }
