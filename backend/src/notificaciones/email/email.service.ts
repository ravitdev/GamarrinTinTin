import { Injectable, Logger } from '@nestjs/common';
import nodemailer from 'nodemailer';

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  async sendEmail(input: SendEmailInput): Promise<void> {
    const mailEnabled = process.env.MAIL_ENABLED === 'true';

    if (!mailEnabled) {
      this.logger.log(`[MAIL_DISABLED] To: ${input.to}`);
      this.logger.log(`[MAIL_DISABLED] Subject: ${input.subject}`);
      this.logger.log(`[MAIL_DISABLED] Text: ${input.text ?? 'Sin texto plano'}`);
      this.logger.log(`[MAIL_DISABLED] HTML: ${input.html}`);
      return;
    }

    const host = process.env.MAIL_HOST;
    const port = Number(process.env.MAIL_PORT ?? 587);
    const user = process.env.MAIL_USER;
    const pass = process.env.MAIL_PASSWORD;
    const from = process.env.MAIL_FROM;

    if (!host || !user || !pass || !from) {
      throw new Error('Configuración SMTP incompleta.');
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user,
        pass,
      },
    });

    await transporter.sendMail({
      from,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
    });
  }
}