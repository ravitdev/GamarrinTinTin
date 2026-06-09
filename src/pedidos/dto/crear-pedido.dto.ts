import { Talla } from '../domain/pedido.entity';

export interface CrearPedidoDetalleDto {
  idProducto: number;
  talla: Talla;
  cantidad: number;
  precioUnitario: number;
}

export interface CrearPedidoDto {
  items: CrearPedidoDetalleDto[];
}
