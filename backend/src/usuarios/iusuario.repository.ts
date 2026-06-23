import { Usuario, RolUsuario } from './domain/usuario.entity';
import type { PedidoClienteResumenDto } from './dto/perfil.dto';
import {
  SolicitudCambioDocumento,
  SolicitudDesactivacion,
} from './domain/solicitud.entity';

export interface IUsuarioRepository {
  guardar(usuario: Usuario): Promise<Usuario>;
  actualizar(usuario: Usuario): Promise<boolean>;
  desactivar(idUsuario: number): Promise<boolean>;
  reactivar(idUsuario: number): Promise<boolean>;
  buscarPorId(idUsuario: number): Promise<Usuario | null>;
  buscarPorEmail(email: string): Promise<Usuario | null>;
  existePorEmail(email: string): Promise<boolean>;
  existePorDocumento(numeroDocumento: string): Promise<boolean>;
  listarUsuarios(): Promise<Usuario[]>;
  listarPorRol(rol: RolUsuario): Promise<Usuario[]>;
  contarPedidosEnProceso(idCliente: number): Promise<number>;
  listarPedidosResumenPorCliente(
    idCliente: number,
  ): Promise<PedidoClienteResumenDto[]>;
  guardarRefreshToken(
    idUsuario: number,
    refreshTokenHash: string,
    fechaExpiracion: Date,
  ): Promise<boolean>;
  obtenerRefreshToken(
    idUsuario: number,
  ): Promise<{ refreshTokenHash: string; fechaExpiracion: Date } | null>;
  revocarRefreshToken(idUsuario: number): Promise<boolean>;
  guardarTokenRecuperacion?(
    idUsuario: number,
    tokenHash: string,
    fechaExpiracion: Date,
  ): Promise<boolean>;
  obtenerTokenRecuperacion?(tokenHash: string): Promise<{
    idToken: number;
    idUsuario: number;
    fechaExpiracion: Date;
  } | null>;
  consumirTokenRecuperacion?(
    idToken: number,
    idUsuario: number,
    contrasenaHash: string,
  ): Promise<boolean>;
  crearSolicitudCambioDocumento(
    solicitud: SolicitudCambioDocumento,
  ): Promise<SolicitudCambioDocumento>;
  buscarSolicitudCambioDocumentoPendiente(
    idUsuario: number,
  ): Promise<SolicitudCambioDocumento | null>;
  listarSolicitudesCambioDocumentoPendientes(): Promise<
    Array<SolicitudCambioDocumento & { usuario: Usuario }>
  >;
  resolverSolicitudCambioDocumento(
    idSolicitud: number,
    estado: 'APROBADA' | 'RECHAZADA',
    idAdmin: number,
  ): Promise<SolicitudCambioDocumento | null>;
  crearSolicitudDesactivacion(
    solicitud: SolicitudDesactivacion,
  ): Promise<SolicitudDesactivacion>;
  buscarSolicitudDesactivacionPendiente(
    idUsuario: number,
  ): Promise<SolicitudDesactivacion | null>;
  listarSolicitudesDesactivacionPendientes(): Promise<
    Array<SolicitudDesactivacion & { usuario: Usuario }>
  >;
  resolverSolicitudDesactivacion(
    idSolicitud: number,
    estado: 'PROCESADA' | 'RECHAZADA',
    idAdmin: number,
  ): Promise<SolicitudDesactivacion | null>;
}
