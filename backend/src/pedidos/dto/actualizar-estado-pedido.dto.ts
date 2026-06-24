import type { EstadoPedido } from '../domain/pedido.entity';

export interface ActualizarEstadoPedidoDto {
  estado: EstadoPedido;
}
