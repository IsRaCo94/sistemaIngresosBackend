import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PagosObservacionesController } from './pagos-observaciones.controller';
import { ObservPagosEntity } from './observ-pagos.entity';
import { ObservPagosService } from './observ-pagos.service';
import { GastosObservacionesModule } from '../gastos-observaciones/gastos-observaciones.module';
import { GastosObservacionesEntity } from '../gastos-observaciones/gastos-observaciones.entity';
import { GastosObservacionesService } from '../gastos-observaciones/gastos-observaciones.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([ObservPagosEntity, GastosObservacionesEntity])
  ],
  providers: [ObservPagosService, GastosObservacionesService],
  controllers: [PagosObservacionesController],
  exports: [ObservPagosService]
})
export class PagosObservacionesModule { }
