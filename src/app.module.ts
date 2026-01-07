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
import { EgresosReportesModule } from './egresos-reportes/egresos-reportes.module';
import { ConfigModule } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import { IngresosPagoPresupuestoModule } from './ingresos-pago-presupuesto-detalle/ingresos-pago-presupuesto.module';
import { IngresosPagoServiciosModule } from './ingresos-pago-servicios/ingresos-pago-servicios.module';
import { IngresosPagoServicioDetalleModule } from './ingresos-pago-servicio-detalle/ingresos-pago-servicio-detalle.module';
import { IngresosGastoPagoModule } from './ingresos-gasto-pago/ingresos-gasto-pago.module';
import {IngresosGastoPagoDetalleModule} from './ingresos-gasto-pago-detalle/ingresos-gasto-pago-det.module';
import { IngresoGastoReversionModule } from './ingreso-gasto-reversion/ingreso-gasto-reversion.module';
import { IngresosPagoVariosModule } from './ingresos-pago-varios/ingresos-pago-varios.module';
import { IngresoPagosReporteModule } from './ingreso-pagos-reporte/ingreso-pagos-reporte.module';
import { IngresosCategoriaProgrModule } from './ingresos-categoria-progr/ingresos-categoria-progr.module';
@Module({
  imports: [IngresosCategoriaProgrModule,
IngresoPagosReporteModule,
IngresosPagoVariosModule,
IngresoGastoReversionModule,
IngresosPagoServicioDetalleModule,
IngresosPagoServiciosModule,
IngresosPagoPresupuestoModule,
IngresosGastoPagoModule,
IngresoReportesModule,
EgresosReportesModule,
ConfigModule.forRoot({ isGlobal: true }),
IngresosDetalleModule,
IngresoRubrosDetalleModule,
IngresoRubrosModule,
IngresoGastoClasificadorModule,
IngresoGastoCertificacionModule,
IngresoGastoDetalleModule,
IngresosGastoPagoDetalleModule,



IngresoGastoModule,
IngresoTipoModule,
IngresoCuentaModule,
IngresoPersonaModule,
LibretaOrigenModule,
EgresosModule,
IngresosModule,

    IngresoEmpresaModule,

    MulterModule.register({
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB límite
      },
      fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
          cb(null, true);
        } else {
          cb(new Error('Solo se permiten archivos PDF'), false);
        }
      },
    }),

    // TypeOrmModule.forRoot({
    //   type: 'postgres',
    //   host: process.env.DB_HOST || 'postgres',//'postgres' para docker
    //   port: Number(process.env.DB_PORT) || 5432,
    //   username: process.env.DB_USERNAME || 'postgres',
    //   password: process.env.DB_PASSWORD || 'postgres',
    //   database: process.env.DB_DATABASE || 'CUSTOMPOA01',
    //   entities: [__dirname + '/**/*.entity{.ts,.js}'],
    //   synchronize: false,
    // }),
     TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || '10.0.10.224',//'postgres' para docker
      port: Number(process.env.DB_PORT) || 5432,
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'Postgresql123',
      database: process.env.DB_DATABASE || 'POA_DEV08',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: false,
    }),
],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
