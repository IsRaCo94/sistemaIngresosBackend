import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IngresoPagosReporteController } from './ingreso-pagos-reporte.controller';
import { IngresoPagosReporteEntity } from './ingreso-pagos-reporte.entity';
import { IngresoPagosReporteService } from './ingreso-pagos-reporte.service';

@Module({
  imports: [TypeOrmModule.forFeature([IngresoPagosReporteEntity])],
  providers: [IngresoPagosReporteService],
  controllers: [IngresoPagosReporteController]
})
export class IngresoPagosReporteModule { }
