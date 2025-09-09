import { ApiProperty } from '@nestjs/swagger';

export class IngresosDto {

    @ApiProperty({
        description: 'Ingrese datos',
        example: ''
    })
    num_depo: string;

    @ApiProperty({
        description: 'Ingrese datos',
        example: ''
    })
    lugar: string;

    @ApiProperty({
        description: 'Ingrese datos',
        example: ''
    })
    monto: string;

    @ApiProperty({
        description: 'Ingrese datos',
        example: ''
    })
    cod_prove: string;

    @ApiProperty({
        description: 'Ingrese datos',
        example: ''
    })
    prooveedor: string;
        @ApiProperty({
        description: 'Ingrese datos',
        example: ''
    })
    detalle: string;
        @ApiProperty({
        description: 'Ingrese datos',
        example: ''
    })
    estado: string;
        @ApiProperty({
        description: 'Ingrese datos',
        example: ''
    })
    tipo_ingres: string;
          @ApiProperty({
        description: 'Ingrese datos',
        example: ''
    })
    cerrado: string;
          @ApiProperty({
        description: 'Ingrese datos',
        example: ''
    })
    id_empresa_id: number;
          @ApiProperty({
        description: 'Ingrese datos',
        example: ''
    })
    baja: boolean;
          @ApiProperty({
        description: 'Ingrese datos',
        example: ''
    })
    fecha: Date;
     @ApiProperty({
        description: 'Ingrese datos',
        example: ''
    })
    fecha_reg:  Date;

    


}
