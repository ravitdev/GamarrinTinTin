import type { RazonCotizacion } from '../domain/cotizacion.entity';

export interface CrearCotizacionDto {
  idProductoVariante: number;
  cantidad: number;
  razon: RazonCotizacion;
  personalizacion?: unknown;
}
