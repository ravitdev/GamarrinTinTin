import { Injectable } from '@nestjs/common';
import { createHmac, randomBytes } from 'node:crypto';
import { RolUsuario } from '../domain/usuario.entity';

export interface JwtPayload {
  sub: number;
  email: string;
  rol: RolUsuario;
  tipo: 'access' | 'refresh';
  jti: string;
  iat: number;
  exp: number;
}

@Injectable()
export class JwtService {
  private readonly secreto =
    process.env.JWT_SECRET ?? 'gamarrintintin-dev-secret';
  private readonly duracionAccessTokenSegundos = 60 * 60;
  private readonly duracionRefreshTokenSegundos = 60 * 60 * 24 * 7;

  firmarAccessToken(
    payloadBase: Omit<JwtPayload, 'iat' | 'exp' | 'tipo' | 'jti'>,
  ): string {
    return this.firmar(payloadBase, 'access', this.duracionAccessTokenSegundos);
  }

  firmarRefreshToken(
    payloadBase: Omit<JwtPayload, 'iat' | 'exp' | 'tipo' | 'jti'>,
  ): string {
    return this.firmar(
      payloadBase,
      'refresh',
      this.duracionRefreshTokenSegundos,
    );
  }

  obtenerFechaExpiracionRefreshToken(): Date {
    return new Date(Date.now() + this.duracionRefreshTokenSegundos * 1000);
  }

  private firmar(
    payloadBase: Omit<JwtPayload, 'iat' | 'exp' | 'tipo' | 'jti'>,
    tipo: JwtPayload['tipo'],
    duracionSegundos: number,
  ): string {
    const ahora = Math.floor(Date.now() / 1000);
    const header = { alg: 'HS256', typ: 'JWT' };
    const payload: JwtPayload = {
      ...payloadBase,
      tipo,
      jti: randomBytes(16).toString('hex'),
      iat: ahora,
      exp: ahora + duracionSegundos,
    };

    const headerBase64 = this.base64Url(JSON.stringify(header));
    const payloadBase64 = this.base64Url(JSON.stringify(payload));
    const firma = createHmac('sha256', this.secreto)
      .update(`${headerBase64}.${payloadBase64}`)
      .digest('base64url');

    return `${headerBase64}.${payloadBase64}.${firma}`;
  }

  verificar(token: string): JwtPayload | null {
    const [headerBase64, payloadBase64, firma] = token.split('.');

    if (!headerBase64 || !payloadBase64 || !firma) {
      return null;
    }

    const firmaEsperada = createHmac('sha256', this.secreto)
      .update(`${headerBase64}.${payloadBase64}`)
      .digest('base64url');

    if (firma !== firmaEsperada) {
      return null;
    }

    try {
      const payload = JSON.parse(
        Buffer.from(payloadBase64, 'base64url').toString('utf8'),
      ) as JwtPayload;
      const ahora = Math.floor(Date.now() / 1000);

      if (
        !payload.sub ||
        !payload.email ||
        !payload.rol ||
        !payload.jti ||
        payload.exp < ahora
      ) {
        return null;
      }

      return payload;
    } catch {
      return null;
    }
  }

  private base64Url(valor: string): string {
    return Buffer.from(valor).toString('base64url');
  }
}
