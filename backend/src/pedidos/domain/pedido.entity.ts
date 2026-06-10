export type EstadoPedido =
  | 'REGISTRADO'
  | 'CONFIRMADO'
  | 'PROCESANDO'
  | 'ENVIADO'
  | 'ENTREGADO'
  | 'CANCELADO';

export type Talla = 'S' | 'M' | 'L' | 'XL';

export class PedidoDetalle {
  constructor(
    public idPedidoDetalle: number,
    public idProductoVariante: number,
    public idCotizacion: number | null,
    public cantidad: number,
    public precioUnitario: number,
    public subtotal: number,
    public nombreProductoSnapshot: string,
    public colorSnapshot: string,
    public tallaSnapshot: Talla,
  ) {}

  calcularSubtotal(): number {
    return this.subtotal;
  }
}

export class Pedido {
  constructor(
    public idPedido: number,
    public idCliente: number,
    public fechaCreacion: Date,
    public estado: EstadoPedido,
    public subtotal: number,
    public descuentoTotal: number,
    public total: number,
    public direccionSnapshot: string,
    public detalles: PedidoDetalle[] = [],
  ) {}
}
