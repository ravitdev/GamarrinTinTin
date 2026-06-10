import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Usuario } from './domain/usuario.entity';
import { IUsuarioRepository } from './iusuario.repository';
import { UsuarioDataMapper } from './usuario-data.mapper';

@Injectable()
export class UsuarioRepository implements IUsuarioRepository {
  constructor(private readonly prisma: PrismaService) {}

  async guardar(usuario: Usuario): Promise<Usuario> {
    const registro = await this.prisma.usuario.create({
      data: {
        nombres: usuario.nombres,
        apellidos: usuario.apellidos,
        email: usuario.email,
        contrasenaHash: usuario.contrasenaHash,
        telefono: usuario.telefono,
        fechaRegistro: usuario.fechaRegistro,
        tipoDocumento: usuario.tipoDocumento,
        numeroDocumento: usuario.numeroDocumento,
        direccion: usuario.direccion,
        rol: usuario.rol,
        estado: usuario.estado,
      },
    });

    return UsuarioDataMapper.aEntidad(registro);
  }

  async actualizar(usuario: Usuario): Promise<boolean> {
    const resultado = await this.prisma.usuario.updateMany({
      where: { idUsuario: usuario.idUsuario },
      data: {
        nombres: usuario.nombres,
        apellidos: usuario.apellidos,
        email: usuario.email,
        contrasenaHash: usuario.contrasenaHash,
        telefono: usuario.telefono,
        tipoDocumento: usuario.tipoDocumento,
        numeroDocumento: usuario.numeroDocumento,
        direccion: usuario.direccion,
        rol: usuario.rol,
        estado: usuario.estado,
      },
    });

    return resultado.count > 0;
  }

  async desactivar(idUsuario: number): Promise<boolean> {
    const resultado = await this.prisma.usuario.updateMany({
      where: { idUsuario },
      data: { estado: 'INACTIVO' },
    });

    return resultado.count > 0;
  }

  async buscarPorId(idUsuario: number): Promise<Usuario | null> {
    const registro = await this.prisma.usuario.findUnique({
      where: { idUsuario },
    });

    return registro ? UsuarioDataMapper.aEntidad(registro) : null;
  }

  async buscarPorEmail(email: string): Promise<Usuario | null> {
    const registro = await this.prisma.usuario.findUnique({
      where: { email: email.trim().toLowerCase() },
    });

    return registro ? UsuarioDataMapper.aEntidad(registro) : null;
  }

  async existePorEmail(email: string): Promise<boolean> {
    const total = await this.prisma.usuario.count({
      where: { email: email.trim().toLowerCase() },
    });

    return total > 0;
  }

  async existePorDocumento(numeroDocumento: string): Promise<boolean> {
    const total = await this.prisma.usuario.count({
      where: { numeroDocumento: numeroDocumento.trim() },
    });

    return total > 0;
  }

  async listarUsuarios(): Promise<Usuario[]> {
    const registros = await this.prisma.usuario.findMany();
    return registros.map((registro) => UsuarioDataMapper.aEntidad(registro));
  }

  async guardarRefreshToken(
    idUsuario: number,
    refreshTokenHash: string,
    fechaExpiracion: Date,
  ): Promise<boolean> {
    await this.prisma.$transaction([
      this.prisma.refreshToken.updateMany({
        where: { idUsuario, revocado: false },
        data: { revocado: true },
      }),
      this.prisma.refreshToken.create({
        data: {
          idUsuario,
          tokenHash: refreshTokenHash,
          fechaExpiracion,
        },
      }),
    ]);

    return true;
  }

  async obtenerRefreshToken(
    idUsuario: number,
  ): Promise<{ refreshTokenHash: string; fechaExpiracion: Date } | null> {
    const registro = await this.prisma.refreshToken.findFirst({
      where: {
        idUsuario,
        revocado: false,
      },
      orderBy: { fechaCreacion: 'desc' },
    });

    if (!registro) {
      return null;
    }

    return {
      refreshTokenHash: registro.tokenHash,
      fechaExpiracion: registro.fechaExpiracion,
    };
  }

  async revocarRefreshToken(idUsuario: number): Promise<boolean> {
    const resultado = await this.prisma.refreshToken.updateMany({
      where: { idUsuario, revocado: false },
      data: { revocado: true },
    });

    return resultado.count > 0;
  }
}
