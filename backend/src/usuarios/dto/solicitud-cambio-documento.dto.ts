import type { TipoDocumento } from '../domain/usuario.entity';

export interface SolicitarCambioDocumentoDto {
  tipoDocumento: TipoDocumento;
  numeroDocumento: string;
}

export interface SolicitudCambioDocumentoDto {
  idSolicitud: number;
  idUsuario: number;
  nombres: string;
  apellidos: string;
  email: string;
  rol: string;
  tipoDocumentoActual: TipoDocumento;
  numeroDocumentoActual: string;
  tipoDocumentoNuevo: TipoDocumento;
  numeroDocumentoNuevo: string;
  estado: string;
  fechaSolicitud: string;
}
