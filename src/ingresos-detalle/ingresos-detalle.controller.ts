import { Controller } from '@nestjs/common';

import { IngresosDetalleService } from './ingresos-detalle.service';
import { IngresosDetalleEntity } from './ingresos-detalle.entity';



@Controller('rest/ingresos-detalle')
export class IngresosDetalleController {

  constructor(private service: IngresosDetalleService) { }

}
