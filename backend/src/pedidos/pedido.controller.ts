import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import type { ActualizarEstadoPedidoDto } from './dto/actualizar-estado-pedido.dto';
import type { CrearPedidoDto } from './dto/crear-pedido.dto';
import type { ProcesarPagoDto } from './dto/procesar-pago.dto';
import type { EstadoPedido } from './domain/pedido.entity';
import { PedidoManager } from './pedido.manager';
import { Roles, UsuarioActual } from '../usuarios/seguridad/auth.decorators';
import { JwtAuthGuard } from '../usuarios/seguridad/jwt-auth.guard';
import { RolesGuard } from '../usuarios/seguridad/roles.guard';
import type { UsuarioAutenticado } from '../usuarios/seguridad/usuario-autenticado.interface';

@Controller('pedidos')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PedidoController {
  constructor(private readonly pedidoManager: PedidoManager) {}

  @Post()
  @Roles('CLIENTE')
  async crearPedido(
    @UsuarioActual() usuario: UsuarioAutenticado,
    @Body() body: CrearPedidoDto,
  ) {
    try {
      const pedido = await this.pedidoManager.crearPedido(
        usuario.idUsuario,
        body.items,
        body.tipoEntrega,
        body.direccionEnvio,
      );

      return {
        success: true,
        message: 'Pedido registrado correctamente.',
        data: pedido,
      };
    } catch (error: any) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Post(':idPedido/pago')
  @Roles('CLIENTE')
  async procesarPago(
    @UsuarioActual() usuario: UsuarioAutenticado,
    @Param('idPedido') idPedido: string,
    @Body() body: ProcesarPagoDto,
  ) {
    try {
      const pagoExitoso = await this.pedidoManager.procesarPagoPedidoPropio(
        usuario.idUsuario,
        Number(idPedido),
        body.tokenTarjeta,
      );

      return {
        success: pagoExitoso,
        message: pagoExitoso
          ? 'Pago procesado correctamente.'
          : 'El pago fue rechazado.',
      };
    } catch (error: any) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Get('propios')
  @Roles('CLIENTE')
  async listarPorCliente(@UsuarioActual() usuario: UsuarioAutenticado) {
    return this.pedidoManager.listarPorCliente(usuario.idUsuario);
  }

  @Get('propios/:idPedido')
  @Roles('CLIENTE')
  async consultarDetallePedidoPropio(
    @UsuarioActual() usuario: UsuarioAutenticado,
    @Param('idPedido') idPedido: string,
  ) {
    try {
      return await this.pedidoManager.consultarDetallePedidoPropio(
        usuario.idUsuario,
        Number(idPedido),
      );
    } catch (error: any) {
      throw new HttpException(error.message, HttpStatus.NOT_FOUND);
    }
  }

  @Get()
  @Roles('VENDEDOR', 'ADMINISTRADOR')
  async listarParaPersonal(@Query('estado') estado?: EstadoPedido) {
    try {
      const pedidos = await this.pedidoManager.listarParaPersonal(estado);

      return {
        success: true,
        data: pedidos,
      };
    } catch (error: any) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Get('gestion/todos')
  @Roles('VENDEDOR', 'ADMINISTRADOR')
  async listarTodosCompatibilidad() {
    return {
      success: true,
      data: await this.pedidoManager.listarParaPersonal(),
    };
  }

  @Patch('gestion/:idPedido/estado')
  @Roles('VENDEDOR', 'ADMINISTRADOR')
  async actualizarEstadoCompatibilidad(
    @Param('idPedido') idPedido: string,
    @Body() body: ActualizarEstadoPedidoDto,
  ) {
    return this.actualizarEstadoGestion(idPedido, body);
  }

  @Get(':idPedido')
  @Roles('VENDEDOR', 'ADMINISTRADOR')
  async consultarDetalleParaPersonal(@Param('idPedido') idPedido: string) {
    try {
      const pedido = await this.pedidoManager.consultarDetalleParaPersonal(
        Number(idPedido),
      );

      return {
        success: true,
        data: pedido,
      };
    } catch (error: any) {
      throw new HttpException(error.message, HttpStatus.NOT_FOUND);
    }
  }

  @Patch(':idPedido/estado')
  @Roles('VENDEDOR', 'ADMINISTRADOR')
  async actualizarEstadoParaPersonal(
    @Param('idPedido') idPedido: string,
    @Body() body: ActualizarEstadoPedidoDto,
  ) {
    return this.actualizarEstadoGestion(idPedido, body);
  }

  private async actualizarEstadoGestion(
    idPedido: string,
    body: ActualizarEstadoPedidoDto,
  ) {
    try {
      const pedido = await this.pedidoManager.actualizarEstadoParaPersonal(
        Number(idPedido),
        body.estado,
      );

      return {
        success: true,
        message: 'El estado del pedido fue actualizado correctamente.',
        data: pedido,
      };
    } catch (error: any) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }
}
