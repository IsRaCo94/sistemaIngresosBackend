import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IngresoEmpresaEntity } from './ingreso-empresa.entity';
import { Repository } from "typeorm";
import { IngresosEmpresasDto } from 'src/dtos/ingresos-empresa.dto';
import * as XLSX from 'xlsx';

@Injectable()
export class IngresoEmpresaService {
    constructor(
        @InjectRepository(IngresoEmpresaEntity)
        private readonly ingresoRepository: Repository<IngresoEmpresaEntity>,
    ) { }
async create(
    ingresoData: Partial<IngresoEmpresaEntity>,
): Promise<IngresoEmpresaEntity> {
    // Primero crear el registro sin el código
    const nuevoIngreso = this.ingresoRepository.create(ingresoData);
    const ingresoGuardado = await this.ingresoRepository.save(nuevoIngreso);

    // Luego actualizar el campo código con el id_empresa generado
    ingresoGuardado.codigo = ingresoGuardado.id_empresa.toString();
    
    // Guardar la actualización
    return await this.ingresoRepository.save(ingresoGuardado);
}
    
    // async create(
    //     ingresoData: Partial<IngresoEmpresaEntity | IngresosEmpresasDto>, // Acepta el DTO o la entidad parcial
    // ): Promise<IngresoEmpresaEntity> {
    //     // Es crucial que 'ingresoData' contenga la propiedad 'codigo'
    //     const codigoAValidar = ingresoData.codigo;

    //     // 1. Verificar si el 'codigo' se proporcionó (si es un campo obligatorio)
    //     if (!codigoAValidar || typeof codigoAValidar !== 'string' || codigoAValidar.trim().length === 0) {
    //         throw new BadRequestException('El campo "codigo" es requerido y no puede estar vacío.');
    //     }

    //     // 2. Buscar si ya existe un registro con el mismo código
    //     const existingIngreso = await this.ingresoRepository.findOne({
    //         where: { codigo: codigoAValidar },
    //     });

    //     // 3. Si ya existe, lanzar una excepción de conflicto
    //     if (existingIngreso) {
    //         throw new ConflictException(`El código '${codigoAValidar}' ya existe. Por favor, ingrese un código diferente.`);
    //     }

    //     // 4. Si el código es único, proceder con la creación y el guardado
    //     const nuevoIngreso = this.ingresoRepository.create(ingresoData as Partial<IngresoEmpresaEntity>); // Asegura el tipo para 'create'
    //     return await this.ingresoRepository.save(nuevoIngreso);
    // }

    async findAll(): Promise<IngresoEmpresaEntity[]> {
        return await this.ingresoRepository.find();
    }
    async findOne(id_empresa: number): Promise<IngresoEmpresaEntity | null> {
        return await this.ingresoRepository.findOneBy({ id_empresa });
    }

    async update(
        id_empresa: number,
        ingresoActualizado: Partial<IngresoEmpresaEntity>,
    ): Promise<IngresoEmpresaEntity> {
        await this.ingresoRepository.update(id_empresa, ingresoActualizado);
        const ingresoActualizadoDesdeDb = await this.ingresoRepository.findOneBy({
            id_empresa,
        });
        if (!ingresoActualizadoDesdeDb) {
            throw new NotFoundException(
                `No se pudo encontrar el insumo con ID ${id_empresa} después de la actualización.`,
            );
        }
        return ingresoActualizadoDesdeDb;
    }

    async remove(id_empresa: number): Promise<void> {
        await this.ingresoRepository.delete(id_empresa);
    }

    async patch(
        id_empresa: number,
        _insumoParcial: Partial<IngresoEmpresaEntity>,
    ): Promise<IngresoEmpresaEntity | null> {
        const resultado = await this.ingresoRepository.findOne({
            where: { id_empresa },

        });
        if (!resultado) {
            throw new NotFoundException(`Insumo con ID ${id_empresa} no encontrado`);
        }
        return this.findOne(id_empresa);
    }



    async borradologico(id_empresa: number): Promise<{ deleted: boolean; message?: string }> {
        // 1. Buscar la entidad por su ID
        const ingresoToUpdate = await this.ingresoRepository.findOne({
            where: { id_empresa }, // Asumo que 'id' es el nombre de tu clave primaria
        });

        // 2. Si no se encuentra la entidad, lanzar un error
        if (!ingresoToUpdate) {
            throw new NotFoundException(`Ingreso con ID ${id_empresa} no encontrado.`);
        }

        // 3. Opcional: Verificar si ya estaba dado de baja
        if (ingresoToUpdate.baja === true) {
            return { deleted: false, message: `Ingreso con ID ${id_empresa} ya estaba dado de baja lógicamente.` };
        }

        // 4. Actualizar la columna 'baja' a true
        ingresoToUpdate.baja = true; // Marcar como lógicamente eliminado

        // 5. Guardar la entidad actualizada en la base de datos
        await this.ingresoRepository.save(ingresoToUpdate);

        return { deleted: true, message: `Ingreso con ID ${id_empresa} dado de baja lógicamente.` };
    }

  async importarExcel(file: Express.Multer.File): Promise<any> {
    if (!file) {
        throw new BadRequestException('No se subió ningún archivo.');
    }
    const workbook = XLSX.read(file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const datos: any[] = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

    // Puedes mapear y guardar cada registro en la base de datos
    let registrosImportados = 0;
    for (const row of datos) {
        if (Array.isArray(row)) {
            continue;
        }
        const nuevo = this.ingresoRepository.create(row);
        await this.ingresoRepository.save(nuevo);
        registrosImportados++;
    }
    return { message: 'Importación exitosa', registros: registrosImportados };
}
}
