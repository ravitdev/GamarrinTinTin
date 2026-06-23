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
import { CotizacionManager } from './cotizacion.manager';
import type { SolicitarCotizacionDto } from './dto/solicitar-cotizacion.dto';
import type { ResponderCotizacionDto } from './dto/responder-cotizacion.dto';

interface UsuarioAutenticado {
  idUsuario: number;
  email: string;
  rol: string;
}

@Controller('cotizaciones')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CotizacionController {
  constructor(private readonly cotizacionManager: CotizacionManager) {}

  @Post()
  @Roles('CLIENTE')
  async solicitar(
    @UsuarioActual() usuario: UsuarioAutenticado,
    @Body() body: SolicitarCotizacionDto,
  ) {
    try {
      const cotizacion = await this.cotizacionManager.solicitar(usuario, body);

      return {
        success: true,
        message:
          'Tu solicitud de cotización fue enviada correctamente y está pendiente de revisión por un vendedor.',
        data: cotizacion,
      };
    } catch (error: any) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Get('mis-cotizaciones')
  @Roles('CLIENTE')
  async listarMisCotizaciones(@UsuarioActual() usuario: UsuarioAutenticado) {
    const cotizaciones =
      await this.cotizacionManager.listarMisCotizaciones(usuario);

    return {
      success: true,
      data: cotizaciones,
    };
  }

  @Get()
  @Roles('VENDEDOR', 'ADMINISTRADOR')
  async listarTodas(@UsuarioActual() usuario: UsuarioAutenticado) {
    const cotizaciones = await this.cotizacionManager.listarTodas(usuario);

    return {
      success: true,
      data: cotizaciones,
    };
  }

  @Get(':idCotizacion')
  @Roles('CLIENTE', 'VENDEDOR', 'ADMINISTRADOR')
  async consultarDetalle(
    @UsuarioActual() usuario: UsuarioAutenticado,
    @Param('idCotizacion') idCotizacion: string,
  ) {
    try {
      const cotizacion = await this.cotizacionManager.consultarDetalle(
        usuario,
        Number(idCotizacion),
      );

      return {
        success: true,
        data: cotizacion,
      };
    } catch (error: any) {
      const status =
        error.message === 'Cotización no encontrada.'
          ? HttpStatus.NOT_FOUND
          : HttpStatus.BAD_REQUEST;

      throw new HttpException(error.message, status);
    }
  }

  @Patch(':idCotizacion/responder')
  @Roles('VENDEDOR', 'ADMINISTRADOR')
  async responder(
    @UsuarioActual() usuario: UsuarioAutenticado,
    @Param('idCotizacion') idCotizacion: string,
    @Body() body: ResponderCotizacionDto,
  ) {
    try {
      const cotizacion = await this.cotizacionManager.responder(
        usuario,
        Number(idCotizacion),
        body,
      );

      return {
        success: true,
        message: 'Cotización respondida correctamente.',
        data: cotizacion,
      };
    } catch (error: any) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }
}