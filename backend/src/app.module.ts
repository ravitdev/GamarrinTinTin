// src/app.module.ts
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PedidoModule } from './pedidos/pedido.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProductosModule } from './productos/producto.module';
import { UsuarioModule } from './usuarios/usuario.module';
import { CotizacionModule } from './cotizaciones/cotizacion.module';
import { NotificacionModule } from './notificaciones/notificacion.module';

@Module({
  imports: [
    PrismaModule,
    ProductosModule,
    UsuarioModule,
    PedidoModule,
    CotizacionModule,
    NotificacionModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
