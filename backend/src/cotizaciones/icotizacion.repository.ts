import { Cotizacion } from './domain/cotizacion.entity';
import type { CrearCotizacionDto } from './dto/crear-cotizacion.dto';

export interface ICotizacionRepository {
  crear(idCliente: number, datos: CrearCotizacionDto): Promise<Cotizacion>;
  buscarPorId(idCotizacion: number): Promise<Cotizacion | null>;
  listarPorCliente(idCliente: number): Promise<Cotizacion[]>;
  listarSolicitudes(): Promise<Cotizacion[]>;
  responder(
    idCotizacion: number,
    atendidoPorId: number,
    precioCotizado: number,
    fechaExpiracion: Date,
  ): Promise<Cotizacion | null>;
  agregarAlCarrito(
    idCotizacion: number,
    idCliente: number,
  ): Promise<Cotizacion | null>;
  cancelarPropia(
    idCotizacion: number,
    idCliente: number,
  ): Promise<Cotizacion | null>;
  cancelarVencidas(fechaActual: Date): Promise<Cotizacion[]>;
}
