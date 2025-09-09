import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IngresoGastoUnidadController } from './ingreso-gasto-unidad.controller';
import { IngresoGastoUnidadEntity } from './ingreso-gasto-unidad.entity';
import { IngresoGastoUnidadService } from './ingreso-gasto-unidad.service';

@Module({
  imports: [TypeOrmModule.forFeature([IngresoGastoUnidadEntity])],
  providers: [IngresoGastoUnidadService],
  controllers: [IngresoGastoUnidadController]
})
export class IngresoGastoUnidadModule { }
