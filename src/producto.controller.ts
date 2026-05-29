// src/producto.controller.ts
import { Controller, Get, Post, Put, Body, Param, Query, HttpException, HttpStatus } from '@nestjs/common';
import { ProductoManager } from './producto.manager';
import { Producto } from './domain/producto.entity';

@Controller('productos') // La ruta base será http://localhost:3000/productos
export class ProductosController {
  constructor(private readonly productoManager: ProductoManager) {}

  // CU 1: Registrar producto
  @Post()
  async registrar(
    @Body() body: { idProducto: number; nombre: string; descripcion: string; categoria: string; tallas: any[]; disenos: string[] }
  ) {
    try {
      const mensaje = await this.productoManager.registrarProducto(
        body.idProducto, body.nombre, body.descripcion, body.categoria, body.tallas, body.disenos
      );
      return { success: true, message: mensaje };
    } catch (error: any) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  // CU 4: Configurar descuento por volumen
  @Post(':id/descuentos')
  async agregarDescuento(
    @Param('id') id: string,
    @Body() body: { cantidadMinima: number; porcentaje: number }
  ) {
    try {
      const mensaje = await this.productoManager.configurarDescuento(+id, body.cantidadMinima, body.porcentaje);
      return { success: true, message: mensaje };
    } catch (error: any) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  // CU 5: Consultar catálogo (Soporta filtros por Query Params)
  // Ejemplo: http://localhost:3000/productos?categoria=Polos&talla=XL
  @Get()
  async consultar(
    @Query('categoria') categoria?: string,
    @Query('talla') talla?: string
  ) {
    try {
      const listado = await this.productoManager.consultarCatalogo(categoria, talla);
      return listado;
    } catch (error: any) {
      throw new HttpException(error.message, HttpStatus.NOT_FOUND);
    }
  }

  // CU 3: Desactivar / Activar producto (Eliminación lógica)
  @Put(':id/estado')
  async cambiarEstado(
    @Param('id') id: string,
    @Body() body: { estado: 'activo' | 'inactivo' }
  ) {
    try {
      const mensaje = await this.productoManager.cambiarEstadoProducto(+id, body.estado);
      return { success: true, message: mensaje };
    } catch (error: any) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }
}