
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IngresosDetalleEntity } from './ingresos-detalle.entity';

@Injectable()
export class IngresosDetalleService {

    constructor(@InjectRepository(IngresosDetalleEntity) repo) {
     
    }

}
