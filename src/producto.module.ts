// src/producto.module.ts
import { Module } from '@nestjs/common';
import { ProductosController } from './producto.controller';
import { ProductoManager } from './producto.manager';
import { ProductoRamRepository } from './producto-ram.repository';

@Module({
  controllers: [ProductosController],
  providers: [
    // Registramos el repositorio en RAM
    {
      provide: 'IProductoRepository', // Usamos un token de texto para la interfaz
      useClass: ProductoRamRepository,
    },
    // Registramos el Manager e inyectamos el repositorio usando el token anterior
    {
      provide: ProductoManager,
      useFactory: (repo: ProductoRamRepository) => new ProductoManager(repo),
      inject: ['IProductoRepository'],
    },
  ],
})
export class ProductosModule {}