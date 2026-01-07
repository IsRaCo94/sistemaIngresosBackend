import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IngresosCategoriaProgrController } from './ingresos-categoria-progr.controller';
import { IngresosCategoriaProgrEntity } from './ingresos-categoria-progr.entity';
import { IngresosCategoriaProgrService } from './ingresos-categoria-progr.service';

@Module({
  imports: [TypeOrmModule.forFeature([IngresosCategoriaProgrEntity])],
  providers: [IngresosCategoriaProgrService],
  controllers: [IngresosCategoriaProgrController]
})
export class IngresosCategoriaProgrModule { }
