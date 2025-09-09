
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IngresoGastoClasificadorEntity } from './ingreso-gasto-clasificador.entity';
import { Repository } from 'typeorm';

@Injectable()
export class IngresoGastoClasificadorService {

    constructor(@InjectRepository(IngresoGastoClasificadorEntity)
    private readonly clasificadorRepository: Repository<IngresoGastoClasificadorEntity>) { }

    async findAllUniqueByDesClasif(): Promise<IngresoGastoClasificadorEntity[]> {
        const all = await this.clasificadorRepository.find();
        const uniqueMap = new Map<string, IngresoGastoClasificadorEntity>();

        for (const item of all) {
            if (!uniqueMap.has(item.des_clasif)) {
                uniqueMap.set(item.des_clasif, item);
            }
        }

        return Array.from(uniqueMap.values());
    }

    async findOne(id_num_clasif: number): Promise<IngresoGastoClasificadorEntity | null> {
        // ¡Cambia el tipo de retorno aquí!
        return await this.clasificadorRepository.findOneBy({ id_num_clasif });
    }

}

