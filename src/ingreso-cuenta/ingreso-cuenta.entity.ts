import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('ingreso_cuenta_bancaria')
export class IngresoCuentaEntity {
    @PrimaryGeneratedColumn() id_cuenta: number;

    @Column()
    cuenta: string;

    @Column()
    banco: string;

    @Column()
    des_cuenta: string;
    @Column()
    baja: boolean;

}
