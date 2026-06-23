import { Module } from '@nestjs/common';
import { UsuarioModule } from '../usuarios/usuario.module';
import { DisenoPredefinidoController } from './diseno-predefinido.controller';
import { DisenoPredefinidoManager } from './diseno-predefinido.manager';
import { DisenoPredefinidoRepository } from './diseno-predefinido.repository';

@Module({
  imports: [UsuarioModule],
  controllers: [DisenoPredefinidoController],
  providers: [DisenoPredefinidoManager, DisenoPredefinidoRepository],
  exports: [DisenoPredefinidoManager],
})
export class DisenoPredefinidoModule {}