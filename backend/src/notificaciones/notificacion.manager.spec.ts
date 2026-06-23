import type { ICorreoAdapter, MensajeCorreo } from './icorreo.adapter';
import { NotificacionManager } from './notificacion.manager';

class CorreoAdapterFake implements ICorreoAdapter {
  mensajes: MensajeCorreo[] = [];

  enviarCorreo(mensaje: MensajeCorreo): Promise<boolean> {
    this.mensajes.push(mensaje);
    return Promise.resolve(true);
  }
}

describe('NotificacionManager', () => {
  let adapter: CorreoAdapterFake;
  let manager: NotificacionManager;

  beforeEach(() => {
    adapter = new CorreoAdapterFake();
    manager = new NotificacionManager(adapter);
  });

  it('envía correo de bienvenida', async () => {
    await manager.enviarBienvenida('cliente@example.com', 'Carlos');

    expect(adapter.mensajes).toHaveLength(1);
    expect(adapter.mensajes[0].destinatario).toBe('cliente@example.com');
    expect(adapter.mensajes[0].asunto).toContain('Bienvenido');
  });

  it('envía actualización de pedido', async () => {
    await manager.enviarEstadoPedido('cliente@example.com', 12, 'ENVIADO');

    expect(adapter.mensajes[0].asunto).toContain('PED-12');
    expect(adapter.mensajes[0].texto).toContain('ENVIADO');
  });

  it('incluye el enlace de recuperación', async () => {
    const enlace =
      'http://localhost:3001/restablecer-contrasena?token=token-prueba';

    await manager.enviarRecuperacionContrasena('cliente@example.com', enlace);

    expect(adapter.mensajes[0].html).toContain(enlace);
  });
});
