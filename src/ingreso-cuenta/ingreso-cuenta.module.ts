import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IngresoCuentaController } from './ingreso-cuenta.controller';
import { IngresoCuentaEntity } from './ingreso-cuenta.entity';
import { IngresoCuentaService } from './ingreso-cuenta.service';

@Module({
  imports: [TypeOrmModule.forFeature([IngresoCuentaEntity])],
  providers: [IngresoCuentaService],
  controllers: [IngresoCuentaController]
})
export class IngresoCuentaModule { }
