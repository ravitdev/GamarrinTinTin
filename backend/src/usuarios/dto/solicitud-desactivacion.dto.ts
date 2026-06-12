export interface SolicitudDesactivacionDto {
  idSolicitud: number;
  idUsuario: number;
  nombres: string;
  apellidos: string;
  email: string;
  rol: string;
  estado: string;
  fechaSolicitud: string;
  puedeDesactivarse: boolean;
  motivoNoDesactivacion?: string;
}
