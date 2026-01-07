import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IngresoGastoReversionController } from './ingreso-gasto-reversion.controller';
import { IngresoGastoReversionEntity } from './ingreso-gasto-reversion.entity';
import { IngresoGastoReversionService } from './ingreso-gasto-reversion.service';

@Module({
  imports: [TypeOrmModule.forFeature([IngresoGastoReversionEntity])],
  providers: [IngresoGastoReversionService],
  controllers: [IngresoGastoReversionController]
})
export class IngresoGastoReversionModule { }
