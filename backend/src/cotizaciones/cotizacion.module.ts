import { Module } from '@nestjs/common';
import { UsuarioModule } from '../usuarios/usuario.module';
import { CotizacionController } from './cotizacion.controller';
import { CotizacionExpiracionService } from './cotizacion-expiracion.service';
import { CotizacionManager } from './cotizacion.manager';
import { CotizacionRepository } from './cotizacion.repository';

@Module({
  imports: [UsuarioModule],
  controllers: [CotizacionController],
  providers: [
    {
      provide: 'ICotizacionRepository',
      useClass: CotizacionRepository,
    },
    CotizacionManager,
    CotizacionExpiracionService,
  ],
  exports: [CotizacionManager],
})
export class CotizacionModule {}
