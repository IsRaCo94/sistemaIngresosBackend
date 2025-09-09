import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IngresoGastoClasificadorController } from './ingreso-gasto-clasificador.controller';
import { IngresoGastoClasificadorEntity } from './ingreso-gasto-clasificador.entity';
import { IngresoGastoClasificadorService } from './ingreso-gasto-clasificador.service';

@Module({
  imports: [TypeOrmModule.forFeature([IngresoGastoClasificadorEntity])],
  providers: [IngresoGastoClasificadorService],
  controllers: [IngresoGastoClasificadorController]
})
export class IngresoGastoClasificadorModule { }
