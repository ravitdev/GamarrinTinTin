import { EstadoCotizacion } from '@prisma/client';
import { CotizacionManager } from './cotizacion.manager';
import {
  CotizacionConDetalle,
  CotizacionRepository,
} from './cotizacion.repository';
import { NotificacionesService } from '../notificaciones/notificaciones.service';

function construirCotizacionVencida(
  idCotizacion: number,
  email = 'cliente@correo.com',
): CotizacionConDetalle {
  return {
    idCotizacion,
    idCliente: 1,
    atendidoPorId: 9,
    idProductoVariante: 10,
    cantidad: 100,
    razon: 'STOCK_INSUFICIENTE',
    estado: EstadoCotizacion.EXPIRADO,
    precioCotizado: 1500,
    fechaCotizacion: new Date('2026-06-01T00:00:00Z'),
    fechaExpiracion: new Date('2026-06-03T00:00:00Z'),
    nombreProductoSnapshot: 'Polo basico',
    colorSnapshot: 'Negro',
    tallaSnapshot: 'M',
    precioBaseSnapshot: 35,
    fechaCreacion: new Date('2026-06-01T00:00:00Z'),
    fechaActualizacion: new Date('2026-06-03T00:00:00Z'),
    cliente: {
      nombres: 'Ana',
      apellidos: 'Cliente',
      email,
      telefono: '999999999',
      tipoDocumento: 'DNI',
      numeroDocumento: '12345678',
      direccion: 'Av. Siempre Viva',
    },
    productoVariante: {
      colorHex: '#000000',
      producto: {
        idProducto: 5,
        descripcion: 'Polo basico de algodon',
        descuentosVolumen: [],
      },
    },
    personalizacion: null,
  } as unknown as CotizacionConDetalle;
}

class CotizacionRepositoryFake {
  public vencidasAEntregar: CotizacionConDetalle[] = [];
  public llamadasExpirar = 0;

  async expirarCotizacionesVencidas(): Promise<CotizacionConDetalle[]> {
    this.llamadasExpirar += 1;
    return this.vencidasAEntregar;
  }
}

class NotificacionesServiceFake {
  public canceladas: Array<{ email: string; codigoCotizacion: string }> = [];
  public debeFallar = false;

  async enviarCotizacionCancelada(params: {
    email: string;
    nombres: string;
    codigoCotizacion: string;
  }): Promise<void> {
    if (this.debeFallar) {
      throw new Error('Fallo simulado del servicio de correo.');
    }
    this.canceladas.push({
      email: params.email,
      codigoCotizacion: params.codigoCotizacion,
    });
  }
}

describe('CotizacionManager - procesarVencimientos (CU 3.1.5.6)', () => {
  let repositorio: CotizacionRepositoryFake;
  let notificaciones: NotificacionesServiceFake;
  let manager: CotizacionManager;

  beforeEach(() => {
    repositorio = new CotizacionRepositoryFake();
    notificaciones = new NotificacionesServiceFake();
    manager = new CotizacionManager(
      repositorio as unknown as CotizacionRepository,
      notificaciones as unknown as NotificacionesService,
    );
  });

  it('flujo básico: cancela las cotizaciones vencidas y notifica a cada cliente', async () => {
    repositorio.vencidasAEntregar = [
      construirCotizacionVencida(1, 'ana@correo.com'),
      construirCotizacionVencida(2, 'beto@correo.com'),
    ];

    const canceladas = await manager.procesarVencimientos();

    expect(canceladas).toBe(2);
    expect(repositorio.llamadasExpirar).toBe(1);
    expect(notificaciones.canceladas).toEqual([
      { email: 'ana@correo.com', codigoCotizacion: 'COT-000001' },
      { email: 'beto@correo.com', codigoCotizacion: 'COT-000002' },
    ]);
  });

  it('flujo alternativo: no hay cotizaciones vencidas, no notifica nada', async () => {
    repositorio.vencidasAEntregar = [];

    const canceladas = await manager.procesarVencimientos();

    expect(canceladas).toBe(0);
    expect(notificaciones.canceladas).toHaveLength(0);
  });

  it('flujo de excepción: un fallo de correo no impide cancelar las cotizaciones', async () => {
    repositorio.vencidasAEntregar = [construirCotizacionVencida(3)];
    notificaciones.debeFallar = true;

    const canceladas = await manager.procesarVencimientos();

    expect(canceladas).toBe(1);
    expect(notificaciones.canceladas).toHaveLength(0);
  });
});
