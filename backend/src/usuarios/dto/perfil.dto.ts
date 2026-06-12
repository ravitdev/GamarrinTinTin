import type { EstadoUsuario, RolUsuario, TipoDocumento } from '../domain/usuario.entity';

export interface UsuarioPerfilDto {
  idUsuario: number;
  nombres: string;
  apellidos: string;
  email: string;
  telefono: string;
  tipoDocumento: TipoDocumento;
  numeroDocumento: string;
  direccion: string;
  rol: RolUsuario;
  estado: EstadoUsuario;
  fechaRegistro: string;
  solicitudCambioDocumentoPendiente: boolean;
  solicitudDesactivacionPendiente: boolean;
  puedeDesactivarse: boolean;
  motivoNoDesactivacion?: string;
}

export interface ActualizarPerfilDto {
  nombres?: string;
  apellidos?: string;
  email?: string;
  telefono?: string;
  direccion?: string;
  tipoDocumento?: TipoDocumento;
  numeroDocumento?: string;
}

export interface CambiarContrasenaDto {
  contrasenaActual: string;
  contrasenaNueva: string;
}
