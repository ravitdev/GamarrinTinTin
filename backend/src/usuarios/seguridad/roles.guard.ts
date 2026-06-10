import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './auth.decorators';
import { UsuarioAutenticado } from './usuario-autenticado.interface';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const rolesRequeridos = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!rolesRequeridos || rolesRequeridos.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const usuario = request.usuario as UsuarioAutenticado | undefined;

    if (!usuario || !rolesRequeridos.includes(usuario.rol)) {
      throw new ForbiddenException(
        'No tiene permisos para realizar esta acción.',
      );
    }

    return true;
  }
}
