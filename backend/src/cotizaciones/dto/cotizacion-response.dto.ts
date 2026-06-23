import type {
  EstadoCotizacion,
  RazonCotizacion,
  TallaCotizacion,
} from '../domain/cotizacion.entity';

export interface CotizacionResponseDto {
  idCotizacion: number;
  codigo: string;
  idCliente: number;
  atendidoPorId: number | null;
  idProductoVariante: number;
  cantidad: number;
  razon: RazonCotizacion;
  estado: EstadoCotizacion;
  precioCotizado: number | null;
  fechaCotizacion: string | null;
  fechaExpiracion: string | null;
  nombreProductoSnapshot: string;
  colorSnapshot: string;
  tallaSnapshot: TallaCotizacion;
  precioBaseSnapshot: number;
  fechaCreacion: string;
  fechaActualizacion: string;
  cliente?: {
    nombres: string;
    apellidos: string;
    email: string;
    telefono: string;
    tipoDocumento: string;
    numeroDocumento: string;
    direccion: string | null;
  };
  producto?: {
    idProducto: number;
    descripcion: string;
    categoria: string;
    colorHex: string;
    descuentosVolumen: {
      cantidadMinima: number;
      porcentajeDescuento: number;
    }[];
  };
}
