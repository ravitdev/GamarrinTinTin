import {
  Cotizacion,
  EstadoCotizacion,
  RazonCotizacion,
  TallaCotizacion,
} from './domain/cotizacion.entity';
import type { CotizacionResponseDto } from './dto/cotizacion-response.dto';

type DecimalLike = number | { toNumber(): number };

export interface CotizacionRegistro {
  idCotizacion: number;
  idCliente: number;
  atendidoPorId: number | null;
  idProductoVariante: number;
  cantidad: number;
  razon: RazonCotizacion;
  estado: EstadoCotizacion;
  precioCotizado: DecimalLike | null;
  fechaCotizacion: Date | null;
  fechaExpiracion: Date | null;
  nombreProductoSnapshot: string;
  colorSnapshot: string;
  tallaSnapshot: TallaCotizacion;
  precioBaseSnapshot: DecimalLike;
  fechaCreacion: Date;
  fechaActualizacion: Date;
  cliente?: {
    nombres: string;
    apellidos: string;
    email: string;
    telefono: string;
    tipoDocumento: string;
    numeroDocumento: string;
    direccion: string | null;
  };
  productoVariante?: {
    colorHex: string;
    producto: {
      idProducto: number;
      descripcion: string;
      categoria?: { nombre: string } | null;
      descuentosVolumen?: {
        cantidadMinima: number;
        porcentajeDescuento: DecimalLike;
      }[];
    };
  };
}

export class CotizacionMapper {
  static aEntidad(registro: CotizacionRegistro): Cotizacion {
    return new Cotizacion(
      registro.idCotizacion,
      registro.idCliente,
      registro.atendidoPorId,
      registro.idProductoVariante,
      registro.cantidad,
      registro.razon,
      registro.estado,
      registro.precioCotizado === null
        ? null
        : this.aNumero(registro.precioCotizado),
      registro.fechaCotizacion ? new Date(registro.fechaCotizacion) : null,
      registro.fechaExpiracion ? new Date(registro.fechaExpiracion) : null,
      registro.nombreProductoSnapshot,
      registro.colorSnapshot,
      registro.tallaSnapshot,
      this.aNumero(registro.precioBaseSnapshot),
      new Date(registro.fechaCreacion),
      new Date(registro.fechaActualizacion),
      registro.cliente
        ? {
            nombres: registro.cliente.nombres,
            apellidos: registro.cliente.apellidos,
            email: registro.cliente.email,
            telefono: registro.cliente.telefono,
            tipoDocumento: registro.cliente.tipoDocumento,
            numeroDocumento: registro.cliente.numeroDocumento,
            direccion: registro.cliente.direccion,
          }
        : undefined,
      registro.productoVariante
        ? {
            idProducto: registro.productoVariante.producto.idProducto,
            descripcion: registro.productoVariante.producto.descripcion,
            categoria:
              registro.productoVariante.producto.categoria?.nombre ?? '',
            colorHex: registro.productoVariante.colorHex,
            descuentosVolumen: (
              registro.productoVariante.producto.descuentosVolumen ?? []
            ).map((descuento) => ({
              cantidadMinima: descuento.cantidadMinima,
              porcentajeDescuento: this.aNumero(descuento.porcentajeDescuento),
            })),
          }
        : undefined,
    );
  }

  static aResponseDto(cotizacion: Cotizacion): CotizacionResponseDto {
    return {
      idCotizacion: cotizacion.idCotizacion,
      codigo: `COT-${String(cotizacion.idCotizacion).padStart(3, '0')}`,
      idCliente: cotizacion.idCliente,
      atendidoPorId: cotizacion.atendidoPorId,
      idProductoVariante: cotizacion.idProductoVariante,
      cantidad: cotizacion.cantidad,
      razon: cotizacion.razon,
      estado: cotizacion.estado,
      precioCotizado: cotizacion.precioCotizado,
      fechaCotizacion: cotizacion.fechaCotizacion?.toISOString() ?? null,
      fechaExpiracion: cotizacion.fechaExpiracion?.toISOString() ?? null,
      nombreProductoSnapshot: cotizacion.nombreProductoSnapshot,
      colorSnapshot: cotizacion.colorSnapshot,
      tallaSnapshot: cotizacion.tallaSnapshot,
      precioBaseSnapshot: cotizacion.precioBaseSnapshot,
      fechaCreacion: cotizacion.fechaCreacion.toISOString(),
      fechaActualizacion: cotizacion.fechaActualizacion.toISOString(),
      cliente: cotizacion.cliente,
      producto: cotizacion.producto,
    };
  }

  private static aNumero(valor: DecimalLike): number {
    return typeof valor === 'number' ? valor : valor.toNumber();
  }
}
