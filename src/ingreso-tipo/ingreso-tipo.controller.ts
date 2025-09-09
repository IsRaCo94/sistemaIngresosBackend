import { Controller,
  Get,
  Post,
  Body,
  Param, } from '@nestjs/common';

import { IngresoTipoService } from './ingreso-tipo.service';
import { IngresoTipoEntity } from './ingreso-tipo.entity';



@Controller('api/ingreso-tipo')
export class IngresoTipoController {

  constructor(
    private TipoIngresoService: IngresoTipoService) { }
    
    @Post()
    async create(
      @Body() unidadData: Partial<IngresoTipoEntity>,
    ): Promise<IngresoTipoEntity> {
      return this.TipoIngresoService.create(unidadData);
    }
    @Get()
      async findAll(): Promise<IngresoTipoEntity[]> {
        return this.TipoIngresoService.findAll();
      }
      @Get("/:id_tipo_ingr")
      async findOne(
        @Param("id_tipo_ingr") id_tipo_ingr: string,
      ): Promise<IngresoTipoEntity | null> {
        return this.TipoIngresoService.findOne(parseInt(id_tipo_ingr, 10));
      }

}
