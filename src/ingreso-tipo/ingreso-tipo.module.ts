import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IngresoTipoController } from './ingreso-tipo.controller';
import { IngresoTipoEntity } from './ingreso-tipo.entity';
import { IngresoTipoService } from './ingreso-tipo.service';

@Module({
  imports: [TypeOrmModule.forFeature([IngresoTipoEntity])],
  providers: [IngresoTipoService],
  controllers: [IngresoTipoController]
})
export class IngresoTipoModule { }
