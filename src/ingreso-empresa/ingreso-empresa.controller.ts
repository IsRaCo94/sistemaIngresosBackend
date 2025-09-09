import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  Patch,
  ParseIntPipe,
  Query
} from '@nestjs/common';
import { IngresoEmpresaService } from './ingreso-empresa.service';
import { IngresoEmpresaEntity } from './ingreso-empresa.entity';
import { IngresosEmpresasDto } from 'src/dtos/ingresos-empresa.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam } from '@nestjs/swagger'; // Import Swagger decorators
import { UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import * as multer from 'multer';
import { IngresoEmpresaExternoService } from './ingreso-empresa-externo.service';

@Controller('api/ingreso-empresa')
export class IngresoEmpresaController {
  IngresoEmpresaService: any;
//  empresaExternoService: any;

  constructor(private readonly ingresoService: IngresoEmpresaService,
     private readonly empresaExternoService: IngresoEmpresaExternoService
  ) { }
  @Get('GetAllEmpresas')
GetAllEmpresas() {
  return this.empresaExternoService.getAllEmpresas();
}
  @Post()
  // @ApiOperation({ summary: 'Crear un nuevo insumo' }) // Operation summary
  @ApiBody({
    type: IngresosEmpresasDto, // Use the DTO to define the expected request body for Swagger
    description: 'Autogenerico.',
  })
  @ApiResponse({ status: 201, description: 'Creado exitosamente.', type: IngresosEmpresasDto }) // Success response
  @ApiResponse({ status: 400, description: 'error' }) // Error response

  @Post()
  async create(
    @Body() ingresoData: Partial<IngresosEmpresasDto>,
  ): Promise<IngresoEmpresaEntity> {
    return this.ingresoService.create(ingresoData);
  }
// @Get('empresas-externas')
//   async getAllEmpresas() {
//     try {
//       const result = await this.empresaExternoService.getAllEmpresas();
//       return {
//         success: result.status,
//         data: result.data,
//         message: result.message
//       };
//     } catch (error) {
//       return {
//         success: false,
//         message: 'Error al obtener las empresas: ' + error.message
//       };
//     }
//   }



  @Get('listar-empresas')
  async findAll(): Promise<IngresoEmpresaEntity[]> {
    return this.ingresoService.findAll();
  }

  @Get("/:id_empresa")
  async findOne(
    @Param("id_empresa") id_empresa: string,
  ): Promise<IngresoEmpresaEntity | null> {
    return this.ingresoService.findOne(parseInt(id_empresa, 10));
  }

  @Put("/:id_empresa")
  async update(
    @Param("id_empresa") id_empresa: string,
    @Body() empresaActualizado: Partial<IngresoEmpresaEntity>,
  ): Promise<IngresoEmpresaEntity | null> {
    return this.ingresoService.update(
      parseInt(id_empresa, 10),
      empresaActualizado,
    );
  }
  @Patch("/:id_empresa")
  patch(
    @Param("id_empresa", ParseIntPipe) id_empresa: number,
    @Body() updateingresoDto: Partial<IngresoEmpresaEntity>,
  ) {
    return this.ingresoService.patch(
      id_empresa,
      updateingresoDto,
    );
  }
  @Delete('/:id_empresa') // Use DELETE HTTP method
  async borradologico(@Param('id_empresa', ParseIntPipe) id_empresa: number) {
    await this.ingresoService.borradologico(id_empresa);
    //Optionally return a message, but NO_CONTENT is common for successful DELETE
    return { message: `Ingreso con ID ${id_empresa} ha sido marcado como eliminado.` };
  }

  @Post('importar-excel')
  @UseInterceptors(FileInterceptor('file', {
    storage: multer.memoryStorage(),
  }))
  async importarExcel(
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.ingresoService.importarExcel(file);
  }

  
}



