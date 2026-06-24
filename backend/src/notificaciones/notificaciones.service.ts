import { Injectable } from '@nestjs/common';
import { EmailService } from './email/email.service';

@Injectable()
export class NotificacionesService {
  constructor(private readonly emailService: EmailService) {}

  async enviarRecuperacionContrasena(params: {
    email: string;
    nombres: string;
    resetUrl: string;
  }): Promise<void> {
    await this.emailService.sendEmail({
      to: params.email,
      subject: 'Recupera tu contraseña - GamarrinTinTin',
      text: `Hola ${params.nombres}. Ingresa al siguiente enlace para restablecer tu contraseña: ${params.resetUrl}`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h2>Recuperación de contraseña</h2>
          <p>Hola ${params.nombres},</p>
          <p>Recibimos una solicitud para restablecer tu contraseña.</p>
          <p>
            <a href="${params.resetUrl}" style="display:inline-block;padding:10px 16px;background:#111;color:#fff;text-decoration:none;border-radius:6px;">
              Restablecer contraseña
            </a>
          </p>
          <p>Este enlace vence en 30 minutos.</p>
          <p>Si no solicitaste este cambio, puedes ignorar este mensaje.</p>
        </div>
      `,
    });
  }

  async enviarCotizacionRespondida(params: {
    email: string;
    nombres: string;
    codigoCotizacion: string;
    precioCotizado: number;
  }): Promise<void> {
    await this.emailService.sendEmail({
      to: params.email,
      subject: `Tu cotización ${params.codigoCotizacion} fue respondida`,
      text: `Hola ${params.nombres}. Tu cotización ${params.codigoCotizacion} fue respondida con precio final S/ ${params.precioCotizado.toFixed(2)}.`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h2>Cotización respondida</h2>
          <p>Hola ${params.nombres},</p>
          <p>Tu cotización <strong>${params.codigoCotizacion}</strong> fue respondida.</p>
          <p>Precio final cotizado: <strong>S/ ${params.precioCotizado.toFixed(2)}</strong></p>
          <p>Ingresa a tu cuenta para revisar el detalle.</p>
        </div>
      `,
    });
  }

  async enviarEstadoPedidoActualizado(params: {
    email: string;
    nombres: string;
    codigoPedido: string;
    estado: string;
  }): Promise<void> {
    await this.emailService.sendEmail({
      to: params.email,
      subject: `Actualización de tu pedido ${params.codigoPedido}`,
      text: `Hola ${params.nombres}. Tu pedido ${params.codigoPedido} cambió al estado ${params.estado}.`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h2>Estado de pedido actualizado</h2>
          <p>Hola ${params.nombres},</p>
          <p>Tu pedido <strong>${params.codigoPedido}</strong> cambió de estado.</p>
          <p>Nuevo estado: <strong>${params.estado}</strong></p>
          <p>Ingresa a tu cuenta para revisar el detalle.</p>
        </div>
      `,
    });
  }
}