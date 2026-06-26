import type { TipoDocumento } from './usuario.entity';

export type EstadoSolicitud = 'PENDIENTE' | 'APROBADA' | 'RECHAZADA' | 'PROCESADA';

export class SolicitudCambioDocumento {
  constructor(
    public idSolicitud: number,
    public idUsuario: number,
    public tipoDocumento: TipoDocumento,
    public numeroDocumento: string,
    public estado: EstadoSolicitud,
    public fechaSolicitud: Date,
    public fechaResolucion: Date | null = null,
    public idAdminResolvio: number | null = null,
  ) {}
}

export class SolicitudDesactivacion {
  constructor(
    public idSolicitud: number,
    public idUsuario: number,
    public estado: EstadoSolicitud,
    public fechaSolicitud: Date,
    public fechaResolucion: Date | null = null,
    public idAdminResolvio: number | null = null,
  ) {}
}
