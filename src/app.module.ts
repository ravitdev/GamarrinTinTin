// src/app.module.ts
import { Module } from '@nestjs/common';
import { ProductosModule } from './productos/producto.module';
import { UsuarioModule } from './usuarios/usuario.module';

@Module({
  imports: [ProductosModule, UsuarioModule],
  controllers: [],
  providers: [],
})
export class AppModule {}