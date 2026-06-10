import { Module } from '@nestjs/common';
import { UsuarioModule } from '../usuarios/usuario.module';
import { PedidoController } from './pedido.controller';
import { PedidoManager } from './pedido.manager';
import { PedidoRepository } from './pedido.repository';

@Module({
  imports: [UsuarioModule],
  controllers: [PedidoController],
  providers: [
    {
      provide: 'IPedidoRepository',
      useClass: PedidoRepository,
    },
    PedidoManager,
  ],
  exports: [PedidoManager],
})
export class PedidoModule {}
