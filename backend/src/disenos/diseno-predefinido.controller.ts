import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import type { UploadedFile as StorageUploadedFile } from '../modules/storage/storage.service';
import { Roles, UsuarioActual } from '../usuarios/seguridad/auth.decorators';
import { JwtAuthGuard } from '../usuarios/seguridad/jwt-auth.guard';
import { RolesGuard } from '../usuarios/seguridad/roles.guard';
import { DisenoPredefinidoManager } from './diseno-predefinido.manager';

interface UsuarioAutenticado {
  idUsuario: number;
  email: string;
  rol: string;
}

@Controller('disenos-predefinidos')
export class DisenoPredefinidoController {
  constructor(
    private readonly disenoPredefinidoManager: DisenoPredefinidoManager,
  ) {}

  @Get()
  async listarActivos() {
    const disenos = await this.disenoPredefinidoManager.listarActivos();

    return {
      success: true,
      data: disenos,
    };
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('VENDEDOR', 'ADMINISTRADOR')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: {
        fileSize: 2 * 1024 * 1024,
      },
    }),
  )
  async registrar(
    @Body('nombre') nombre: string,
    @UploadedFile() file: StorageUploadedFile,
    @UsuarioActual() usuario: UsuarioAutenticado,
  ) {
    try {
      const diseno = await this.disenoPredefinidoManager.registrar({
        nombre,
        file,
        creadoPorId: usuario.idUsuario,
      });

      return {
        success: true,
        message: 'Imagen predefinida registrada exitosamente.',
        data: diseno,
      };
    } catch (error: any) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Delete(':idDisenoPredefinido')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('VENDEDOR', 'ADMINISTRADOR')
  async desactivar(
    @Param('idDisenoPredefinido') idDisenoPredefinido: string,
  ) {
    try {
      const diseno = await this.disenoPredefinidoManager.desactivar(
        Number(idDisenoPredefinido),
      );

      return {
        success: true,
        message: 'Diseño predefinido desactivado correctamente.',
        data: diseno,
      };
    } catch (error: any) {
      const status =
        error.message === 'Diseño predefinido no encontrado.'
          ? HttpStatus.NOT_FOUND
          : HttpStatus.BAD_REQUEST;

      throw new HttpException(error.message, status);
    }
  }
}