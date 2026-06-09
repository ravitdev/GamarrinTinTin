import { Pedido } from './domain/pedido.entity';

export interface IPedidoRepository {
  guardar(pedido: Pedido): Promise<Pedido>;
  buscarPorId(idPedido: number): Promise<Pedido | null>;
  listarPorCliente(idCliente: number): Promise<Pedido[]>;
}
