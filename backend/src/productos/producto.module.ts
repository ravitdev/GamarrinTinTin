import { Module } from '@nestjs/common';
import { UsuarioModule } from '../usuarios/usuario.module';
import { ProductoController } from './producto.controller';
import { ProductoManager } from './producto.manager';
import { ProductoRepository } from './producto.repository';

@Module({
  imports: [UsuarioModule],
  controllers: [ProductoController],
  providers: [ProductoManager, ProductoRepository],
  exports: [ProductoManager],
})
export class ProductosModule {}