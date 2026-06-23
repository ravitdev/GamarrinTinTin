// src/app.module.ts
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PedidoModule } from './pedidos/pedido.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProductosModule } from './productos/producto.module';
import { UsuarioModule } from './usuarios/usuario.module';
import { DisenoPredefinidoModule } from './disenos/diseno-predefinido.module';

@Module({
  imports: [
    PrismaModule,
    ProductosModule,
    UsuarioModule,
    PedidoModule,
    DisenoPredefinidoModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}