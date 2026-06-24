import { Module } from '@nestjs/common';
import { UsuarioModule } from '../usuarios/usuario.module';
import { CotizacionController } from './cotizacion.controller';
import { CotizacionManager } from './cotizacion.manager';
import { CotizacionRepository } from './cotizacion.repository';
import { CotizacionScheduler } from './cotizacion.scheduler';
import { NotificacionesModule } from 'src/notificaciones/notificaciones.module';

@Module({
  imports: [UsuarioModule, NotificacionesModule],
  controllers: [CotizacionController],
  providers: [CotizacionManager, CotizacionRepository, CotizacionScheduler],
  exports: [CotizacionManager],
})
export class CotizacionModule {}