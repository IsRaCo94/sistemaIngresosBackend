import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IngresoEmpresaController } from './ingreso-empresa.controller';
import { IngresoEmpresaEntity } from './ingreso-empresa.entity';
import { IngresoEmpresaService } from './ingreso-empresa.service';
import { IngresoEmpresaExternoService } from './ingreso-empresa-externo.service';


@Module({
  imports: [TypeOrmModule.forFeature([IngresoEmpresaEntity]), HttpModule],
  providers: [IngresoEmpresaExternoService,
IngresoEmpresaService],
  controllers: [IngresoEmpresaController]
})
export class IngresoEmpresaModule { }
