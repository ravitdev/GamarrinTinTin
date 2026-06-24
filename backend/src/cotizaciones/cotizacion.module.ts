import { Module } from '@nestjs/common';
import { UsuarioModule } from '../usuarios/usuario.module';
import { CotizacionController } from './cotizacion.controller';
import { CotizacionManager } from './cotizacion.manager';
import { CotizacionRepository } from './cotizacion.repository';
import { NotificacionesModule } from 'src/notificaciones/notificaciones.module';

@Module({
  imports: [UsuarioModule,NotificacionesModule],
  controllers: [CotizacionController],
  providers: [CotizacionManager, CotizacionRepository],
  exports: [CotizacionManager],
})
export class CotizacionModule {}