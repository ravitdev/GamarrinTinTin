import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { IUsuarioRepository } from '../iusuario.repository';
import { JwtService } from './jwt.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    @Inject('IUsuarioRepository')
    private readonly usuarioRepository: IUsuarioRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authorization = request.headers?.authorization;

    if (!authorization || typeof authorization !== 'string') {
      throw new UnauthorizedException('Token de acceso requerido.');
    }

    const [tipo, token] = authorization.split(' ');

    if (tipo !== 'Bearer' || !token) {
      throw new UnauthorizedException('Formato de token inválido.');
    }

    const payload = this.jwtService.verificar(token);

    if (!payload || payload.tipo !== 'access') {
      throw new UnauthorizedException('Token inválido o expirado.');
    }

    const usuario = await this.usuarioRepository.buscarPorId(payload.sub);

    if (!usuario) {
      throw new UnauthorizedException('Usuario no autorizado.');
    }

    if (!usuario.estaActivo()) {
      throw new UnauthorizedException('La cuenta no está disponible.');
    }

    request.usuario = {
      idUsuario: usuario.idUsuario,
      email: usuario.email,
      rol: usuario.rol,
    };

    return true;
  }
}
