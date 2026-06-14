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
  Query,
  UseGuards,
} from '@nestjs/common';
import type { CambiarEstadoProductoDto } from './dto/cambiar-estado-producto.dto';
import type { RegistrarProductoDto } from './dto/registrar-producto.dto';
import type { ModificarProductoDto } from './dto/modificar-producto.dto';
import type { ConsultarCatalogoProductosDto } from './dto/consultar-catalogo-productos.dto';
import { ProductoManager } from './producto.manager';
import { Roles } from '../usuarios/seguridad/auth.decorators';
import { JwtAuthGuard } from '../usuarios/seguridad/jwt-auth.guard';
import { RolesGuard } from '../usuarios/seguridad/roles.guard';

@Controller('productos')
export class ProductoController {
  constructor(private readonly productoManager: ProductoManager) {}

  @Get()
  @Get()
  async consultarCatalogo(@Query() filtros: ConsultarCatalogoProductosDto) {
    const productos = await this.productoManager.consultarCatalogo(filtros);

    return {
      success: true,
      data: productos,
    };
  }

  @Get('admin/todos')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('VENDEDOR', 'ADMINISTRADOR')
  async listarProductosParaAdministracion() {
    const productos =
      await this.productoManager.listarProductosParaAdministracion();

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
        message: 'Producto registrado correctamente.',
        data: producto,
      };
    } catch (error: any) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
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
        message: 'Producto modificado correctamente.',
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

  @Delete(':idProducto')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('VENDEDOR', 'ADMINISTRADOR')
  async desactivarProducto(@Param('idProducto') idProducto: string) {
  try {
    await this.productoManager.desactivarProducto(Number(idProducto));
    return {
      success: true,
      message: 'Producto desactivado correctamente.',
    };
  } catch (error: any) {
    const estado =
      error.message === 'Producto no encontrado.'
        ? HttpStatus.NOT_FOUND
        : HttpStatus.BAD_REQUEST;

    throw new HttpException(error.message, estado);
    }
  }

  @Patch(':idProducto/estado')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMINISTRADOR')
  async cambiarEstadoProducto(
    @Param('idProducto') idProducto: string,
    @Body() body: CambiarEstadoProductoDto,
  ) {
    try {
      const producto = await this.productoManager.cambiarEstadoProducto(
        Number(idProducto),
        body,
      );

      return {
        success: true,
        message: body.esActivo
          ? 'Producto activado correctamente.'
          : 'Producto desactivado correctamente.',
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
}