import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import type { ActualizarPerfilDto, CambiarContrasenaDto } from './dto/perfil.dto';
import type { IniciarSesionDto } from './dto/iniciar-sesion.dto';
import type { RefreshTokenDto } from './dto/refresh-token.dto';
import type {
  RestablecerContrasenaDto,
  SolicitarRecuperacionContrasenaDto,
} from './dto/recuperar-contrasena.dto';
import type { RegistrarClienteDto } from './dto/registrar-cliente.dto';
import type { RegistrarVendedorDto } from './dto/registrar-vendedor.dto';
import type { SolicitarCambioDocumentoDto } from './dto/solicitud-cambio-documento.dto';
import type { RolUsuario } from './domain/usuario.entity';
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

  @Get('perfil')
  @UseGuards(JwtAuthGuard)
  async obtenerPerfil(@UsuarioActual() usuario: UsuarioAutenticado) {
    try {
      const perfil = await this.usuarioManager.obtenerPerfil(usuario.idUsuario);
      return {
        success: true,
        message: 'Perfil obtenido correctamente.',
        data: perfil,
      };
    } catch (error: any) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Patch('perfil')
  @UseGuards(JwtAuthGuard)
  async actualizarPerfilPropio(
    @UsuarioActual() usuario: UsuarioAutenticado,
    @Body() body: ActualizarPerfilDto,
  ) {
    try {
      const actualizado = await this.usuarioManager.actualizarPerfil(
        usuario.idUsuario,
        usuario.rol,
        usuario.idUsuario,
        body,
      );
      const perfil = await this.usuarioManager.obtenerPerfil(actualizado.idUsuario);
      return {
        success: true,
        message: 'Perfil actualizado correctamente.',
        data: perfil,
      };
    } catch (error: any) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Patch('perfil/contrasena')
  @UseGuards(JwtAuthGuard)
  async cambiarContrasenaPropio(
    @UsuarioActual() usuario: UsuarioAutenticado,
    @Body() body: CambiarContrasenaDto,
  ) {
    try {
      await this.usuarioManager.cambiarContrasena(usuario.idUsuario, body);
      return {
        success: true,
        message: 'Contraseña actualizada correctamente.',
      };
    } catch (error: any) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Post('perfil/solicitud-documento')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CLIENTE', 'VENDEDOR')
  async solicitarCambioDocumento(
    @UsuarioActual() usuario: UsuarioAutenticado,
    @Body() body: SolicitarCambioDocumentoDto,
  ) {
    try {
      const solicitud = await this.usuarioManager.solicitarCambioDocumento(
        usuario.idUsuario,
        body,
      );
      const mensaje =
        usuario.rol === 'VENDEDOR'
          ? 'Su solicitud de cambio de DNI será evaluada por un administrador.'
          : 'Su solicitud de cambio de RUC o DNI será evaluada por un administrador.';
      return {
        success: true,
        message: mensaje,
        data: solicitud,
      };
    } catch (error: any) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Post('perfil/solicitud-desactivacion')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CLIENTE')
  async solicitarDesactivacion(@UsuarioActual() usuario: UsuarioAutenticado) {
    try {
      const solicitud = await this.usuarioManager.solicitarDesactivacion(
        usuario.idUsuario,
      );
      return {
        success: true,
        message: 'Su cuenta será desactivada por un administrador.',
        data: solicitud,
      };
    } catch (error: any) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMINISTRADOR')
  async listarUsuarios(@Query('rol') rol?: RolUsuario) {
    try {
      const usuarios = rol
        ? await this.usuarioManager.listarUsuariosPorRol(rol)
        : await this.usuarioManager.listarUsuarios();
      const data = await Promise.all(
        usuarios.map((usuario) => this.usuarioManager.obtenerPerfil(usuario.idUsuario)),
      );
      return {
        success: true,
        message: 'Usuarios obtenidos correctamente.',
        data,
      };
    } catch (error: any) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Get('solicitudes-documento/pendientes')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMINISTRADOR')
  async listarSolicitudesDocumentoPendientes() {
    try {
      const solicitudes =
        await this.usuarioManager.listarSolicitudesCambioDocumentoPendientes();
      return {
        success: true,
        message: 'Solicitudes obtenidas correctamente.',
        data: solicitudes,
      };
    } catch (error: any) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Get('solicitudes-desactivacion/pendientes')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMINISTRADOR')
  async listarSolicitudesDesactivacionPendientes() {
    try {
      const solicitudes =
        await this.usuarioManager.listarSolicitudesDesactivacionPendientes();
      return {
        success: true,
        message: 'Solicitudes obtenidas correctamente.',
        data: solicitudes,
      };
    } catch (error: any) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMINISTRADOR')
  async obtenerUsuarioPorId(@Param('id', ParseIntPipe) id: number) {
    try {
      const perfil = await this.usuarioManager.obtenerPerfil(id);
      return {
        success: true,
        message: 'Usuario obtenido correctamente.',
        data: perfil,
      };
    } catch (error: any) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Get(':id/puede-desactivar')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMINISTRADOR')
  async validarPuedeDesactivar(@Param('id', ParseIntPipe) id: number) {
    try {
      const validacion = await this.usuarioManager.validarPuedeDesactivarse(id);
      return {
        success: true,
        message: 'Validación realizada correctamente.',
        data: validacion,
      };
    } catch (error: any) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMINISTRADOR')
  async actualizarUsuario(
    @UsuarioActual() admin: UsuarioAutenticado,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: ActualizarPerfilDto,
  ) {
    try {
      const actualizado = await this.usuarioManager.actualizarPerfil(
        admin.idUsuario,
        admin.rol,
        id,
        body,
      );
      const perfil = await this.usuarioManager.obtenerPerfil(actualizado.idUsuario);
      return {
        success: true,
        message: 'Usuario actualizado correctamente.',
        data: perfil,
      };
    } catch (error: any) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Patch('solicitudes-documento/:id/aprobar')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMINISTRADOR')
  async aprobarSolicitudDocumento(
    @UsuarioActual() admin: UsuarioAutenticado,
    @Param('id', ParseIntPipe) id: number,
  ) {
    try {
      const usuario = await this.usuarioManager.aprobarSolicitudCambioDocumento(
        id,
        admin.idUsuario,
      );
      const perfil = await this.usuarioManager.obtenerPerfil(usuario.idUsuario);
      return {
        success: true,
        message: 'Solicitud de cambio de documento aprobada correctamente.',
        data: perfil,
      };
    } catch (error: any) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Patch('solicitudes-documento/:id/rechazar')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMINISTRADOR')
  async rechazarSolicitudDocumento(
    @UsuarioActual() admin: UsuarioAutenticado,
    @Param('id', ParseIntPipe) id: number,
  ) {
    try {
      await this.usuarioManager.rechazarSolicitudCambioDocumento(
        id,
        admin.idUsuario,
      );

      return {
        success: true,
        message: 'Solicitud de cambio de documento rechazada correctamente.',
      };
    } catch (error: any) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Post(':id/desactivar')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMINISTRADOR')
  async desactivarUsuario(
    @UsuarioActual() admin: UsuarioAutenticado,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { idSolicitud?: number } = {},
  ) {
    try {
      await this.usuarioManager.procesarDesactivacionCuenta(
        id,
        admin.idUsuario,
        body.idSolicitud,
      );
      return {
        success: true,
        message: 'Cuenta desactivada correctamente.',
      };
    } catch (error: any) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Post(':id/reactivar')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMINISTRADOR')
  async reactivarUsuario(@Param('id', ParseIntPipe) id: number) {
    try {
      await this.usuarioManager.procesarReactivacionCuenta(id);
      return {
        success: true,
        message: 'Cuenta reactivada correctamente.',
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

  @Post('recuperar-contrasena')
  async solicitarRecuperacion(
    @Body() body: SolicitarRecuperacionContrasenaDto,
  ) {
    try {
      await this.usuarioManager.recuperarContrasena(body.email);
      return {
        success: true,
        message:
          'Si el correo está registrado, recibirá un enlace de recuperación.',
      };
    } catch (error: unknown) {
      const mensaje =
        error instanceof Error
          ? error.message
          : 'No fue posible procesar la solicitud.';
      throw new HttpException(mensaje, HttpStatus.BAD_REQUEST);
    }
  }

  @Post('restablecer-contrasena')
  async restablecerContrasena(@Body() body: RestablecerContrasenaDto) {
    try {
      await this.usuarioManager.restablecerContrasena(
        body.token,
        body.contrasenaNueva,
      );
      return {
        success: true,
        message: 'Contraseña restablecida correctamente.',
      };
    } catch (error: unknown) {
      const mensaje =
        error instanceof Error
          ? error.message
          : 'No fue posible restablecer la contraseña.';
      throw new HttpException(mensaje, HttpStatus.BAD_REQUEST);
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
