import { Usuario } from './domain/usuario.entity';
import type { IUsuarioRepository } from './iusuario.repository';
import type {
  ICorreoAdapter,
  MensajeCorreo,
} from '../notificaciones/icorreo.adapter';
import { NotificacionManager } from '../notificaciones/notificacion.manager';
import { ContrasenaService } from './seguridad/contrasena.service';
import { JwtService } from './seguridad/jwt.service';
import { UsuarioManager } from './usuario.manager';

describe('Recuperación de contraseña', () => {
  it('guarda el hash del token y lo consume una sola vez', async () => {
    const contrasenaService = new ContrasenaService();
    const usuario = new Usuario(
      1,
      'Cliente',
      'Prueba',
      'cliente@example.com',
      contrasenaService.generarHash('Anterior123'),
      '999888777',
      new Date(),
      'DNI',
      '70000001',
      'Lima',
      'CLIENTE',
      'ACTIVO',
    );
    let tokenGuardado:
      | {
          idToken: number;
          idUsuario: number;
          tokenHash: string;
          fechaExpiracion: Date;
          usado: boolean;
        }
      | undefined;
    let mensaje: MensajeCorreo | undefined;

    const repository = {
      buscarPorEmail: (email: string) =>
        Promise.resolve(email === usuario.email ? usuario : null),
      buscarPorId: (idUsuario: number) =>
        Promise.resolve(idUsuario === usuario.idUsuario ? usuario : null),
      guardarTokenRecuperacion: (
        idUsuario: number,
        tokenHash: string,
        fechaExpiracion: Date,
      ) => {
        tokenGuardado = {
          idToken: 1,
          idUsuario,
          tokenHash,
          fechaExpiracion,
          usado: false,
        };
        return Promise.resolve(true);
      },
      obtenerTokenRecuperacion: (tokenHash: string) =>
        Promise.resolve(
          tokenGuardado &&
            !tokenGuardado.usado &&
            tokenGuardado.tokenHash === tokenHash
            ? {
                idToken: tokenGuardado.idToken,
                idUsuario: tokenGuardado.idUsuario,
                fechaExpiracion: tokenGuardado.fechaExpiracion,
              }
            : null,
        ),
      consumirTokenRecuperacion: (
        _idToken: number,
        _idUsuario: number,
        contrasenaHash: string,
      ) => {
        if (!tokenGuardado || tokenGuardado.usado) {
          throw new Error('Token usado.');
        }
        tokenGuardado.usado = true;
        usuario.contrasenaHash = contrasenaHash;
        return Promise.resolve(true);
      },
    } as IUsuarioRepository;
    const correoAdapter: ICorreoAdapter = {
      enviarCorreo: (correo) => {
        mensaje = correo;
        return Promise.resolve(true);
      },
    };
    const manager = new UsuarioManager(
      repository,
      contrasenaService,
      new JwtService(),
      new NotificacionManager(correoAdapter),
    );

    await manager.recuperarContrasena(usuario.email);

    const enlace = mensaje?.html.match(/token=([a-f0-9]+)/)?.[1];
    expect(enlace).toBeDefined();
    expect(tokenGuardado?.tokenHash).not.toBe(enlace);

    await manager.restablecerContrasena(enlace!, 'NuevaClave123');
    expect(
      contrasenaService.verificar('NuevaClave123', usuario.contrasenaHash),
    ).toBe(true);

    await expect(
      manager.restablecerContrasena(enlace!, 'OtraClave123'),
    ).rejects.toThrow('El enlace de recuperación no es válido o ha expirado.');
  });
});
