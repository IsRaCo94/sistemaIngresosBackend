
import { ApiProperty } from '@nestjs/swagger';

export class IngresosEmpresasDto {

    @ApiProperty({
        description: 'The name or description of the institutional activity.',
        example: ''
    })
    codigo: string;

    @ApiProperty({
        description: 'The name or description of the institutional activity.',
        example: ''
    })
    nombre: string;

    @ApiProperty({
        description: 'The name or description of the institutional activity.',
        example: ''
    })
    direccion: string;

    @ApiProperty({
        description: 'The name or description of the institutional activity.',
        example: ''
    })
    telefono: string;

    @ApiProperty({
        description: 'The name or description of the institutional activity.',
        example: ''
    })
    tipo: string;

}
