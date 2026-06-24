import { Module } from '@nestjs/common';
import { ContrasenaService } from './seguridad/contrasena.service';
import { JwtAuthGuard } from './seguridad/jwt-auth.guard';
import { JwtService } from './seguridad/jwt.service';
import { RolesGuard } from './seguridad/roles.guard';
import { UsuarioController } from './usuario.controller';
import { UsuarioManager } from './usuario.manager';
import { UsuarioRepository } from './usuario.repository';
import { NotificacionesModule } from '../notificaciones/notificaciones.module';

@Module({
  imports: [NotificacionesModule],
  controllers: [UsuarioController],
  providers: [
    ContrasenaService,
    JwtService,
    {
      provide: 'IUsuarioRepository',
      useClass: UsuarioRepository,
    },
    UsuarioManager,
    JwtAuthGuard,
    RolesGuard,
  ],
  exports: [
    'IUsuarioRepository',
    UsuarioManager,
    JwtService,
    JwtAuthGuard,
    RolesGuard,
  ],
})
export class UsuarioModule {}
