import { Inject, Injectable } from '@nestjs/common';
import type { EstadoCotizacion } from '../cotizaciones/domain/cotizacion.entity';
import type { EstadoPedido } from '../pedidos/domain/pedido.entity';
import type { ICorreoAdapter, MensajeCorreo } from './icorreo.adapter';

interface DetallePedidoCorreo {
  nombreProductoSnapshot: string;
  colorSnapshot: string;
  tallaSnapshot: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

interface PedidoCorreo {
  idPedido: number;
  estado: EstadoPedido;
  subtotal: number;
  descuentoTotal: number;
  total: number;
  tipoEntrega: string;
  direccionSnapshot: string;
  detalles: DetallePedidoCorreo[];
}

interface CotizacionCorreo {
  idCotizacion: number;
  cantidad: number;
  razon: string;
  estado: EstadoCotizacion;
  nombreProductoSnapshot: string;
  colorSnapshot: string;
  tallaSnapshot: string;
  precioBaseSnapshot: number;
  precioCotizado?: number | null;
  fechaExpiracion?: Date | null;
}

@Injectable()
export class NotificacionManager {
  private readonly frontendUrl =
    process.env.FRONTEND_URL?.replace(/\/$/, '') ?? 'http://localhost:3001';

  constructor(
    @Inject('ICorreoAdapter')
    private readonly correoAdapter: ICorreoAdapter,
  ) {}

  enviarCodigoVerificacionRegistro(
    destinatario: string,
    nombre: string,
    codigo: string,
    tokenAnulacion: string,
  ): Promise<boolean> {
    const enlaceAnulacion = `${this.frontendUrl}/registro/anular?token=${encodeURIComponent(tokenAnulacion)}`;

    return this.enviar(
      destinatario,
      'Confirma tu correo para crear tu cuenta',
      `<p>Hola <strong>${this.escapar(nombre)}</strong>,</p>
       <p>Recibimos una solicitud para crear una cuenta de cliente en GamarrinTinTin con este correo.</p>
       <p>Ingresa el siguiente codigo en la pantalla de registro para confirmar tu correo:</p>
       <p style="font-size:28px;letter-spacing:6px;font-weight:bold;margin:24px 0">${this.escapar(codigo)}</p>
       <p>Este codigo tiene una duración de <strong>5 minutos</strong>.</p>
       <p>Si no solicitaste crear una cuenta, puedes anular el intento desde este enlace:</p>
       <p><a href="${this.escapar(enlaceAnulacion)}" style="color:#b91c1c">No fui yo, anular este registro</a></p>`,
    );
  }

  enviarBienvenida(destinatario: string, nombre: string): Promise<boolean> {
    const enlaceCatalogo = `${this.frontendUrl}/catalogo`;

    return this.enviar(
      destinatario,
      'Bienvenido a GamarrinTinTin',
      `<p>Estimado/a <strong>${this.escapar(nombre)}</strong>,</p>
       <p>Bienvenido a <strong>GamarrinTinTin</strong>. Tu cuenta fue creada correctamente.</p>
       <p>Desde tu cuenta podras guardar tu información para realizar pedidos, consultar tus pedidos propios y solicitar cotizaciones para prendas personalizadas o pedidos especiales.</p>
       ${this.boton(enlaceCatalogo, 'Ver catálogo de productos')}`,
    );
  }

  enviarPedidoRegistrado(
    destinatario: string,
    idPedido: number,
    total: number,
    pedido?: PedidoCorreo,
  ): Promise<boolean> {
    const enlacePedido = this.enlacePedido(idPedido);
    const resumenPedido = pedido
      ? this.resumenPedido(pedido)
      : `<p>Total: <strong>S/ ${this.formatearMonto(total)}</strong></p>`;

    return this.enviar(
      destinatario,
      `Pedido PED-${idPedido} registrado`,
      `<p>Tu pedido <strong>PED-${idPedido}</strong> fue registrado correctamente.</p>
       ${resumenPedido}
       <p>Cuando el pago sea confirmado te enviaremos una nueva actualización.</p>
       ${this.boton(enlacePedido, 'Ver mi pedido')}`,
    );
  }

  enviarEstadoPedido(
    destinatario: string,
    idPedido: number,
    estado: EstadoPedido,
    pedido?: PedidoCorreo,
  ): Promise<boolean> {
    const enlacePedido = this.enlacePedido(idPedido);
    const resumenPedido = pedido ? this.resumenPedido(pedido) : '';

    return this.enviar(
      destinatario,
      `Actualización del pedido PED-${idPedido}`,
      `<p>El estado de tu pedido <strong>PED-${idPedido}</strong> cambio a:</p>
       <p style="font-size:18px"><strong>${this.etiquetaEstado(estado)}</strong></p>
       ${resumenPedido}
       ${this.boton(enlacePedido, 'Ver detalle del pedido')}`,
    );
  }

  enviarPagoRechazado(
    destinatario: string,
    idPedido: number,
    pedido?: PedidoCorreo,
  ): Promise<boolean> {
    const resumenPedido = pedido ? this.resumenPedido(pedido) : '';

    return this.enviar(
      destinatario,
      `Pago rechazado para PED-${idPedido}`,
      `<p>No pudimos procesar el pago del pedido <strong>PED-${idPedido}</strong>.</p>
       <p>Verifica los datos del medio de pago e intentalo nuevamente.</p>
       ${resumenPedido}
       ${this.boton(this.enlacePedido(idPedido), 'Revisar pedido')}`,
    );
  }

  enviarCotizacionCreada(
    destinatario: string,
    idCotizacion: number,
    cotizacion?: CotizacionCorreo,
  ): Promise<boolean> {
    const detalleCotizacion = cotizacion ? this.resumenCotizacion(cotizacion) : '';

    return this.enviar(
      destinatario,
      `Cotizacion COT-${idCotizacion} recibida`,
      `<p>Recibimos tu solicitud <strong>COT-${idCotizacion}</strong>.</p>
       <p>Nuestro equipo revisara la solicitud y te avisara cuando tenga un precio propuesto.</p>
       ${detalleCotizacion}
       ${this.boton(this.enlaceCotizacion(idCotizacion), 'Ver mi cotización')}`,
    );
  }

  enviarEstadoCotizacion(
    destinatario: string,
    idCotizacion: number,
    estado: EstadoCotizacion,
    precioCotizado?: number | null,
    fechaExpiracion?: Date | null,
    cotizacion?: CotizacionCorreo,
  ): Promise<boolean> {
    const detalleCotizacion = cotizacion
      ? this.resumenCotizacion({
          ...cotizacion,
          estado,
          precioCotizado: precioCotizado ?? cotizacion.precioCotizado,
          fechaExpiracion: fechaExpiracion ?? cotizacion.fechaExpiracion,
        })
      : this.resumenPrecioCotizacion(precioCotizado, fechaExpiracion);

    return this.enviar(
      destinatario,
      `Actualización de la cotización COT-${idCotizacion}`,
      `<p>El estado de tu cotización <strong>COT-${idCotizacion}</strong> cambio a <strong>${this.etiquetaEstado(estado)}</strong>.</p>
       ${detalleCotizacion}
       ${this.boton(this.enlaceCotizacion(idCotizacion), 'Ver detalle de cotización')}`,
    );
  }

  enviarRecuperacionContrasena(
    destinatario: string,
    enlace: string,
  ): Promise<boolean> {
    const enlaceSeguro = this.escapar(enlace);
    return this.enviar(
      destinatario,
      'Restablece tu contraseña de GamarrinTinTin',
      `<p>Recibimos una solicitud para restablecer tu contraseña.</p>
       ${this.boton(enlaceSeguro, 'Restablecer contraseña')}
       <p>El enlace vence en una hora y solo puede utilizarse una vez.</p>
       <p>Si no realizaste esta solicitud, ignora este mensaje.</p>`,
    );
  }

  enviarContrasenaActualizada(destinatario: string): Promise<boolean> {
    return this.enviar(
      destinatario,
      'Tu contraseña fue actualizada',
      `<p>La contraseña de tu cuenta fue actualizada correctamente.</p>
       <p>Si no realizaste este cambio, comunicate inmediatamente con el administrador.</p>`,
    );
  }

  private resumenPedido(pedido: PedidoCorreo): string {
    const filas = pedido.detalles
      .map(
        (detalle) => `
          <tr>
            <td>${this.escapar(detalle.nombreProductoSnapshot)}</td>
            <td>${this.escapar(detalle.colorSnapshot)}</td>
            <td>${this.escapar(detalle.tallaSnapshot)}</td>
            <td style="text-align:right">${detalle.cantidad}</td>
            <td style="text-align:right">S/ ${this.formatearMonto(detalle.subtotal)}</td>
          </tr>`,
      )
      .join('');

    return `<p><strong>Resumen del pedido</strong></p>
      ${this.tabla(
        ['Producto', 'Color', 'Talla', 'Cantidad', 'Subtotal'],
        filas,
      )}
      <p>Tipo de entrega: <strong>${this.etiquetaEstado(pedido.tipoEntrega)}</strong></p>
      <p>Dirección: <strong>${this.escapar(pedido.direccionSnapshot)}</strong></p>
      <p>Subtotal: <strong>S/ ${this.formatearMonto(pedido.subtotal)}</strong></p>
      <p>Descuento: <strong>S/ ${this.formatearMonto(pedido.descuentoTotal)}</strong></p>
      <p>Total: <strong>S/ ${this.formatearMonto(pedido.total)}</strong></p>`;
  }

  private resumenCotizacion(cotizacion: CotizacionCorreo): string {
    const totalCotizado =
      cotizacion.precioCotizado !== null &&
      cotizacion.precioCotizado !== undefined
        ? cotizacion.precioCotizado * cotizacion.cantidad
        : null;
    const vigencia = cotizacion.fechaExpiracion
      ? `<p>Vigente hasta: <strong>${cotizacion.fechaExpiracion.toLocaleString('es-PE')}</strong></p>`
      : '';

    const filas = `
      <tr>
        <td>${this.escapar(cotizacion.nombreProductoSnapshot)}</td>
        <td>${this.escapar(cotizacion.colorSnapshot)}</td>
        <td>${this.escapar(cotizacion.tallaSnapshot)}</td>
        <td style="text-align:right">${cotizacion.cantidad}</td>
        <td style="text-align:right">S/ ${this.formatearMonto(cotizacion.precioBaseSnapshot)}</td>
        <td style="text-align:right">${
          cotizacion.precioCotizado !== null &&
          cotizacion.precioCotizado !== undefined
            ? `S/ ${this.formatearMonto(cotizacion.precioCotizado)}`
            : 'Pendiente'
        }</td>
      </tr>`;

    const total = totalCotizado
      ? `<p>Total cotizado: <strong>S/ ${this.formatearMonto(totalCotizado)}</strong></p>`
      : '';

    return `<p><strong>Detalle de la cotización</strong></p>
      ${this.tabla(
        ['Producto', 'Color', 'Talla', 'Cantidad', 'Precio base', 'Precio cotizado'],
        filas,
      )}
      <p>Motivo: <strong>${this.etiquetaEstado(cotizacion.razon)}</strong></p>
      ${total}${vigencia}`;
  }

  private resumenPrecioCotizacion(
    precioCotizado?: number | null,
    fechaExpiracion?: Date | null,
  ): string {
    const precio =
      precioCotizado !== null && precioCotizado !== undefined
        ? `<p>Precio cotizado por unidad: <strong>S/ ${this.formatearMonto(precioCotizado)}</strong></p>`
        : '';
    const vigencia = fechaExpiracion
      ? `<p>Vigente hasta: <strong>${fechaExpiracion.toLocaleString('es-PE')}</strong></p>`
      : '';
    return `${precio}${vigencia}`;
  }

  private tabla(encabezados: string[], filas: string): string {
    const th = encabezados
      .map(
        (encabezado) =>
          `<th style="text-align:left;padding:8px;border-bottom:1px solid #e4e4e7">${this.escapar(encabezado)}</th>`,
      )
      .join('');

    return `<div style="overflow-x:auto;margin:16px 0">
      <table style="width:100%;border-collapse:collapse;font-size:14px">
        <thead><tr>${th}</tr></thead>
        <tbody>${filas}</tbody>
      </table>
    </div>`;
  }

  private boton(enlace: string, texto: string): string {
    return `<p style="margin:28px 0">
      <a href="${this.escapar(enlace)}" style="display:inline-block;padding:12px 18px;background:#111827;color:#ffffff;text-decoration:none;border-radius:6px">${this.escapar(texto)}</a>
    </p>`;
  }

  private enlacePedido(idPedido: number): string {
    return `${this.frontendUrl}/mis-pedidos/${idPedido}`;
  }

  private enlaceCotizacion(idCotizacion: number): string {
    void idCotizacion;
    return `${this.frontendUrl}/mis-cotizaciones`;
  }

  private formatearMonto(monto: number): string {
    return monto.toFixed(2);
  }

  private enviar(
    destinatario: string,
    asunto: string,
    contenido: string,
  ): Promise<boolean> {
    const mensaje: MensajeCorreo = {
      destinatario,
      asunto,
      texto: this.convertirHtmlATexto(contenido),
      html: this.plantilla(contenido),
    };
    return this.correoAdapter.enviarCorreo(mensaje);
  }

  private convertirHtmlATexto(html: string): string {
    return html
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n')
      .replace(/<\/tr>/gi, '\n')
      .replace(/<\/t[dh]>/gi, ' | ')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#039;/g, "'")
      .replace(/[ \t]+\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  private plantilla(contenido: string): string {
    return `<!doctype html>
      <html lang="es">
        <body style="margin:0;background:#f4f4f5;font-family:Arial,sans-serif;color:#18181b">
          <div style="max-width:680px;margin:0 auto;padding:32px 16px">
            <div style="background:#ffffff;border:1px solid #e4e4e7;border-radius:8px;padding:28px">
              <h1 style="font-size:22px;margin:0 0 20px">GamarrinTinTin</h1>
              ${contenido}
              <hr style="border:none;border-top:1px solid #e4e4e7;margin:28px 0 16px" />
              <p style="font-size:12px;color:#71717a;margin:0">Este correo fue enviado automaticamente. Por favor, no respondas a este mensaje.</p>
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
