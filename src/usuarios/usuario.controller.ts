import {
  Body,
  Controller,
  HttpException,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import type { IniciarSesionDto } from './dto/iniciar-sesion.dto';
import type { RefreshTokenDto } from './dto/refresh-token.dto';
import type { RegistrarClienteDto } from './dto/registrar-cliente.dto';
import type { RegistrarVendedorDto } from './dto/registrar-vendedor.dto';
import { Roles, UsuarioActual } from './seguridad/auth.decorators';
import { JwtAuthGuard } from './seguridad/jwt-auth.guard';
import { RolesGuard } from './seguridad/roles.guard';
import type { UsuarioAutenticado } from './seguridad/usuario-autenticado.interface';
import { UsuarioManager } from './usuario.manager';
import { UsuarioMapper } from './usuario.mapper';

@Controller('usuarios')
export class UsuarioController {
  constructor(private readonly usuarioManager: UsuarioManager) {}

  @Post('clientes')
  async registrarCliente(@Body() body: RegistrarClienteDto) {
    try {
      const usuario = await this.usuarioManager.registrarCuentaCliente(body);
      return {
        success: true,
        message: 'Cuenta de cliente registrada correctamente.',
        data: UsuarioMapper.aSesionDto(usuario),
      };
    } catch (error: any) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Post('vendedores')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMINISTRADOR')
  async registrarVendedor(@Body() body: RegistrarVendedorDto) {
    try {
      const usuario = await this.usuarioManager.registrarUsuarioVendedor(body);
      return {
        success: true,
        message: 'Usuario vendedor registrado correctamente.',
        data: UsuarioMapper.aSesionDto(usuario),
      };
    } catch (error: any) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Post('login')
  async iniciarSesion(@Body() body: IniciarSesionDto) {
    try {
      const sesion = await this.usuarioManager.iniciarSesion(body);
      return {
        success: true,
        message: 'Sesión iniciada correctamente.',
        data: sesion,
      };
    } catch (error: any) {
      const mensaje = error.message ?? 'No fue posible iniciar sesión.';
      const estado =
        mensaje === 'La cuenta no está disponible.'
          ? HttpStatus.FORBIDDEN
          : HttpStatus.UNAUTHORIZED;

      throw new HttpException(mensaje, estado);
    }
  }

  @Post('refresh-token')
  async refrescarSesion(@Body() body: RefreshTokenDto) {
    try {
      const sesion = await this.usuarioManager.refrescarSesion(body);
      return {
        success: true,
        message: 'Sesion renovada correctamente.',
        data: sesion,
      };
    } catch (error: any) {
      throw new HttpException(error.message, HttpStatus.UNAUTHORIZED);
    }
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async cerrarSesion(@UsuarioActual() usuario: UsuarioAutenticado) {
    await this.usuarioManager.cerrarSesion(usuario.idUsuario);
    return {
      success: true,
      message: 'Sesion cerrada correctamente.',
    };
  }
}
