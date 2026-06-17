import { Usuario, RolUsuario } from './domain/usuario.entity';
import {
  SolicitudCambioDocumento,
  SolicitudDesactivacion,
} from './domain/solicitud.entity';
import { IUsuarioRepository } from './iusuario.repository';
import { ContrasenaService } from './seguridad/contrasena.service';
import { JwtService } from './seguridad/jwt.service';
import { UsuarioManager } from './usuario.manager';

class UsuarioRepositoryFake implements IUsuarioRepository {
  private usuarios: Usuario[];
  private refreshTokens = new Map<
    number,
    { refreshTokenHash: string; fechaExpiracion: Date }
  >();

  constructor(private readonly contrasenaService: ContrasenaService) {
    const fechaRegistro = new Date('2026-06-01T00:00:00.000Z');
    this.usuarios = [
      new Usuario(
        1,
        'Cliente',
        'Demo',
        'cliente@gamarrintintin.com',
        this.contrasenaService.generarHash('Cliente123'),
        '999111222',
        fechaRegistro,
        'DNI',
        '70000001',
        'Lima',
        'CLIENTE',
        'ACTIVO',
      ),
      new Usuario(
        2,
        'Cuenta',
        'Inactiva',
        'inactivo@gamarrintintin.com',
        this.contrasenaService.generarHash('Inactivo123'),
        '999444555',
        fechaRegistro,
        'DNI',
        '70000004',
        'Lima',
        'CLIENTE',
        'INACTIVO',
      ),
    ];
  }

  async listarPedidosResumenPorCliente(): Promise<any[]> {
    return [];
  }

  async guardar(usuario: Usuario): Promise<Usuario> {
    const idUsuario =
      Math.max(
        ...this.usuarios.map((usuarioActual) => usuarioActual.idUsuario),
      ) + 1;
    const usuarioGuardado = new Usuario(
      idUsuario,
      usuario.nombres,
      usuario.apellidos,
      usuario.email,
      usuario.contrasenaHash,
      usuario.telefono,
      usuario.fechaRegistro,
      usuario.tipoDocumento,
      usuario.numeroDocumento,
      usuario.direccion,
      usuario.rol,
      usuario.estado,
    );

    this.usuarios.push(usuarioGuardado);
    return usuarioGuardado;
  }

  async actualizar(usuario: Usuario): Promise<boolean> {
    const index = this.usuarios.findIndex(
      (usuarioActual) => usuarioActual.idUsuario === usuario.idUsuario,
    );

    if (index === -1) return false;

    this.usuarios[index] = usuario;
    return true;
  }

  async desactivar(idUsuario: number): Promise<boolean> {
    const usuario = await this.buscarPorId(idUsuario);
    if (!usuario) return false;
    usuario.estado = 'INACTIVO';
    return true;
  }

  async reactivar(idUsuario: number): Promise<boolean> {
    const usuario = this.usuarios.find((item) => item.idUsuario === idUsuario);
    if (!usuario) return false;

    usuario.estado = 'ACTIVO';
    return true;
  }

  async buscarPorId(idUsuario: number): Promise<Usuario | null> {
    return (
      this.usuarios.find((usuario) => usuario.idUsuario === idUsuario) ?? null
    );
  }

  async buscarPorEmail(email: string): Promise<Usuario | null> {
    return (
      this.usuarios.find(
        (usuario) => usuario.email.toLowerCase() === email.toLowerCase(),
      ) ?? null
    );
  }

  async existePorEmail(email: string): Promise<boolean> {
    return (await this.buscarPorEmail(email)) !== null;
  }

  async existePorDocumento(numeroDocumento: string): Promise<boolean> {
    return this.usuarios.some(
      (usuario) => usuario.numeroDocumento === numeroDocumento,
    );
  }

  async listarUsuarios(): Promise<Usuario[]> {
    return [...this.usuarios];
  }

  async listarPorRol(rol: RolUsuario): Promise<Usuario[]> {
    return this.usuarios.filter((usuario) => usuario.rol === rol);
  }

  async contarPedidosEnProceso(_idCliente: number): Promise<number> {
    return 0;
  }

  async crearSolicitudCambioDocumento(
    solicitud: SolicitudCambioDocumento,
  ): Promise<SolicitudCambioDocumento> {
    return new SolicitudCambioDocumento(
      1,
      solicitud.idUsuario,
      solicitud.tipoDocumento,
      solicitud.numeroDocumento,
      solicitud.estado,
      solicitud.fechaSolicitud,
    );
  }

  async buscarSolicitudCambioDocumentoPendiente(): Promise<SolicitudCambioDocumento | null> {
    return null;
  }

  async listarSolicitudesCambioDocumentoPendientes(): Promise<
    Array<SolicitudCambioDocumento & { usuario: Usuario }>
  > {
    return [];
  }

  async resolverSolicitudCambioDocumento(
    idSolicitud: number,
    estado: 'APROBADA' | 'RECHAZADA',
    idAdmin: number,
  ): Promise<SolicitudCambioDocumento | null> {
    return new SolicitudCambioDocumento(
      idSolicitud,
      1,
      'DNI',
      '70000002',
      estado,
      new Date(),
      new Date(),
      idAdmin,
    );
  }

  async crearSolicitudDesactivacion(
    solicitud: SolicitudDesactivacion,
  ): Promise<SolicitudDesactivacion> {
    return new SolicitudDesactivacion(
      1,
      solicitud.idUsuario,
      solicitud.estado,
      solicitud.fechaSolicitud,
    );
  }

  async buscarSolicitudDesactivacionPendiente(): Promise<SolicitudDesactivacion | null> {
    return null;
  }

  async listarSolicitudesDesactivacionPendientes(): Promise<
    Array<SolicitudDesactivacion & { usuario: Usuario }>
  > {
    return [];
  }

  async resolverSolicitudDesactivacion(
    idSolicitud: number,
    estado: 'PROCESADA' | 'RECHAZADA',
    idAdmin: number,
  ): Promise<SolicitudDesactivacion | null> {
    return new SolicitudDesactivacion(
      idSolicitud,
      1,
      estado,
      new Date(),
      new Date(),
      idAdmin,
    );
  }

  async guardarRefreshToken(
    idUsuario: number,
    refreshTokenHash: string,
    fechaExpiracion: Date,
  ): Promise<boolean> {
    this.refreshTokens.set(idUsuario, { refreshTokenHash, fechaExpiracion });
    return true;
  }

  async obtenerRefreshToken(
    idUsuario: number,
  ): Promise<{ refreshTokenHash: string; fechaExpiracion: Date } | null> {
    return this.refreshTokens.get(idUsuario) ?? null;
  }

  async revocarRefreshToken(idUsuario: number): Promise<boolean> {
    return this.refreshTokens.delete(idUsuario);
  }
}

describe('UsuarioManager', () => {
  let manager: UsuarioManager;

  beforeEach(() => {
    const contrasenaService = new ContrasenaService();
    const repository = new UsuarioRepositoryFake(contrasenaService);
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
    expect(sesion.refreshToken.split('.')).toHaveLength(3);
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

  it('registra cuenta de cliente con contraseña cifrada', async () => {
    const usuario = await manager.registrarCuentaCliente({
      nombres: 'Nuevo',
      apellidos: 'Cliente',
      email: 'nuevo.cliente@gamarrintintin.com',
      contrasena: 'Cliente456',
      telefono: '988777666',
      tipoDocumento: 'DNI',
      numeroDocumento: '70000005',
      direccion: 'Lima',
    });

    const sesion = await manager.iniciarSesion({
      email: 'nuevo.cliente@gamarrintintin.com',
      contrasena: 'Cliente456',
    });

    expect(usuario.idUsuario).toBe(3);
    expect(usuario.rol).toBe('CLIENTE');
    expect(usuario.estado).toBe('ACTIVO');
    expect(usuario.contrasenaHash).not.toBe('Cliente456');
    expect(sesion.usuario.email).toBe('nuevo.cliente@gamarrintintin.com');
  });

  it('rechaza registro con email inválido', async () => {
    await expect(
      manager.registrarCuentaCliente({
        nombres: 'Nuevo',
        apellidos: 'Cliente',
        email: 'correo-invalido',
        contrasena: 'Cliente456',
        telefono: '988777666',
        tipoDocumento: 'DNI',
        numeroDocumento: '70000005',
        direccion: 'Lima',
      }),
    ).rejects.toThrow('El email no tiene un formato válido.');
  });

  it('rechaza registro con teléfono inválido', async () => {
    await expect(
      manager.registrarCuentaCliente({
        nombres: 'Nuevo',
        apellidos: 'Cliente',
        email: 'telefono.invalido@gamarrintintin.com',
        contrasena: 'Cliente456',
        telefono: '98877',
        tipoDocumento: 'DNI',
        numeroDocumento: '70000005',
        direccion: 'Lima',
      }),
    ).rejects.toThrow('El teléfono debe tener 9 dígitos.');
  });

  it('rechaza registro con teléfono que no empieza con 9', async () => {
    await expect(
      manager.registrarCuentaCliente({
        nombres: 'Nuevo',
        apellidos: 'Cliente',
        email: 'telefono.inicio.invalido@gamarrintintin.com',
        contrasena: 'Cliente456',
        telefono: '888777666',
        tipoDocumento: 'DNI',
        numeroDocumento: '70000005',
        direccion: 'Lima',
      }),
    ).rejects.toThrow('El teléfono debe empezar con 9.');
  });

  it('rechaza registro con documento inválido según tipo', async () => {
    await expect(
      manager.registrarCuentaCliente({
        nombres: 'Nuevo',
        apellidos: 'Cliente',
        email: 'documento.invalido@gamarrintintin.com',
        contrasena: 'Cliente456',
        telefono: '988777666',
        tipoDocumento: 'RUC',
        numeroDocumento: '70000005',
        direccion: 'Lima',
      }),
    ).rejects.toThrow('El RUC debe tener 11 dígitos.');
  });

  it('rechaza registro con RUC que no empieza con 10 o 20', async () => {
    await expect(
      manager.registrarCuentaCliente({
        nombres: 'Nuevo',
        apellidos: 'Cliente',
        email: 'ruc.inicio.invalido@gamarrintintin.com',
        contrasena: 'Cliente456',
        telefono: '988777666',
        tipoDocumento: 'RUC',
        numeroDocumento: '30123456789',
        direccion: 'Lima',
      }),
    ).rejects.toThrow('El RUC debe empezar con 10 o 20.');
  });

  it('registra usuario vendedor', async () => {
    const usuario = await manager.registrarUsuarioVendedor({
      nombres: 'Nuevo',
      apellidos: 'Vendedor',
      email: 'nuevo.vendedor@gamarrintintin.com',
      contrasena: 'Vendedor456',
      telefono: '977666555',
      tipoDocumento: 'DNI',
      numeroDocumento: '70000006',
      direccion: 'Gamarra',
    });

    expect(usuario.idUsuario).toBe(3);
    expect(usuario.rol).toBe('VENDEDOR');
    expect(usuario.estado).toBe('ACTIVO');
  });

  it('rechaza solicitud de cambio de documento RUC para vendedor', async () => {
    const vendedor = await manager.registrarUsuarioVendedor({
      nombres: 'Nuevo',
      apellidos: 'Vendedor',
      email: 'vendedor.documento@gamarrintintin.com',
      contrasena: 'Vendedor456',
      telefono: '977666555',
      tipoDocumento: 'DNI',
      numeroDocumento: '70000006',
      direccion: 'Gamarra',
    });

    await expect(
      manager.solicitarCambioDocumento(vendedor.idUsuario, {
        tipoDocumento: 'RUC',
        numeroDocumento: '20123456789',
      }),
    ).rejects.toThrow('Los vendedores solo pueden solicitar cambio de DNI.');
  });

  it('renueva sesión con refresh token y lo rota', async () => {
    const sesionInicial = await manager.iniciarSesion({
      email: 'cliente@gamarrintintin.com',
      contrasena: 'Cliente123',
    });

    const sesionRenovada = await manager.refrescarSesion({
      refreshToken: sesionInicial.refreshToken,
    });

    expect(sesionRenovada.accessToken.split('.')).toHaveLength(3);
    expect(sesionRenovada.refreshToken.split('.')).toHaveLength(3);
    expect(sesionRenovada.usuario.idUsuario).toBe(1);

    await expect(
      manager.refrescarSesion({
        refreshToken: sesionInicial.refreshToken,
      }),
    ).rejects.toThrow('Refresh token inválido o expirado.');
  });

  it('revoca refresh token al cerrar sesión', async () => {
    const sesion = await manager.iniciarSesion({
      email: 'cliente@gamarrintintin.com',
      contrasena: 'Cliente123',
    });

    await manager.cerrarSesion(1);

    await expect(
      manager.refrescarSesion({
        refreshToken: sesion.refreshToken,
      }),
    ).rejects.toThrow('Refresh token inválido o expirado.');
  });

  it('reactiva una cuenta inactiva', async () => {
    const resultado = await manager.procesarReactivacionCuenta(2);

    expect(resultado).toBe(true);

    const sesion = await manager.iniciarSesion({
      email: 'inactivo@gamarrintintin.com',
      contrasena: 'Inactivo123',
    });

    expect(sesion.usuario.email).toBe('inactivo@gamarrintintin.com');
  });
});
