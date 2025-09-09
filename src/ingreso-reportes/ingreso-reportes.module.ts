import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IngresoReportesController } from './ingreso-reportes.controller';
import { IngresoReportesEntity } from './ingreso-reportes.entity';
import { IngresoReportesService } from './ingreso-reportes.service';

@Module({
  imports: [TypeOrmModule.forFeature([IngresoReportesEntity])],
  providers: [IngresoReportesService],
  controllers: [IngresoReportesController]
})
export class IngresoReportesModule { }
