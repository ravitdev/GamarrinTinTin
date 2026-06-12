import {
  EstadoPedido,
  Pedido,
  PedidoDetalle,
  Talla,
} from './domain/pedido.entity';

export interface PedidoDetalleRegistro {
  idPedidoDetalle: number;
  idProductoVariante: number;
  idCotizacion: number | null;
  cantidad: number;
  precioUnitario: number | { toNumber(): number };
  subtotal: number | { toNumber(): number };
  nombreProductoSnapshot: string;
  colorSnapshot: string;
  tallaSnapshot: Talla;
}

export interface PedidoRegistro {
  idPedido: number;
  idCliente: number;
  fechaCreacion: Date;
  estado: EstadoPedido;
  subtotal: number | { toNumber(): number };
  descuentoTotal: number | { toNumber(): number };
  total: number | { toNumber(): number };
  direccionSnapshot: string;
  detalles: PedidoDetalleRegistro[];
}

export class PedidoMapper {
  static aEntidad(registro: PedidoRegistro): Pedido {
    return new Pedido(
      registro.idPedido,
      registro.idCliente,
      new Date(registro.fechaCreacion),
      registro.estado,
      this.aNumero(registro.subtotal),
      this.aNumero(registro.descuentoTotal),
      this.aNumero(registro.total),
      registro.direccionSnapshot,
      registro.detalles.map(
        (detalle) =>
          new PedidoDetalle(
            detalle.idPedidoDetalle,
            detalle.idProductoVariante,
            detalle.idCotizacion,
            detalle.cantidad,
            this.aNumero(detalle.precioUnitario),
            this.aNumero(detalle.subtotal),
            detalle.nombreProductoSnapshot,
            detalle.colorSnapshot,
            detalle.tallaSnapshot,
          ),
      ),
    );
  }

  static aRegistro(pedido: Pedido): PedidoRegistro {
    return {
      idPedido: pedido.idPedido,
      idCliente: pedido.idCliente,
      fechaCreacion: new Date(pedido.fechaCreacion),
      estado: pedido.estado,
      subtotal: pedido.subtotal,
      descuentoTotal: pedido.descuentoTotal,
      total: pedido.total,
      direccionSnapshot: pedido.direccionSnapshot,
      detalles: pedido.detalles.map((detalle) => ({
        idPedidoDetalle: detalle.idPedidoDetalle,
        idProductoVariante: detalle.idProductoVariante,
        idCotizacion: detalle.idCotizacion,
        cantidad: detalle.cantidad,
        precioUnitario: detalle.precioUnitario,
        subtotal: detalle.subtotal,
        nombreProductoSnapshot: detalle.nombreProductoSnapshot,
        colorSnapshot: detalle.colorSnapshot,
        tallaSnapshot: detalle.tallaSnapshot,
      })),
    };
  }

  private static aNumero(valor: number | { toNumber(): number }): number {
    return typeof valor === 'number' ? valor : valor.toNumber();
  }
}
