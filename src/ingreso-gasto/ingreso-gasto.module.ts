import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IngresoGastoController } from './ingreso-gasto.controller';
import { IngresoGastoEntity } from './ingreso-gasto.entity';
import { IngresoGastoService } from './ingreso-gasto.service';


@Module({
  imports: [TypeOrmModule.forFeature([IngresoGastoEntity])],
  providers: [IngresoGastoService],
  controllers: [IngresoGastoController]
})
export class IngresoGastoModule { }
