import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import type { CrearPedidoDto } from './dto/crear-pedido.dto';
import type { ProcesarPagoDto } from './dto/procesar-pago.dto';
import { PedidoManager } from './pedido.manager';
import { Roles, UsuarioActual } from '../usuarios/seguridad/auth.decorators';
import { JwtAuthGuard } from '../usuarios/seguridad/jwt-auth.guard';
import { RolesGuard } from '../usuarios/seguridad/roles.guard';
import type { UsuarioAutenticado } from '../usuarios/seguridad/usuario-autenticado.interface';

@Controller('pedidos')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('CLIENTE')
export class PedidoController {
  constructor(private readonly pedidoManager: PedidoManager) {}

  @Post()
  async crearPedido(
    @UsuarioActual() usuario: UsuarioAutenticado,
    @Body() body: CrearPedidoDto,
  ) {
    try {
      const pedido = await this.pedidoManager.crearPedido(
        usuario.idUsuario,
        body.items,
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
  async listarPorCliente(@UsuarioActual() usuario: UsuarioAutenticado) {
    return this.pedidoManager.listarPorCliente(usuario.idUsuario);
  }

  @Get('propios/:idPedido')
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
}
