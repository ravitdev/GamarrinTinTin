import { Injectable } from '@nestjs/common';
import { createHmac } from 'node:crypto';
import { RolUsuario } from '../domain/usuario.entity';

interface JwtPayload {
  sub: number;
  email: string;
  rol: RolUsuario;
  iat: number;
  exp: number;
}

@Injectable()
export class JwtService {
  private readonly secreto =
    process.env.JWT_SECRET ?? 'gamarrintintin-dev-secret';
  private readonly duracionSegundos = 60 * 60;

  firmar(payloadBase: Omit<JwtPayload, 'iat' | 'exp'>): string {
    const ahora = Math.floor(Date.now() / 1000);
    const header = { alg: 'HS256', typ: 'JWT' };
    const payload: JwtPayload = {
      ...payloadBase,
      iat: ahora,
      exp: ahora + this.duracionSegundos,
    };

    const headerBase64 = this.base64Url(JSON.stringify(header));
    const payloadBase64 = this.base64Url(JSON.stringify(payload));
    const firma = createHmac('sha256', this.secreto)
      .update(`${headerBase64}.${payloadBase64}`)
      .digest('base64url');

    return `${headerBase64}.${payloadBase64}.${firma}`;
  }

  private base64Url(valor: string): string {
    return Buffer.from(valor).toString('base64url');
  }
}
