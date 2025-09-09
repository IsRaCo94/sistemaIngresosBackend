import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('ingreso_empresa')
export class IngresoEmpresaEntity {

  @PrimaryGeneratedColumn()
  id_empresa: number;
  @Column({ type: 'varchar', length: 50, nullable: false }) // Define las propiedades de la columna 'codigo'
  codigo: string;
  @Column()
  nombre: string
  @Column()
  nit: number
  @Column({ type: 'boolean', default: false, nullable: false }) // <-- Asegúrate de que 'default: false' esté aquí
  baja: boolean; // 'true' = dado de baja, 'false' = activo

}
