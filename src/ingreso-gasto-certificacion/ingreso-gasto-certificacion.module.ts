import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IngresoGastoCertificacionController } from './ingreso-gasto-certificacion.controller';
import { IngresoGastoCertificacionEntity } from './ingreso-gasto-certificacion.entity';
import { IngresoGastoCertificacionService } from './ingreso-gasto-certificacion.service';

@Module({
  imports: [TypeOrmModule.forFeature([IngresoGastoCertificacionEntity])],
  providers: [IngresoGastoCertificacionService],
  controllers: [IngresoGastoCertificacionController]
})
export class IngresoGastoCertificacionModule { }
