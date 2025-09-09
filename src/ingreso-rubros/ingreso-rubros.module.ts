import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IngresoRubrosController } from './ingreso-rubros.controller';
import { IngresoRubrosEntity } from './ingreso-rubros.entity';
import { IngresoRubrosService } from './ingreso-rubros.service';

@Module({
  imports: [TypeOrmModule.forFeature([IngresoRubrosEntity])],
  providers: [IngresoRubrosService],
  controllers: [IngresoRubrosController]
})
export class IngresoRubrosModule { }
