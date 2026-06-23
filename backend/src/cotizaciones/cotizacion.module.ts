import { Module } from '@nestjs/common';
import { UsuarioModule } from '../usuarios/usuario.module';
import { CotizacionController } from './cotizacion.controller';
import { CotizacionManager } from './cotizacion.manager';
import { CotizacionRepository } from './cotizacion.repository';

@Module({
  imports: [UsuarioModule],
  controllers: [CotizacionController],
  providers: [CotizacionManager, CotizacionRepository],
  exports: [CotizacionManager],
})
export class CotizacionModule {}