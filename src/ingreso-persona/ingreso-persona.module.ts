import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IngresoPersonaController } from './ingreso-persona.controller';
import { IngresoPersonaEntity } from './ingreso-persona.entity';
import { IngresoPersonaService } from './ingreso-persona.service';

@Module({
  imports: [TypeOrmModule.forFeature([IngresoPersonaEntity])],
  providers: [IngresoPersonaService],
  controllers: [IngresoPersonaController]
})
export class IngresoPersonaModule { }
