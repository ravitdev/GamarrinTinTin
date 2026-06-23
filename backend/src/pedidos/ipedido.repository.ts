import { Pedido } from './domain/pedido.entity';

export interface IPedidoRepository {
  guardar(pedido: Pedido): Promise<Pedido>;
  registrarPago(
    idPedido: number,
    monto: number,
    pagoExitoso: boolean,
    referenciaExterna: string,
  ): Promise<boolean>;
  buscarPorId(idPedido: number): Promise<Pedido | null>;
  listarPorCliente(idCliente: number): Promise<Pedido[]>;
  listarTodos?(): Promise<Pedido[]>;
}
