import { Module } from '@nestjs/common';
import { EmailService } from './email/email.service';
import { NotificacionesService } from './notificaciones.service';

@Module({
  providers: [EmailService, NotificacionesService],
  exports: [NotificacionesService],
})
export class NotificacionesModule {}