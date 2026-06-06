import { Module } from '@nestjs/common';
import { ContrasenaService } from './seguridad/contrasena.service';
import { JwtService } from './seguridad/jwt.service';
import { UsuarioController } from './usuario.controller';
import { UsuarioManager } from './usuario.manager';
import { UsuarioRepository } from './usuario.repository';

@Module({
  controllers: [UsuarioController],
  providers: [
    ContrasenaService,
    JwtService,
    {
      provide: 'IUsuarioRepository',
      useClass: UsuarioRepository,
    },
    UsuarioManager,
  ],
  exports: [UsuarioManager],
})
export class UsuarioModule {}
