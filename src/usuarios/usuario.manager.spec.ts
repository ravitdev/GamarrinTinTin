import { ContrasenaService } from './seguridad/contrasena.service';
import { JwtService } from './seguridad/jwt.service';
import { UsuarioManager } from './usuario.manager';
import { UsuarioRepository } from './usuario.repository';

describe('UsuarioManager', () => {
  let manager: UsuarioManager;

  beforeEach(() => {
    const contrasenaService = new ContrasenaService();
    const repository = new UsuarioRepository(contrasenaService);
    manager = new UsuarioManager(
      repository,
      contrasenaService,
      new JwtService(),
    );
  });

  it('inicia sesión con credenciales válidas e identifica el rol', async () => {
    const sesion = await manager.iniciarSesion({
      email: 'cliente@gamarrintintin.com',
      contrasena: 'Cliente123',
    });

    expect(sesion.accessToken.split('.')).toHaveLength(3);
    expect(sesion.usuario).toEqual({
      idUsuario: 1,
      nombres: 'Cliente',
      apellidos: 'Demo',
      email: 'cliente@gamarrintintin.com',
      rol: 'CLIENTE',
    });
  });

  it('rechaza credenciales inválidas con mensaje genérico', async () => {
    await expect(
      manager.iniciarSesion({
        email: 'cliente@gamarrintintin.com',
        contrasena: 'incorrecta',
      }),
    ).rejects.toThrow('Credenciales inválidas.');
  });

  it('rechaza cuentas inactivas', async () => {
    await expect(
      manager.iniciarSesion({
        email: 'inactivo@gamarrintintin.com',
        contrasena: 'Inactivo123',
      }),
    ).rejects.toThrow('La cuenta no está disponible.');
  });
});
