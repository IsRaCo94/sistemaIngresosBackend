import { Controller,
  Get,
  Post,
  Body,
  Param, } from '@nestjs/common';

import { IngresoGastoClasificadorService } from './ingreso-gasto-clasificador.service';
import { IngresoGastoClasificadorEntity } from './ingreso-gasto-clasificador.entity';


@Controller('api/ingreso-gasto-clasificador')
export class IngresoGastoClasificadorController {

  constructor(private clasificacionService: IngresoGastoClasificadorService) { }
@Get('listar-clasificaciones')
  async findAll(): Promise<IngresoGastoClasificadorEntity[]> {
    return this.clasificacionService.findAllUniqueByDesClasif();
  }

  @Get("/:id_clasif_partida")
  async findOne(
    @Param("id_clasif_partida") id_clasif_partida: string,
  ): Promise<IngresoGastoClasificadorEntity | null> {
      return this.clasificacionService.findOne(parseInt(id_clasif_partida, 10));
}
  
}
