// src/app.module.ts
import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PedidoModule } from './pedidos/pedido.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProductosModule } from './productos/producto.module';
import { UsuarioModule } from './usuarios/usuario.module';
import { DisenoPredefinidoModule } from './disenos/diseno-predefinido.module';
import { CotizacionModule } from './cotizaciones/cotizacion.module';
import { NotificacionesModule } from './notificaciones/notificaciones.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    PrismaModule,
    ProductosModule,
    UsuarioModule,
    PedidoModule,
    DisenoPredefinidoModule,
    CotizacionModule,
    NotificacionesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}