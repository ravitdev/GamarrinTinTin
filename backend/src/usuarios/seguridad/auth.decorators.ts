import {
  createParamDecorator,
  ExecutionContext,
  SetMetadata,
} from '@nestjs/common';
import { RolUsuario } from '../domain/usuario.entity';

export const ROLES_KEY = 'roles';

export const Roles = (...roles: RolUsuario[]) => SetMetadata(ROLES_KEY, roles);

export const UsuarioActual = createParamDecorator(
  (_data: unknown, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest();
    return request.usuario;
  },
);
