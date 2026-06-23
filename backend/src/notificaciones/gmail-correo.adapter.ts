import { Injectable, Logger } from '@nestjs/common';
import nodemailer, { Transporter } from 'nodemailer';
import type { ICorreoAdapter, MensajeCorreo } from './icorreo.adapter';

@Injectable()
export class GmailCorreoAdapter implements ICorreoAdapter {
  private readonly logger = new Logger(GmailCorreoAdapter.name);
  private readonly habilitado = process.env.MAIL_ENABLED === 'true';
  private readonly remitente =
    process.env.MAIL_FROM?.trim() || process.env.GMAIL_USER?.trim() || '';
  private readonly transporter?: Transporter;

  constructor() {
    if (!this.habilitado) {
      this.logger.warn(
        'El envío de correos está desactivado. Configure MAIL_ENABLED=true para habilitarlo.',
      );
      return;
    }

    const usuario = process.env.GMAIL_USER?.trim();
    const contrasenaAplicacion = process.env.GMAIL_APP_PASSWORD?.replace(
      /\s/g,
      '',
    );

    if (!usuario || !contrasenaAplicacion) {
      throw new Error(
        'GMAIL_USER y GMAIL_APP_PASSWORD son obligatorios cuando MAIL_ENABLED=true.',
      );
    }

    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 15_000,
      auth: {
        user: usuario,
        pass: contrasenaAplicacion,
      },
    });
  }

  async enviarCorreo(mensaje: MensajeCorreo): Promise<boolean> {
    if (!this.habilitado || !this.transporter) {
      this.logger.log(
        `[Correo desactivado] ${mensaje.asunto} -> ${mensaje.destinatario}`,
      );
      return false;
    }

    try {
      await this.transporter.sendMail({
        from: this.remitente,
        to: mensaje.destinatario,
        subject: mensaje.asunto,
        html: mensaje.html,
      });
      return true;
    } catch (error: unknown) {
      const detalle =
        error instanceof Error ? error.message : 'Error desconocido';
      this.logger.error(
        `No se pudo enviar el correo a ${mensaje.destinatario}: ${detalle}`,
      );
      return false;
    }
  }
}
