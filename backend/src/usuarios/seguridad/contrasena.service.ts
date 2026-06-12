import { Injectable } from '@nestjs/common';
import { pbkdf2Sync, randomBytes, timingSafeEqual } from 'node:crypto';

@Injectable()
export class ContrasenaService {
  private readonly iteraciones = 120000;
  private readonly longitudLlave = 32;
  private readonly algoritmoDigest = 'sha256';

  generarHash(contrasena: string): string {
    const salt = randomBytes(16).toString('hex');
    const hash = pbkdf2Sync(
      contrasena,
      salt,
      this.iteraciones,
      this.longitudLlave,
      this.algoritmoDigest,
    ).toString('hex');

    return `${this.iteraciones}:${salt}:${hash}`;
  }

  verificar(contrasena: string, contrasenaHash: string): boolean {
    const [iteracionesTexto, salt, hashGuardado] = contrasenaHash.split(':');
    const iteraciones = Number(iteracionesTexto);

    if (!iteraciones || !salt || !hashGuardado) {
      return false;
    }

    const hashCalculado = pbkdf2Sync(
      contrasena,
      salt,
      iteraciones,
      this.longitudLlave,
      this.algoritmoDigest,
    );
    const hashGuardadoBuffer = Buffer.from(hashGuardado, 'hex');

    return (
      hashCalculado.length === hashGuardadoBuffer.length &&
      timingSafeEqual(hashCalculado, hashGuardadoBuffer)
    );
  }
}
