import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EgresosReportesController } from './egresos-reportes.controller';
import { EgresosReportesEntity } from './egresos-reportes.entity';
import { EgresosReportesService } from './egresos-reportes.service';

@Module({
  imports: [TypeOrmModule.forFeature([EgresosReportesEntity])],
  providers: [EgresosReportesService],
  controllers: [EgresosReportesController]
})
export class EgresosReportesModule { }