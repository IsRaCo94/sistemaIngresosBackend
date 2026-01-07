import { Controller,Get,Param } from '@nestjs/common';

import { IngresosCategoriaProgrService } from './ingresos-categoria-progr.service';
import { IngresosCategoriaProgrEntity } from './ingresos-categoria-progr.entity';


@Controller('api/ingresos-categoria-progr')
export class IngresosCategoriaProgrController {

  constructor(
    private readonly cateProgservice: IngresosCategoriaProgrService) { }

       @Get('listar-cat-prog')
        async findAll(): Promise<{cod_prog: string, denominacion: string}[]>{
         const categorias = await this.cateProgservice.findAll();
         return categorias.map(categoria => ({
            cod_prog: categoria.cod_prog,
            denominacion: categoria.denominacion
         }));
        }
     
        @Get("/:id_estp")
        async findOne(
         @Param("id_estp") id_estp: string,
        ): Promise<IngresosCategoriaProgrEntity | null>{
         return this.cateProgservice.findOne(parseInt(id_estp))
        }
    
}
