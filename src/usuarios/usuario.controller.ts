import {
  Body,
  Controller,
  HttpException,
  HttpStatus,
  Post,
} from '@nestjs/common';
import type { IniciarSesionDto } from './dto/iniciar-sesion.dto';
import { UsuarioManager } from './usuario.manager';

@Controller('usuarios')
export class UsuarioController {
  constructor(private readonly usuarioManager: UsuarioManager) {}

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
}
