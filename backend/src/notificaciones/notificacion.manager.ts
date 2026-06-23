import { Inject, Injectable } from '@nestjs/common';
import type { EstadoCotizacion } from '../cotizaciones/domain/cotizacion.entity';
import type { EstadoPedido } from '../pedidos/domain/pedido.entity';
import type { ICorreoAdapter, MensajeCorreo } from './icorreo.adapter';

@Injectable()
export class NotificacionManager {
  constructor(
    @Inject('ICorreoAdapter')
    private readonly correoAdapter: ICorreoAdapter,
  ) {}

  enviarBienvenida(destinatario: string, nombre: string): Promise<boolean> {
    return this.enviar(
      destinatario,
      'Bienvenido a GamarrinTinTin',
      `<p>Hola <strong>${this.escapar(nombre)}</strong>,</p>
       <p>Tu cuenta fue registrada correctamente. Ya puedes consultar productos, solicitar cotizaciones y realizar pedidos.</p>`,
    );
  }

  enviarPedidoRegistrado(
    destinatario: string,
    idPedido: number,
    total: number,
  ): Promise<boolean> {
    return this.enviar(
      destinatario,
      `Pedido PED-${idPedido} registrado`,
      `<p>Tu pedido <strong>PED-${idPedido}</strong> fue registrado.</p>
       <p>Total: <strong>S/ ${total.toFixed(2)}</strong></p>
       <p>Cuando el pago sea confirmado te enviaremos una nueva actualizacion.</p>`,
    );
  }

  enviarEstadoPedido(
    destinatario: string,
    idPedido: number,
    estado: EstadoPedido,
  ): Promise<boolean> {
    return this.enviar(
      destinatario,
      `Actualizacion del pedido PED-${idPedido}`,
      `<p>El estado de tu pedido <strong>PED-${idPedido}</strong> cambio a:</p>
       <p style="font-size:18px"><strong>${this.etiquetaEstado(estado)}</strong></p>`,
    );
  }

  enviarPagoRechazado(
    destinatario: string,
    idPedido: number,
  ): Promise<boolean> {
    return this.enviar(
      destinatario,
      `Pago rechazado para PED-${idPedido}`,
      `<p>No pudimos procesar el pago del pedido <strong>PED-${idPedido}</strong>.</p>
       <p>Verifica los datos del medio de pago e intentalo nuevamente.</p>`,
    );
  }

  enviarCotizacionCreada(
    destinatario: string,
    idCotizacion: number,
  ): Promise<boolean> {
    return this.enviar(
      destinatario,
      `Cotizacion COT-${idCotizacion} recibida`,
      `<p>Recibimos tu solicitud <strong>COT-${idCotizacion}</strong>.</p>
       <p>Nuestro equipo revisara la solicitud y te avisara cuando tenga un precio propuesto.</p>`,
    );
  }

  enviarEstadoCotizacion(
    destinatario: string,
    idCotizacion: number,
    estado: EstadoCotizacion,
    precioCotizado?: number | null,
    fechaExpiracion?: Date | null,
  ): Promise<boolean> {
    const precio =
      precioCotizado !== null && precioCotizado !== undefined
        ? `<p>Precio cotizado por unidad: <strong>S/ ${precioCotizado.toFixed(2)}</strong></p>`
        : '';
    const vigencia = fechaExpiracion
      ? `<p>Vigente hasta: <strong>${fechaExpiracion.toLocaleString('es-PE')}</strong></p>`
      : '';

    return this.enviar(
      destinatario,
      `Actualizacion de la cotizacion COT-${idCotizacion}`,
      `<p>El estado de tu cotizacion <strong>COT-${idCotizacion}</strong> cambio a <strong>${this.etiquetaEstado(estado)}</strong>.</p>
       ${precio}${vigencia}`,
    );
  }

  enviarRecuperacionContrasena(
    destinatario: string,
    enlace: string,
  ): Promise<boolean> {
    const enlaceSeguro = this.escapar(enlace);
    return this.enviar(
      destinatario,
      'Restablece tu contrasena de GamarrinTinTin',
      `<p>Recibimos una solicitud para restablecer tu contrasena.</p>
       <p><a href="${enlaceSeguro}" style="display:inline-block;padding:12px 18px;background:#111827;color:#ffffff;text-decoration:none;border-radius:6px">Restablecer contrasena</a></p>
       <p>El enlace vence en una hora y solo puede utilizarse una vez.</p>
       <p>Si no realizaste esta solicitud, ignora este mensaje.</p>`,
    );
  }

  enviarContrasenaActualizada(destinatario: string): Promise<boolean> {
    return this.enviar(
      destinatario,
      'Tu contrasena fue actualizada',
      `<p>La contrasena de tu cuenta fue actualizada correctamente.</p>
       <p>Si no realizaste este cambio, comunicate inmediatamente con el administrador.</p>`,
    );
  }

  private enviar(
    destinatario: string,
    asunto: string,
    contenido: string,
  ): Promise<boolean> {
    const mensaje: MensajeCorreo = {
      destinatario,
      asunto,
      html: this.plantilla(contenido),
    };
    return this.correoAdapter.enviarCorreo(mensaje);
  }

  private plantilla(contenido: string): string {
    return `<!doctype html>
      <html lang="es">
        <body style="margin:0;background:#f4f4f5;font-family:Arial,sans-serif;color:#18181b">
          <div style="max-width:600px;margin:0 auto;padding:32px 16px">
            <div style="background:#ffffff;border:1px solid #e4e4e7;border-radius:8px;padding:28px">
              <h1 style="font-size:22px;margin:0 0 20px">GamarrinTinTin</h1>
              ${contenido}
            </div>
          </div>
        </body>
      </html>`;
  }

  private escapar(valor: string): string {
    return valor
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  private etiquetaEstado(estado: string): string {
    return estado
      .replaceAll('_', ' ')
      .toLowerCase()
      .replace(/^\w/, (letra) => letra.toUpperCase());
  }
}
