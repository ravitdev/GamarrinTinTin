import { Pedido } from './domain/pedido.entity';
import { IPedidoRepository } from './ipedido.repository';
import { PedidoManager } from './pedido.manager';

class PedidoRepositoryFake implements IPedidoRepository {
  private pedidos: Pedido[] = [];

  async guardar(pedido: Pedido): Promise<Pedido> {
    if (pedido.idPedido > 0) {
      const index = this.pedidos.findIndex(
        (pedidoActual) => pedidoActual.idPedido === pedido.idPedido,
      );
      if (index >= 0) this.pedidos[index] = pedido;
      return pedido;
    }

    const idPedido =
      this.pedidos.length === 0
        ? 1
        : Math.max(
            ...this.pedidos.map((pedidoActual) => pedidoActual.idPedido),
          ) + 1;
    const detalles = pedido.detalles.map((detalle, index) => ({
      ...detalle,
      idPedidoDetalle: index + 1,
    }));
    const pedidoGuardado = new Pedido(
      idPedido,
      pedido.idCliente,
      pedido.fecha,
      pedido.estado,
      pedido.total,
      detalles,
    );

    this.pedidos.push(pedidoGuardado);
    return pedidoGuardado;
  }

  async buscarPorId(idPedido: number): Promise<Pedido | null> {
    return this.pedidos.find((pedido) => pedido.idPedido === idPedido) ?? null;
  }

  async listarPorCliente(idCliente: number): Promise<Pedido[]> {
    return this.pedidos.filter((pedido) => pedido.idCliente === idCliente);
  }
}

describe('PedidoManager', () => {
  let manager: PedidoManager;

  beforeEach(() => {
    manager = new PedidoManager(new PedidoRepositoryFake());
  });

  it('crea pedido con detalles y calcula el total', async () => {
    const pedidos = await manager.crearPedido(1, [
      {
        idProducto: 10,
        talla: 'M',
        cantidad: 2,
        precioUnitario: 35,
      },
      {
        idProducto: 11,
        talla: 'L',
        cantidad: 1,
        precioUnitario: 50,
      },
    ]);

    expect(pedidos).toHaveLength(1);
    expect(pedidos[0].idCliente).toBe(1);
    expect(pedidos[0].estado).toBe('REGISTRADO');
    expect(pedidos[0].total).toBe(120);
    expect(pedidos[0].detalles).toHaveLength(2);
  });

  it('confirma el pedido cuando el pago es exitoso', async () => {
    await manager.crearPedido(1, [
      {
        idProducto: 10,
        talla: 'M',
        cantidad: 2,
        precioUnitario: 35,
      },
    ]);

    const pagoExitoso = await manager.procesarPagoPedido(1, 'tok_aprobado');
    const pedidos = await manager.listarPorCliente(1);

    expect(pagoExitoso).toBe(true);
    expect(pedidos[0].estado).toBe('CONFIRMADO');
  });

  it('mantiene registrado el pedido cuando el pago es rechazado', async () => {
    await manager.crearPedido(1, [
      {
        idProducto: 10,
        talla: 'M',
        cantidad: 2,
        precioUnitario: 35,
      },
    ]);

    const pagoExitoso = await manager.procesarPagoPedido(1, 'rechazado');
    const pedidos = await manager.listarPorCliente(1);

    expect(pagoExitoso).toBe(false);
    expect(pedidos[0].estado).toBe('REGISTRADO');
  });

  it('consulta el detalle de pedido propio', async () => {
    await manager.crearPedido(1, [
      {
        idProducto: 10,
        talla: 'M',
        cantidad: 2,
        precioUnitario: 35,
      },
    ]);

    const pedido = await manager.consultarDetallePedidoPropio(1, 1);

    expect(pedido.idPedido).toBe(1);
    expect(pedido.idCliente).toBe(1);
    expect(pedido.detalles[0].idProducto).toBe(10);
  });

  it('rechaza detalle de pedido que no pertenece al cliente', async () => {
    await manager.crearPedido(1, [
      {
        idProducto: 10,
        talla: 'M',
        cantidad: 2,
        precioUnitario: 35,
      },
    ]);

    await expect(manager.consultarDetallePedidoPropio(2, 1)).rejects.toThrow(
      'Pedido no encontrado para el cliente.',
    );
  });
});
