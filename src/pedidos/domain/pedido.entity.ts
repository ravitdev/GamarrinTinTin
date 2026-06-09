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
    public idProducto: number,
    public talla: Talla,
    public cantidad: number,
    public precioUnitario: number,
  ) {}

  calcularSubtotal(): number {
    return this.cantidad * this.precioUnitario;
  }
}

export class Pedido {
  constructor(
    public idPedido: number,
    public idCliente: number,
    public fecha: Date,
    public estado: EstadoPedido,
    public total: number,
    public detalles: PedidoDetalle[] = [],
  ) {}
}
