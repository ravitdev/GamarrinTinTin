import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import type { RegistrarProductoDto } from './dto/registrar-producto.dto';
import type { ModificarProductoDto } from './dto/modificar-producto.dto';
import type { AdicionarStockDto } from './dto/adicionar-stock.dto';
import { ProductoManager } from './producto.manager';
import { Roles } from '../usuarios/seguridad/auth.decorators';
import { JwtAuthGuard } from '../usuarios/seguridad/jwt-auth.guard';
import { RolesGuard } from '../usuarios/seguridad/roles.guard';

@Controller('productos')
export class ProductoController {
  constructor(private readonly productoManager: ProductoManager) {}

  @Get()
  async consultarCatalogo() {
    const productos = await this.productoManager.consultarCatalogo();

    return {
      success: true,
      data: productos,
    };
  }

  @Get(':idProducto')
  async consultarDetalleProducto(@Param('idProducto') idProducto: string) {
    try {
      const producto = await this.productoManager.consultarDetalleProducto(
        Number(idProducto),
      );

      return {
        success: true,
        data: producto,
      };
    } catch (error: any) {
      throw new HttpException(error.message, HttpStatus.NOT_FOUND);
    }
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('VENDEDOR', 'ADMINISTRADOR')
  async registrarProducto(@Body() body: RegistrarProductoDto) {
    try {
      const producto = await this.productoManager.registrarProducto(body);

      return {
        success: true,
        // P9: Mensaje alineado con el documento de pruebas
        message: 'Producto registrado exitosamente.',
        data: producto,
      };
    } catch (error: any) {
      const estado =
        error.message === 'El nombre del producto ya se encuentra registrado en el catálogo.'
          ? HttpStatus.CONFLICT
          : HttpStatus.BAD_REQUEST;

      throw new HttpException(error.message, estado);
    }
  }

  @Put(':idProducto')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('VENDEDOR', 'ADMINISTRADOR')
  async modificarProducto(
    @Param('idProducto') idProducto: string,
    @Body() body: ModificarProductoDto,
  ) {
    try {
      const producto = await this.productoManager.modificarProducto(
        Number(idProducto),
        body,
      );

      return {
        success: true,
        // P15: Mensaje alineado con el documento de pruebas
        message: 'Producto actualizado exitosamente.',
        data: producto,
      };
    } catch (error: any) {
      const estado =
        error.message === 'Producto no encontrado.'
          ? HttpStatus.NOT_FOUND
          : error.message === 'El nombre del producto ya se encuentra registrado en el catálogo.'
          ? HttpStatus.CONFLICT
          : HttpStatus.BAD_REQUEST;

      throw new HttpException(error.message, estado);
    }
  }

  /**
   * P16: Adiciona stock de forma incremental a variantes existentes.
   * PATCH en lugar de PUT para indicar modificación parcial.
   */
  @Patch(':idProducto/stock')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('VENDEDOR', 'ADMINISTRADOR')
  async adicionarStock(
    @Param('idProducto') idProducto: string,
    @Body() body: AdicionarStockDto,
  ) {
    try {
      const producto = await this.productoManager.adicionarStockProducto(
        Number(idProducto),
        body,
      );

      return {
        success: true,
        message: 'Inventario actualizado exitosamente.',
        data: producto,
      };
    } catch (error: any) {
      const estado =
        error.message === 'Producto no encontrado.'
          ? HttpStatus.NOT_FOUND
          : HttpStatus.BAD_REQUEST;

      throw new HttpException(error.message, estado);
    }
  }

  /**
   * P19: Desactiva (eliminación lógica) un producto del catálogo.
   * Rechaza si el producto tiene pedidos activos (P21).
   */
  @Delete(':idProducto')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('VENDEDOR', 'ADMINISTRADOR')
  async desactivarProducto(@Param('idProducto') idProducto: string) {
    try {
      await this.productoManager.desactivarProducto(Number(idProducto));
      return {
        success: true,
        // P19: Mensaje alineado con el documento de pruebas
        message: 'El producto ha sido desactivado del catálogo exitosamente.',
      };
    } catch (error: any) {
      const estado =
        error.message === 'Producto no encontrado.'
          ? HttpStatus.NOT_FOUND
          : HttpStatus.BAD_REQUEST;

      throw new HttpException(error.message, estado);
    }
  }

  /**
   * P20: Reactiva un producto que estaba en estado inactivo.
   */
  @Patch(':idProducto/activar')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('VENDEDOR', 'ADMINISTRADOR')
  async activarProducto(@Param('idProducto') idProducto: string) {
    try {
      await this.productoManager.activarProducto(Number(idProducto));
      return {
        success: true,
        // P20: Mensaje alineado con el documento de pruebas
        message: 'El producto ha sido activado en el catálogo exitosamente.',
      };
    } catch (error: any) {
      const estado =
        error.message === 'Producto no encontrado o ya se encuentra activo.'
          ? HttpStatus.NOT_FOUND
          : HttpStatus.BAD_REQUEST;

      throw new HttpException(error.message, estado);
    }
  }
}