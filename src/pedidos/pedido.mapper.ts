import {
  EstadoPedido,
  Pedido,
  PedidoDetalle,
  Talla,
} from './domain/pedido.entity';

export interface PedidoDetalleRegistro {
  idPedidoDetalle: number;
  idProducto: number;
  talla: Talla;
  cantidad: number;
  precioUnitario: number | { toNumber(): number };
}

export interface PedidoRegistro {
  idPedido: number;
  idCliente: number;
  fecha: Date;
  estado: EstadoPedido;
  total: number | { toNumber(): number };
  detalles: PedidoDetalleRegistro[];
}

export class PedidoMapper {
  static aEntidad(registro: PedidoRegistro): Pedido {
    return new Pedido(
      registro.idPedido,
      registro.idCliente,
      new Date(registro.fecha),
      registro.estado,
      this.aNumero(registro.total),
      registro.detalles.map(
        (detalle) =>
          new PedidoDetalle(
            detalle.idPedidoDetalle,
            detalle.idProducto,
            detalle.talla,
            detalle.cantidad,
            this.aNumero(detalle.precioUnitario),
          ),
      ),
    );
  }

  static aRegistro(pedido: Pedido): PedidoRegistro {
    return {
      idPedido: pedido.idPedido,
      idCliente: pedido.idCliente,
      fecha: new Date(pedido.fecha),
      estado: pedido.estado,
      total: pedido.total,
      detalles: pedido.detalles.map((detalle) => ({
        idPedidoDetalle: detalle.idPedidoDetalle,
        idProducto: detalle.idProducto,
        talla: detalle.talla,
        cantidad: detalle.cantidad,
        precioUnitario: detalle.precioUnitario,
      })),
    };
  }

  private static aNumero(valor: number | { toNumber(): number }): number {
    return typeof valor === 'number' ? valor : valor.toNumber();
  }
}
