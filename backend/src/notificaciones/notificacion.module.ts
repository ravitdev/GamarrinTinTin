import { Global, Module } from '@nestjs/common';
import { GmailCorreoAdapter } from './gmail-correo.adapter';
import { NotificacionManager } from './notificacion.manager';

@Global()
@Module({
  providers: [
    {
      provide: 'ICorreoAdapter',
      useClass: GmailCorreoAdapter,
    },
    NotificacionManager,
  ],
  exports: ['ICorreoAdapter', NotificacionManager],
})
export class NotificacionModule {}
