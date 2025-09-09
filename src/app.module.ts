import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { IngresoEmpresaModule } from './ingreso-empresa/ingreso-empresa.module';
import { TypeOrmModule } from "@nestjs/typeorm";
import { IngresosModule } from './ingresos/ingresos.module';
import { EgresosModule } from './egresos/egresos.module';
import { LibretaOrigenModule } from './libreta-origen/libreta-origen.module';
import { IngresoPersonaModule } from './ingreso-persona/ingreso-persona.module';
import { IngresoCuentaModule } from './ingreso-cuenta/ingreso-cuenta.module';
import { IngresoTipoModule } from './ingreso-tipo/ingreso-tipo.module';
import { IngresoGastoModule } from './ingreso-gasto/ingreso-gasto.module';

import { IngresoGastoDetalleModule } from './ingreso-gasto-detalle/ingreso-gasto-detalle.module';
import { IngresoGastoCertificacionModule } from './ingreso-gasto-certificacion/ingreso-gasto-certificacion.module';
import { IngresoGastoClasificadorModule } from './ingreso-gasto-clasificador/ingreso-gasto-clasificador.module';
import { IngresoRubrosModule } from './ingreso-rubros/ingreso-rubros.module';
import { IngresoRubrosDetalleModule } from './ingreso-rubros-detalle/ingreso-rubros-detalle.module';
import { IngresosDetalleModule } from './ingresos-detalle/ingresos-detalle.module';
import { IngresoReportesModule } from './ingreso-reportes/ingreso-reportes.module';
import { ConfigModule } from '@nestjs/config';


@Module({
  imports: [IngresoReportesModule,
ConfigModule.forRoot({ isGlobal: true }),
IngresosDetalleModule,
IngresoRubrosDetalleModule,
IngresoRubrosModule,
IngresoGastoClasificadorModule,
IngresoGastoCertificacionModule,
IngresoGastoDetalleModule,

IngresoGastoModule,
IngresoTipoModule,
IngresoCuentaModule,
IngresoPersonaModule,
LibretaOrigenModule,
EgresosModule,
IngresosModule,

    IngresoEmpresaModule,

      TypeOrmModule.forRoot({
      type: "postgres", // o 'mysql', 'mssql', etc.
      host: "localhost", // Cambia esto si tu base de datos está en otro lugar
      port: 5432, // Puerto por defecto de PostgreSQL
      username: "postgres", // Tu usuario de la base de datos
      password: "israco", // Tu contraseña de la base de datos
      database: "CUSTOMPOA01", // El nombre de tu base de datos
      entities: [__dirname + "/**/*.entity{.ts,.js}"],
      synchronize: false, // ¡Cuidado en producción! Esto sincroniza el esquema automáticamente
    }),
],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
