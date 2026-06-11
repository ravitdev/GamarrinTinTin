import { Pedido, PedidoDetalle } from './domain/pedido.entity';
import { IPedidoRepository } from './ipedido.repository';
import { PedidoManager } from './pedido.manager';

class PedidoRepositoryFake implements IPedidoRepository {
  private pedidos: Pedido[] = [];
  private pagos: Array<{ idPedido: number; pagoExitoso: boolean }> = [];

  private readonly variantes = new Map([
    [
      10,
      {
        precioUnitario: 35,
        nombreProductoSnapshot: 'Polo basico',
        colorSnapshot: 'Negro',
        tallaSnapshot: 'M' as const,
      },
    ],
    [
      11,
      {
        precioUnitario: 50,
        nombreProductoSnapshot: 'Casaca urbana',
        colorSnapshot: 'Azul',
        tallaSnapshot: 'L' as const,
      },
    ],
  ]);

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
    const detalles = pedido.detalles.map((detalle, index) => {
      const variante = this.variantes.get(detalle.idProductoVariante);

      if (!variante) {
        throw new Error('Producto no disponible para el pedido.');
      }

      return new PedidoDetalle(
        index + 1,
        detalle.idProductoVariante,
        detalle.idCotizacion,
        detalle.cantidad,
        variante.precioUnitario,
        variante.precioUnitario * detalle.cantidad,
        variante.nombreProductoSnapshot,
        variante.colorSnapshot,
        variante.tallaSnapshot,
      );
    });
    const subtotal = detalles.reduce(
      (acumulado, detalle) => acumulado + detalle.subtotal,
      0,
    );
    const pedidoGuardado = new Pedido(
      idPedido,
      pedido.idCliente,
      pedido.fechaCreacion,
      pedido.estado,
      subtotal,
      0,
      subtotal,
      'Lima',
      detalles,
    );

    this.pedidos.push(pedidoGuardado);
    return pedidoGuardado;
  }

  async registrarPago(
    idPedido: number,
    _monto: number,
    pagoExitoso: boolean,
  ): Promise<boolean> {
    this.pagos.push({ idPedido, pagoExitoso });
    return true;
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
    const pedido = await manager.crearPedido(1, [
      {
        idProductoVariante: 10,
        cantidad: 2,
      },
      {
        idProductoVariante: 11,
        cantidad: 1,
      },
    ]);

    expect(pedido.idCliente).toBe(1);
    expect(pedido.estado).toBe('REGISTRADO');
    expect(pedido.total).toBe(120);
    expect(pedido.detalles).toHaveLength(2);
  });

  it('confirma el pedido cuando el pago es exitoso', async () => {
    await manager.crearPedido(1, [
      {
        idProductoVariante: 10,
        cantidad: 2,
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
        idProductoVariante: 10,
        cantidad: 2,
      },
    ]);

    const pagoExitoso = await manager.procesarPagoPedido(1, 'rechazado');
    const pedidos = await manager.listarPorCliente(1);

    expect(pagoExitoso).toBe(false);
    expect(pedidos[0].estado).toBe('REGISTRADO');
  });

  it('rechaza pedido con variante inválida', async () => {
    await expect(
      manager.crearPedido(1, [
        {
          idProductoVariante: 0,
          cantidad: 2,
        },
      ]),
    ).rejects.toThrow('La variante del producto no es válida.');
  });

  it('rechaza pedido con cantidad inválida', async () => {
    await expect(
      manager.crearPedido(1, [
        {
          idProductoVariante: 10,
          cantidad: 0,
        },
      ]),
    ).rejects.toThrow('La cantidad del detalle no es válida.');
  });

  it('rechaza pago sin token', async () => {
    await manager.crearPedido(1, [
      {
        idProductoVariante: 10,
        cantidad: 2,
      },
    ]);

    await expect(manager.procesarPagoPedido(1, '   ')).rejects.toThrow(
      'El token de pago es obligatorio.',
    );
  });

  it('consulta el detalle de pedido propio', async () => {
    await manager.crearPedido(1, [
      {
        idProductoVariante: 10,
        cantidad: 2,
      },
    ]);

    const pedido = await manager.consultarDetallePedidoPropio(1, 1);

    expect(pedido.idPedido).toBe(1);
    expect(pedido.idCliente).toBe(1);
    expect(pedido.detalles[0].idProductoVariante).toBe(10);
  });

  it('rechaza detalle de pedido que no pertenece al cliente', async () => {
    await manager.crearPedido(1, [
      {
        idProductoVariante: 10,
        cantidad: 2,
      },
    ]);

    await expect(manager.consultarDetallePedidoPropio(2, 1)).rejects.toThrow(
      'Pedido no encontrado para el cliente.',
    );
  });
});
