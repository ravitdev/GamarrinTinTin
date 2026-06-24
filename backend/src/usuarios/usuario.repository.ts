import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Usuario, RolUsuario } from './domain/usuario.entity';
import type { PedidoClienteResumenDto } from './dto/perfil.dto';
import {
  SolicitudCambioDocumento,
  SolicitudDesactivacion,
  EstadoSolicitud,
} from './domain/solicitud.entity';
import { IUsuarioRepository } from './iusuario.repository';
import type { RegistroPendienteUsuarioData } from './iusuario.repository';
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
      data: {
        estado: 'INACTIVO',
        fechaEliminacion: new Date(),
      },
    });

    return resultado.count > 0;
  }

  async reactivar(idUsuario: number): Promise<boolean> {
    const actualizado = await this.prisma.usuario.update({
      where: { idUsuario },
      data: {
        estado: 'ACTIVO',
        fechaEliminacion: null,
      },
    });

    return actualizado.estado === 'ACTIVO';
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

  async guardarRegistroPendiente(
    registro: RegistroPendienteUsuarioData,
  ): Promise<RegistroPendienteUsuarioData> {
    const guardado = await this.prisma.registroPendienteUsuario.upsert({
      where: { email: registro.email },
      update: {
        nombres: registro.nombres,
        apellidos: registro.apellidos,
        contrasenaHash: registro.contrasenaHash,
        telefono: registro.telefono,
        tipoDocumento: registro.tipoDocumento,
        numeroDocumento: registro.numeroDocumento,
        direccion: registro.direccion,
        rol: registro.rol,
        codigoHash: registro.codigoHash,
        tokenAnulacionHash: registro.tokenAnulacionHash,
        estado: 'PENDIENTE',
        fechaExpiracion: registro.fechaExpiracion,
      },
      create: {
        nombres: registro.nombres,
        apellidos: registro.apellidos,
        email: registro.email,
        contrasenaHash: registro.contrasenaHash,
        telefono: registro.telefono,
        tipoDocumento: registro.tipoDocumento,
        numeroDocumento: registro.numeroDocumento,
        direccion: registro.direccion,
        rol: registro.rol,
        codigoHash: registro.codigoHash,
        tokenAnulacionHash: registro.tokenAnulacionHash,
        estado: 'PENDIENTE',
        fechaExpiracion: registro.fechaExpiracion,
      },
    });

    return this.aRegistroPendiente(guardado);
  }

  async buscarRegistroPendientePorEmail(
    email: string,
  ): Promise<RegistroPendienteUsuarioData | null> {
    const registro = await this.prisma.registroPendienteUsuario.findUnique({
      where: { email: email.trim().toLowerCase() },
    });

    return registro ? this.aRegistroPendiente(registro) : null;
  }

  async buscarRegistroPendientePorTokenAnulacion(
    tokenAnulacionHash: string,
  ): Promise<RegistroPendienteUsuarioData | null> {
    const registro = await this.prisma.registroPendienteUsuario.findUnique({
      where: { tokenAnulacionHash },
    });

    return registro ? this.aRegistroPendiente(registro) : null;
  }

  async actualizarCodigoRegistroPendiente(
    idRegistro: number,
    codigoHash: string,
    tokenAnulacionHash: string,
    fechaExpiracion: Date,
  ): Promise<RegistroPendienteUsuarioData> {
    const registro = await this.prisma.registroPendienteUsuario.update({
      where: { idRegistro },
      data: {
        codigoHash,
        tokenAnulacionHash,
        fechaExpiracion,
        estado: 'PENDIENTE',
      },
    });

    return this.aRegistroPendiente(registro);
  }

  async actualizarEstadoRegistroPendiente(
    idRegistro: number,
    estado: 'CONFIRMADO' | 'ANULADO' | 'EXPIRADO',
  ): Promise<boolean> {
    const resultado = await this.prisma.registroPendienteUsuario.updateMany({
      where: { idRegistro },
      data: { estado },
    });

    return resultado.count > 0;
  }

  async listarUsuarios(): Promise<Usuario[]> {
    const registros = await this.prisma.usuario.findMany();
    return registros.map((registro) => UsuarioDataMapper.aEntidad(registro));
  }

  async listarPorRol(rol: RolUsuario): Promise<Usuario[]> {
    const registros = await this.prisma.usuario.findMany({
      where: { rol },
      orderBy: { fechaRegistro: 'desc' },
    });
    return registros.map((registro) => UsuarioDataMapper.aEntidad(registro));
  }

  async contarPedidosEnProceso(idCliente: number): Promise<number> {
    return this.prisma.pedido.count({
      where: {
        idCliente,
        estado: {
          in: ['REGISTRADO', 'CONFIRMADO', 'PROCESANDO', 'ENVIADO'],
        },
      },
    });
  }

  async listarPedidosResumenPorCliente(
    idCliente: number,
  ): Promise<PedidoClienteResumenDto[]> {
    const registros = await this.prisma.pedido.findMany({
      where: { idCliente },
      include: { detalles: true },
      orderBy: { fechaCreacion: 'desc' },
    });

    return registros.map((pedido) => ({
      idPedido: pedido.idPedido,
      codigo: `PED-${pedido.idPedido.toString().padStart(6, '0')}`,
      fecha: pedido.fechaCreacion.toISOString(),
      estado: pedido.estado,
      total: pedido.total.toNumber(),
      items: pedido.detalles.reduce(
        (total, detalle) => total + detalle.cantidad,
        0,
      ),
      productos: pedido.detalles.map(
        (detalle) => detalle.nombreProductoSnapshot,
      ),
    }));
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

  async guardarTokenRecuperacion(
    idUsuario: number,
    tokenHash: string,
    fechaExpiracion: Date,
  ): Promise<boolean> {
    await this.prisma.$transaction([
      this.prisma.tokenRecuperacionContrasena.updateMany({
        where: {
          idUsuario,
          fechaUso: null,
        },
        data: {
          fechaUso: new Date(),
        },
      }),
      this.prisma.tokenRecuperacionContrasena.create({
        data: {
          idUsuario,
          tokenHash,
          fechaExpiracion,
        },
      }),
    ]);

    return true;
  }

  async obtenerTokenRecuperacion(tokenHash: string): Promise<{
    idToken: number;
    idUsuario: number;
    fechaExpiracion: Date;
  } | null> {
    const token = await this.prisma.tokenRecuperacionContrasena.findUnique({
      where: { tokenHash },
    });

    if (!token || token.fechaUso !== null) {
      return null;
    }

    return {
      idToken: token.idToken,
      idUsuario: token.idUsuario,
      fechaExpiracion: token.fechaExpiracion,
    };
  }

  async consumirTokenRecuperacion(
    idToken: number,
    idUsuario: number,
    contrasenaHash: string,
  ): Promise<boolean> {
    await this.prisma.$transaction(async (tx) => {
      const actualizado = await tx.tokenRecuperacionContrasena.updateMany({
        where: {
          idToken,
          idUsuario,
          fechaUso: null,
          fechaExpiracion: {
            gt: new Date(),
          },
        },
        data: {
          fechaUso: new Date(),
        },
      });

      if (actualizado.count === 0) {
        throw new Error(
          'El enlace de recuperación no es válido o ha expirado.',
        );
      }

      await tx.usuario.update({
        where: { idUsuario },
        data: { contrasenaHash },
      });

      await tx.refreshToken.updateMany({
        where: { idUsuario, revocado: false },
        data: { revocado: true },
      });
    });

    return true;
  }

  async crearSolicitudCambioDocumento(
    solicitud: SolicitudCambioDocumento,
  ): Promise<SolicitudCambioDocumento> {
    const registro = await this.prisma.solicitudCambioDocumento.create({
      data: {
        idUsuario: solicitud.idUsuario,
        tipoDocumento: solicitud.tipoDocumento,
        numeroDocumento: solicitud.numeroDocumento,
        estado: solicitud.estado,
        fechaSolicitud: solicitud.fechaSolicitud,
      },
    });

    return this.aSolicitudCambioDocumento(registro);
  }

  async buscarSolicitudCambioDocumentoPendiente(
    idUsuario: number,
  ): Promise<SolicitudCambioDocumento | null> {
    const registro = await this.prisma.solicitudCambioDocumento.findFirst({
      where: { idUsuario, estado: 'PENDIENTE' },
      orderBy: { fechaSolicitud: 'desc' },
    });

    return registro ? this.aSolicitudCambioDocumento(registro) : null;
  }

  async listarSolicitudesCambioDocumentoPendientes(): Promise<
    Array<SolicitudCambioDocumento & { usuario: Usuario }>
  > {
    const registros = await this.prisma.solicitudCambioDocumento.findMany({
      where: { estado: 'PENDIENTE' },
      include: { usuario: true },
      orderBy: { fechaSolicitud: 'asc' },
    });

    return registros.map((registro) => ({
      ...this.aSolicitudCambioDocumento(registro),
      usuario: UsuarioDataMapper.aEntidad(registro.usuario),
    }));
  }

  async resolverSolicitudCambioDocumento(
    idSolicitud: number,
    estado: 'APROBADA' | 'RECHAZADA',
    idAdmin: number,
  ): Promise<SolicitudCambioDocumento | null> {
    const registro = await this.prisma.solicitudCambioDocumento.update({
      where: { idSolicitud },
      data: {
        estado,
        fechaResolucion: new Date(),
        idAdminResolvio: idAdmin,
      },
    });

    return registro ? this.aSolicitudCambioDocumento(registro) : null;
  }

  async crearSolicitudDesactivacion(
    solicitud: SolicitudDesactivacion,
  ): Promise<SolicitudDesactivacion> {
    const registro = await this.prisma.solicitudDesactivacion.create({
      data: {
        idUsuario: solicitud.idUsuario,
        estado: solicitud.estado,
        fechaSolicitud: solicitud.fechaSolicitud,
      },
    });

    return this.aSolicitudDesactivacion(registro);
  }

  async buscarSolicitudDesactivacionPendiente(
    idUsuario: number,
  ): Promise<SolicitudDesactivacion | null> {
    const registro = await this.prisma.solicitudDesactivacion.findFirst({
      where: { idUsuario, estado: 'PENDIENTE' },
      orderBy: { fechaSolicitud: 'desc' },
    });

    return registro ? this.aSolicitudDesactivacion(registro) : null;
  }

  async listarSolicitudesDesactivacionPendientes(): Promise<
    Array<SolicitudDesactivacion & { usuario: Usuario }>
  > {
    const registros = await this.prisma.solicitudDesactivacion.findMany({
      where: { estado: 'PENDIENTE' },
      include: { usuario: true },
      orderBy: { fechaSolicitud: 'asc' },
    });

    return registros.map((registro) => ({
      ...this.aSolicitudDesactivacion(registro),
      usuario: UsuarioDataMapper.aEntidad(registro.usuario),
    }));
  }

  async resolverSolicitudDesactivacion(
    idSolicitud: number,
    estado: 'PROCESADA' | 'RECHAZADA',
    idAdmin: number,
  ): Promise<SolicitudDesactivacion | null> {
    const registro = await this.prisma.solicitudDesactivacion.update({
      where: { idSolicitud },
      data: {
        estado,
        fechaResolucion: new Date(),
        idAdminResolvio: idAdmin,
      },
    });

    return registro ? this.aSolicitudDesactivacion(registro) : null;
  }

  private aSolicitudCambioDocumento(registro: {
    idSolicitud: number;
    idUsuario: number;
    tipoDocumento: SolicitudCambioDocumento['tipoDocumento'];
    numeroDocumento: string;
    estado: EstadoSolicitud;
    fechaSolicitud: Date;
    fechaResolucion: Date | null;
    idAdminResolvio: number | null;
  }): SolicitudCambioDocumento {
    return new SolicitudCambioDocumento(
      registro.idSolicitud,
      registro.idUsuario,
      registro.tipoDocumento,
      registro.numeroDocumento,
      registro.estado,
      registro.fechaSolicitud,
      registro.fechaResolucion,
      registro.idAdminResolvio,
    );
  }

  private aRegistroPendiente(registro: {
    idRegistro: number;
    nombres: string;
    apellidos: string;
    email: string;
    contrasenaHash: string;
    telefono: string;
    tipoDocumento: RegistroPendienteUsuarioData['tipoDocumento'];
    numeroDocumento: string;
    direccion: string | null;
    rol: RolUsuario;
    codigoHash: string;
    tokenAnulacionHash: string;
    estado: RegistroPendienteUsuarioData['estado'];
    fechaExpiracion: Date;
  }): RegistroPendienteUsuarioData {
    return {
      idRegistro: registro.idRegistro,
      nombres: registro.nombres,
      apellidos: registro.apellidos,
      email: registro.email,
      contrasenaHash: registro.contrasenaHash,
      telefono: registro.telefono,
      tipoDocumento: registro.tipoDocumento,
      numeroDocumento: registro.numeroDocumento,
      direccion: registro.direccion,
      rol: registro.rol,
      codigoHash: registro.codigoHash,
      tokenAnulacionHash: registro.tokenAnulacionHash,
      estado: registro.estado,
      fechaExpiracion: registro.fechaExpiracion,
    };
  }

  private aSolicitudDesactivacion(registro: {
    idSolicitud: number;
    idUsuario: number;
    estado: EstadoSolicitud;
    fechaSolicitud: Date;
    fechaResolucion: Date | null;
    idAdminResolvio: number | null;
  }): SolicitudDesactivacion {
    return new SolicitudDesactivacion(
      registro.idSolicitud,
      registro.idUsuario,
      registro.estado,
      registro.fechaSolicitud,
      registro.fechaResolucion,
      registro.idAdminResolvio,
    );
  }
}
