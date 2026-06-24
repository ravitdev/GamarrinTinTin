import { Cotizacion } from './domain/cotizacion.entity';
import { CotizacionManager } from './cotizacion.manager';
import type { CrearCotizacionDto } from './dto/crear-cotizacion.dto';
import type { ICotizacionRepository } from './icotizacion.repository';

class CotizacionRepositoryFake implements ICotizacionRepository {
  cotizaciones: Cotizacion[] = [];
  agregadaAlCarrito = false;

  crear(idCliente: number, datos: CrearCotizacionDto): Promise<Cotizacion> {
    const cotizacion = this.crearCotizacion({
      idCotizacion: this.cotizaciones.length + 1,
      idCliente,
      idProductoVariante: datos.idProductoVariante,
      cantidad: datos.cantidad,
      razon: datos.razon,
    });
    this.cotizaciones.push(cotizacion);
    return Promise.resolve(cotizacion);
  }

  buscarPorId(idCotizacion: number): Promise<Cotizacion | null> {
    return Promise.resolve(
      this.cotizaciones.find(
        (cotizacion) => cotizacion.idCotizacion === idCotizacion,
      ) ?? null,
    );
  }

  listarPorCliente(idCliente: number): Promise<Cotizacion[]> {
    return Promise.resolve(
      this.cotizaciones.filter(
        (cotizacion) => cotizacion.idCliente === idCliente,
      ),
    );
  }

  listarSolicitudes(): Promise<Cotizacion[]> {
    return Promise.resolve(this.cotizaciones);
  }

  async responder(
    idCotizacion: number,
    atendidoPorId: number,
    precioCotizado: number,
    fechaExpiracion: Date,
  ): Promise<Cotizacion | null> {
    const cotizacion = await this.buscarPorId(idCotizacion);
    if (!cotizacion || cotizacion.estado !== 'PENDIENTE') {
      return null;
    }

    cotizacion.atendidoPorId = atendidoPorId;
    cotizacion.precioCotizado = precioCotizado;
    cotizacion.estado = 'COTIZADO';
    cotizacion.fechaCotizacion = new Date();
    cotizacion.fechaExpiracion = fechaExpiracion;
    return cotizacion;
  }

  async agregarAlCarrito(
    idCotizacion: number,
    idCliente: number,
  ): Promise<Cotizacion | null> {
    const cotizacion = await this.buscarPorId(idCotizacion);
    if (!cotizacion || cotizacion.idCliente !== idCliente) {
      return null;
    }
    if (!cotizacion.puedeAgregarseAlCarrito()) {
      throw new Error(
        'Solo las cotizaciones cotizadas pueden agregarse al carrito.',
      );
    }

    this.agregadaAlCarrito = true;
    return cotizacion;
  }

  cancelarVencidas(fechaActual: Date): Promise<Cotizacion[]> {
    const vencidas: Cotizacion[] = [];
    for (const cotizacion of this.cotizaciones) {
      if (cotizacion.estaVencida(fechaActual)) {
        cotizacion.estado = 'EXPIRADO';
        vencidas.push(cotizacion);
      }
    }
    return Promise.resolve(vencidas);
  }

  crearCotizacion(cambios: Partial<Cotizacion> = {}): Cotizacion {
    return Object.assign(
      new Cotizacion(
        1,
        10,
        null,
        20,
        30,
        'STOCK_INSUFICIENTE',
        'PENDIENTE',
        null,
        null,
        null,
        'Polo clásico',
        'Negro',
        'M',
        40,
        new Date('2026-06-21T10:00:00.000Z'),
        new Date('2026-06-21T10:00:00.000Z'),
      ),
      cambios,
    );
  }
}

describe('CotizacionManager', () => {
  let repository: CotizacionRepositoryFake;
  let manager: CotizacionManager;

  beforeEach(() => {
    repository = new CotizacionRepositoryFake();
    manager = new CotizacionManager(repository);
  });

  it('registra una solicitud pendiente para el cliente autenticado', async () => {
    const cotizacion = await manager.crearSolicitud(10, {
      idProductoVariante: 20,
      cantidad: 30,
      razon: 'STOCK_INSUFICIENTE',
    });

    expect(cotizacion.idCliente).toBe(10);
    expect(cotizacion.estado).toBe('PENDIENTE');
    expect(cotizacion.codigo).toBe('COT-001');
  });

  it('rechaza cantidades no válidas', async () => {
    await expect(
      manager.crearSolicitud(10, {
        idProductoVariante: 20,
        cantidad: 0,
        razon: 'STOCK_INSUFICIENTE',
      }),
    ).rejects.toThrow(
      'La cantidad solicitada debe ser un entero mayor a cero.',
    );
  });

  it('lista solamente las cotizaciones propias', async () => {
    repository.cotizaciones.push(
      repository.crearCotizacion({ idCotizacion: 1, idCliente: 10 }),
      repository.crearCotizacion({ idCotizacion: 2, idCliente: 11 }),
    );

    const resultado = await manager.listarPorCliente(10);

    expect(resultado).toHaveLength(1);
    expect(resultado[0].idCliente).toBe(10);
  });

  it('responde una cotización pendiente con precio y vigencia', async () => {
    repository.cotizaciones.push(repository.crearCotizacion());

    const resultado = await manager.responderCotizacion(1, 5, {
      precioCotizado: 35,
    });

    expect(resultado.estado).toBe('COTIZADO');
    expect(resultado.precioCotizado).toBe(35);
    expect(resultado.atendidoPorId).toBe(5);
    expect(resultado.fechaExpiracion).not.toBeNull();
  });

  it('no permite responder nuevamente una cotización atendida', async () => {
    repository.cotizaciones.push(
      repository.crearCotizacion({ estado: 'COTIZADO' }),
    );

    await expect(
      manager.responderCotizacion(1, 5, { precioCotizado: 35 }),
    ).rejects.toThrow('Solo puede responderse una cotización pendiente.');
  });

  it('agrega al carrito una cotización cotizada vigente', async () => {
    repository.cotizaciones.push(
      repository.crearCotizacion({
        estado: 'COTIZADO',
        precioCotizado: 35,
        fechaExpiracion: new Date(Date.now() + 60_000),
      }),
    );

    await manager.agregarCotizacionAlCarrito(10, 1);

    expect(repository.agregadaAlCarrito).toBe(true);
  });

  it('marca como expiradas las cotizaciones vencidas', async () => {
    repository.cotizaciones.push(
      repository.crearCotizacion({
        estado: 'COTIZADO',
        precioCotizado: 35,
        fechaExpiracion: new Date(Date.now() - 60_000),
      }),
    );

    const cantidad = await manager.cancelarVencidas();

    expect(cantidad).toBe(1);
    expect(repository.cotizaciones[0].estado).toBe('EXPIRADO');
  });
});
