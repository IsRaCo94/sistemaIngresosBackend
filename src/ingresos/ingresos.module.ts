import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IngresosController } from './ingresos.controller';
import { IngresosEntity } from './ingresos.entity';
import { IngresosService } from './ingresos.service';
import { IngresoExternoService } from './ingreso-externo.service';
import { HttpModule } from '@nestjs/axios';


@Module({
  imports: [TypeOrmModule.forFeature([IngresosEntity]),HttpModule],
  providers: [IngresoExternoService,IngresosService],
  controllers: [IngresosController]
})
export class IngresosModule { }
