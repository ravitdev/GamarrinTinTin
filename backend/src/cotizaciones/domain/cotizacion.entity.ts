export type RazonCotizacion = 'PERSONALIZACION' | 'STOCK_INSUFICIENTE';

export type EstadoCotizacion =
  | 'PENDIENTE'
  | 'COTIZADO'
  | 'PAGADO'
  | 'EXPIRADO'
  | 'RECHAZADO';

export type TallaCotizacion = 'S' | 'M' | 'L' | 'XL';

export interface ClienteCotizacion {
  nombres: string;
  apellidos: string;
  email: string;
  telefono: string;
  tipoDocumento: string;
  numeroDocumento: string;
  direccion: string | null;
}

export interface ProductoCotizacion {
  idProducto: number;
  descripcion: string;
  categoria: string;
  colorHex: string;
  descuentosVolumen: {
    cantidadMinima: number;
    porcentajeDescuento: number;
  }[];
}

export class Cotizacion {
  constructor(
    public idCotizacion: number,
    public idCliente: number,
    public atendidoPorId: number | null,
    public idProductoVariante: number,
    public cantidad: number,
    public razon: RazonCotizacion,
    public estado: EstadoCotizacion,
    public precioCotizado: number | null,
    public fechaCotizacion: Date | null,
    public fechaExpiracion: Date | null,
    public nombreProductoSnapshot: string,
    public colorSnapshot: string,
    public tallaSnapshot: TallaCotizacion,
    public precioBaseSnapshot: number,
    public fechaCreacion: Date,
    public fechaActualizacion: Date,
    public cliente?: ClienteCotizacion,
    public producto?: ProductoCotizacion,
  ) {}

  estaVencida(fechaActual = new Date()): boolean {
    return (
      this.estado === 'COTIZADO' &&
      this.fechaExpiracion !== null &&
      this.fechaExpiracion.getTime() <= fechaActual.getTime()
    );
  }

  puedeAgregarseAlCarrito(fechaActual = new Date()): boolean {
    return (
      this.estado === 'COTIZADO' &&
      this.precioCotizado !== null &&
      !this.estaVencida(fechaActual)
    );
  }
}
