import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EgresosController } from './egresos.controller';
import { EgresosEntity } from './egresos.entity';
import { EgresosService } from './egresos.service';

@Module({
  imports: [TypeOrmModule.forFeature([EgresosEntity])],
  providers: [EgresosService],
  controllers: [EgresosController]
})
export class EgresosModule { }
