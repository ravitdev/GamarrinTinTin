import { EstadoPedido, Pedido, PedidoDetalle } from './domain/pedido.entity';
import {
  IPedidoRepository,
  PedidoGestionRegistro,
} from './ipedido.repository';
import { PedidoManager } from './pedido.manager';
import { NotificacionesService } from '../notificaciones/notificaciones.service';

class NotificacionesServiceFake {
  async enviarEstadoPedidoActualizado(): Promise<void> {}
}

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
      pedido.tipoEntrega,
      pedido.direccionSnapshot,
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

  async listarParaPersonal(
    estado?: EstadoPedido,
  ): Promise<PedidoGestionRegistro[]> {
    return this.pedidos
      .filter((pedido) => !estado || pedido.estado === estado)
      .map((pedido) => this.aGestionRegistro(pedido, pedido.estado));
  }

  async buscarGestionPorId(
    idPedido: number,
  ): Promise<PedidoGestionRegistro | null> {
    const pedido = this.pedidos.find(
      (pedidoActual) => pedidoActual.idPedido === idPedido,
    );
    return pedido ? this.aGestionRegistro(pedido, pedido.estado) : null;
  }

  async actualizarEstado(
    idPedido: number,
    estado: EstadoPedido,
  ): Promise<PedidoGestionRegistro> {
    const pedido = this.pedidos.find(
      (pedidoActual) => pedidoActual.idPedido === idPedido,
    );

    if (!pedido) {
      throw new Error('Pedido no encontrado.');
    }

    pedido.estado = estado;
    return this.aGestionRegistro(pedido, estado);
  }

  private aGestionRegistro(
    pedido: Pedido,
    estado: EstadoPedido,
  ): PedidoGestionRegistro {
    return {
      idPedido: pedido.idPedido,
      idCliente: pedido.idCliente,
      cliente: {
        idUsuario: pedido.idCliente,
        nombres: 'Cliente',
        apellidos: 'Demo',
        email: 'cliente@correo.com',
        telefono: '999999999',
        tipoDocumento: 'DNI',
        numeroDocumento: '12345678',
        direccion: pedido.direccionSnapshot,
      },
      fechaCreacion: pedido.fechaCreacion,
      fechaActualizacion: new Date(),
      estado,
      subtotal: pedido.subtotal,
      descuentoTotal: pedido.descuentoTotal,
      total: pedido.total,
      tipoEntrega: pedido.tipoEntrega,
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
        colorHex: '',
        tallaSnapshot: detalle.tallaSnapshot,
      })),
    };
  }
}

describe('PedidoManager', () => {
  let manager: PedidoManager;

  beforeEach(() => {
    manager = new PedidoManager(
      new PedidoRepositoryFake(),
      new NotificacionesServiceFake() as unknown as NotificacionesService,
    );
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
    ], 'ENVIO', 'Av. Test 123');

    expect(pedido.idCliente).toBe(1);
    expect(pedido.estado).toBe('REGISTRADO');
    expect(pedido.total).toBe(120);
    expect(pedido.detalles).toHaveLength(2);
  });

  it('confirma el pedido cuando el pago es exitoso', async () => {
    await manager.crearPedido(
      1,
      [
        {
          idProductoVariante: 10,
          cantidad: 2,
        },
      ],
      'ENVIO',
      'Av. Test 123',
    );

    const pagoExitoso = await manager.procesarPagoPedido(1, 'tok_aprobado');
    const pedidos = await manager.listarPorCliente(1);

    expect(pagoExitoso).toBe(true);
    expect(pedidos[0].estado).toBe('CONFIRMADO');
  });

  it('mantiene registrado el pedido cuando el pago es rechazado', async () => {
    await manager.crearPedido(
      1,
      [
        {
          idProductoVariante: 10,
          cantidad: 2,
        },
      ],
      'ENVIO',
      'Av. Test 123',
    );

    const pagoExitoso = await manager.procesarPagoPedido(1, 'rechazado');
    const pedidos = await manager.listarPorCliente(1);

    expect(pagoExitoso).toBe(false);
    expect(pedidos[0].estado).toBe('REGISTRADO');
  });

  it('rechaza pedido con variante inválida', async () => {
    await expect(
      manager.crearPedido(
        1,
        [
          {
            idProductoVariante: 0,
            cantidad: 2,
          },
        ],
        'ENVIO',
        'Av. Test 123',
      ),
    ).rejects.toThrow('La variante del producto no es válida.');
  });

  it('rechaza pedido con cantidad inválida', async () => {
    await expect(
      manager.crearPedido(
        1,
        [
          {
            idProductoVariante: 10,
            cantidad: 0,
          },
        ],
        'ENVIO',
        'Av. Test 123',
      ),
    ).rejects.toThrow('La cantidad del detalle no es válida.');
  });

  it('rechaza pago sin token', async () => {
    await manager.crearPedido(
      1,
      [
        {
          idProductoVariante: 10,
          cantidad: 2,
        },
      ],
      'ENVIO',
      'Av. Test 123',
    );

    await expect(manager.procesarPagoPedido(1, '   ')).rejects.toThrow(
      'El token de pago es obligatorio.',
    );
  });

  it('consulta el detalle de pedido propio', async () => {
    await manager.crearPedido(
      1,
      [
        {
          idProductoVariante: 10,
          cantidad: 2,
        },
      ],
      'ENVIO',
      'Av. Test 123',
    );

    const pedido = await manager.consultarDetallePedidoPropio(1, 1);

    expect(pedido.idPedido).toBe(1);
    expect(pedido.idCliente).toBe(1);
    expect(pedido.detalles[0].idProductoVariante).toBe(10);
  });

  it('rechaza detalle de pedido que no pertenece al cliente', async () => {
    await manager.crearPedido(
      1,
      [
        {
          idProductoVariante: 10,
          cantidad: 2,
        },
      ],
      'ENVIO',
      'Av. Test 123',
    );

    await expect(manager.consultarDetallePedidoPropio(2, 1)).rejects.toThrow(
      'Pedido no encontrado para el cliente.',
    );
  });

  it('rechaza pedido con envío sin dirección', async () => {
    await expect(
      manager.crearPedido(
        1,
        [
          {
            idProductoVariante: 10,
            cantidad: 1,
          },
        ],
        'ENVIO',
        '',
      ),
    ).rejects.toThrow('La dirección de envío es obligatoria.');
  });

  it('crea pedido con recojo en tienda sin dirección', async () => {
    const pedido = await manager.crearPedido(
      1,
      [
        {
          idProductoVariante: 10,
          cantidad: 1,
        },
      ],
      'RECOJO_TIENDA',
      null,
    );

    expect(pedido.tipoEntrega).toBe('RECOJO_TIENDA');
    expect(pedido.direccionSnapshot).toBe('Recojo en tienda');
  });
});
