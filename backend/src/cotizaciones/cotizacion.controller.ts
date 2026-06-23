import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Roles, UsuarioActual } from '../usuarios/seguridad/auth.decorators';
import { JwtAuthGuard } from '../usuarios/seguridad/jwt-auth.guard';
import { RolesGuard } from '../usuarios/seguridad/roles.guard';
import type { UsuarioAutenticado } from '../usuarios/seguridad/usuario-autenticado.interface';
import { CotizacionManager } from './cotizacion.manager';
import type { CrearCotizacionDto } from './dto/crear-cotizacion.dto';
import type { ResponderCotizacionDto } from './dto/responder-cotizacion.dto';

@Controller('cotizaciones')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CotizacionController {
  constructor(private readonly cotizacionManager: CotizacionManager) {}

  @Post()
  @Roles('CLIENTE')
  async crearSolicitud(
    @UsuarioActual() usuario: UsuarioAutenticado,
    @Body() body: CrearCotizacionDto,
  ) {
    return this.ejecutar(
      () => this.cotizacionManager.crearSolicitud(usuario.idUsuario, body),
      'Solicitud de cotización registrada correctamente.',
    );
  }

  @Get('propias')
  @Roles('CLIENTE')
  async listarPropias(@UsuarioActual() usuario: UsuarioAutenticado) {
    return {
      success: true,
      data: await this.cotizacionManager.listarPorCliente(usuario.idUsuario),
    };
  }

  @Get('mis-cotizaciones')
  @Roles('CLIENTE')
  async listarMisCotizaciones(@UsuarioActual() usuario: UsuarioAutenticado) {
    return this.listarPropias(usuario);
  }

  @Get('propias/:idCotizacion')
  @Roles('CLIENTE')
  async consultarPropia(
    @UsuarioActual() usuario: UsuarioAutenticado,
    @Param('idCotizacion') idCotizacion: string,
  ) {
    return this.ejecutar(() =>
      this.cotizacionManager.consultarPropia(
        usuario.idUsuario,
        Number(idCotizacion),
      ),
    );
  }

  @Post('propias/:idCotizacion/carrito')
  @Roles('CLIENTE')
  async agregarAlCarrito(
    @UsuarioActual() usuario: UsuarioAutenticado,
    @Param('idCotizacion') idCotizacion: string,
  ) {
    return this.ejecutar(
      () =>
        this.cotizacionManager.agregarCotizacionAlCarrito(
          usuario.idUsuario,
          Number(idCotizacion),
        ),
      'Cotización agregada al carrito correctamente.',
    );
  }

  @Get('solicitudes')
  @Roles('VENDEDOR', 'ADMINISTRADOR')
  async listarSolicitudes() {
    return {
      success: true,
      data: await this.cotizacionManager.listarSolicitudes(),
    };
  }

  @Get()
  @Roles('VENDEDOR', 'ADMINISTRADOR')
  async listarTodas() {
    return this.listarSolicitudes();
  }

  @Get('solicitudes/:idCotizacion')
  @Roles('VENDEDOR', 'ADMINISTRADOR')
  async consultarSolicitud(@Param('idCotizacion') idCotizacion: string) {
    return this.ejecutar(() =>
      this.cotizacionManager.consultarSolicitud(Number(idCotizacion)),
    );
  }

  @Get(':idCotizacion')
  @Roles('CLIENTE', 'VENDEDOR', 'ADMINISTRADOR')
  async consultarDetalle(
    @UsuarioActual() usuario: UsuarioAutenticado,
    @Param('idCotizacion') idCotizacion: string,
  ) {
    if (usuario.rol === 'CLIENTE') {
      return this.consultarPropia(usuario, idCotizacion);
    }

    return this.consultarSolicitud(idCotizacion);
  }

  @Patch(':idCotizacion/respuesta')
  @Roles('VENDEDOR', 'ADMINISTRADOR')
  async responder(
    @UsuarioActual() usuario: UsuarioAutenticado,
    @Param('idCotizacion') idCotizacion: string,
    @Body() body: ResponderCotizacionDto,
  ) {
    return this.ejecutar(
      () =>
        this.cotizacionManager.responderCotizacion(
          Number(idCotizacion),
          usuario.idUsuario,
          body,
        ),
      'Cotización respondida correctamente.',
    );
  }

  @Patch(':idCotizacion/responder')
  @Roles('VENDEDOR', 'ADMINISTRADOR')
  async responderCompatibilidad(
    @UsuarioActual() usuario: UsuarioAutenticado,
    @Param('idCotizacion') idCotizacion: string,
    @Body() body: ResponderCotizacionDto,
  ) {
    return this.responder(usuario, idCotizacion, body);
  }

  @Post('procesar-vencidas')
  @Roles('ADMINISTRADOR')
  async procesarVencidas() {
    const cantidad = await this.cotizacionManager.cancelarVencidas();
    return {
      success: true,
      message: `${cantidad} cotizaciones vencidas procesadas.`,
      data: { cantidad },
    };
  }

  private async ejecutar<T>(
    operacion: () => Promise<T>,
    message?: string,
  ): Promise<{ success: true; message?: string; data: T }> {
    try {
      return {
        success: true,
        ...(message ? { message } : {}),
        data: await operacion(),
      };
    } catch (error: unknown) {
      const mensaje =
        error instanceof Error
          ? error.message
          : 'No se pudo completar la operación.';
      const noEncontrado = mensaje === 'Cotización no encontrada.';
      throw new HttpException(
        mensaje,
        noEncontrado ? HttpStatus.NOT_FOUND : HttpStatus.BAD_REQUEST,
      );
    }
  }
}
