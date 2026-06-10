import { Inject, Injectable } from '@nestjs/common';
import type { IniciarSesionDto } from './dto/iniciar-sesion.dto';
import type { RefreshTokenDto } from './dto/refresh-token.dto';
import type { RegistrarClienteDto } from './dto/registrar-cliente.dto';
import type { RegistrarVendedorDto } from './dto/registrar-vendedor.dto';
import type { SesionDto } from './dto/sesion.dto';
import { Usuario } from './domain/usuario.entity';
import type { IUsuarioRepository } from './iusuario.repository';
import { ContrasenaService } from './seguridad/contrasena.service';
import { JwtService } from './seguridad/jwt.service';
import { UsuarioMapper } from './usuario.mapper';

@Injectable()
export class UsuarioManager {
  constructor(
    @Inject('IUsuarioRepository')
    private readonly usuarioRepository: IUsuarioRepository,
    private readonly contrasenaService: ContrasenaService,
    private readonly jwtService: JwtService,
  ) {}

  async iniciarSesion(credenciales: IniciarSesionDto): Promise<SesionDto> {
    const email = credenciales.email?.trim();
    const contrasena = credenciales.contrasena;

    if (!email || !contrasena) {
      throw new Error('Debe ingresar email y contraseña.');
    }

    const usuario = await this.usuarioRepository.buscarPorEmail(email);

    if (
      !usuario ||
      !this.contrasenaService.verificar(contrasena, usuario.contrasenaHash)
    ) {
      throw new Error('Credenciales inválidas.');
    }

    if (!usuario.estaActivo()) {
      throw new Error('La cuenta no está disponible.');
    }

    return this.generarSesion(usuario);
  }

  async registrarCliente(usuario: Usuario): Promise<Usuario> {
    return this.registrarUsuario(usuario, 'CLIENTE');
  }

  async registrarVendedor(usuario: Usuario): Promise<Usuario> {
    return this.registrarUsuario(usuario, 'VENDEDOR');
  }

  async registrarCuentaCliente(datos: RegistrarClienteDto): Promise<Usuario> {
    const usuario = await this.crearUsuarioDesdeDatos(datos, 'CLIENTE');
    return this.registrarCliente(usuario);
  }

  async registrarUsuarioVendedor(
    datos: RegistrarVendedorDto,
  ): Promise<Usuario> {
    const usuario = await this.crearUsuarioDesdeDatos(datos, 'VENDEDOR');
    return this.registrarVendedor(usuario);
  }

  async cerrarSesion(idUsuario: number): Promise<boolean> {
    return this.usuarioRepository.revocarRefreshToken(idUsuario);
  }

  async refrescarSesion(datos: RefreshTokenDto): Promise<SesionDto> {
    const refreshToken = datos.refreshToken?.trim();

    if (!refreshToken) {
      throw new Error('Refresh token requerido.');
    }

    const payload = this.jwtService.verificar(refreshToken);

    if (!payload || payload.tipo !== 'refresh') {
      throw new Error('Refresh token inválido o expirado.');
    }

    const usuario = await this.usuarioRepository.buscarPorId(payload.sub);

    if (!usuario || !usuario.estaActivo()) {
      throw new Error('Usuario no autorizado.');
    }

    const refreshGuardado = await this.usuarioRepository.obtenerRefreshToken(
      usuario.idUsuario,
    );

    if (
      !refreshGuardado ||
      refreshGuardado.fechaExpiracion < new Date() ||
      !this.contrasenaService.verificar(
        refreshToken,
        refreshGuardado.refreshTokenHash,
      )
    ) {
      throw new Error('Refresh token inválido o expirado.');
    }

    return this.generarSesion(usuario);
  }

  async modificarDatosCliente(
    idUsuario: number,
    datos: Partial<Usuario>,
  ): Promise<boolean> {
    return this.modificarDatosUsuario(idUsuario, datos, 'CLIENTE');
  }

  async modificarDatosVendedor(
    idUsuario: number,
    datos: Partial<Usuario>,
  ): Promise<boolean> {
    return this.modificarDatosUsuario(idUsuario, datos, 'VENDEDOR');
  }

  async modificarDatosAdmin(
    idUsuario: number,
    datos: Partial<Usuario>,
  ): Promise<boolean> {
    return this.modificarDatosUsuario(idUsuario, datos, 'ADMINISTRADOR');
  }

  async desactivarCuenta(idUsuario: number): Promise<boolean> {
    return this.usuarioRepository.desactivar(idUsuario);
  }

  async recuperarContrasena(email: string): Promise<boolean> {
    return this.usuarioRepository.existePorEmail(email);
  }

  async obtenerUsuario(idUsuario: number): Promise<Usuario | null> {
    return this.usuarioRepository.buscarPorId(idUsuario);
  }

  async listarUsuarios(): Promise<Usuario[]> {
    return this.usuarioRepository.listarUsuarios();
  }

  private async registrarUsuario(
    usuario: Usuario,
    rol: Usuario['rol'],
  ): Promise<Usuario> {
    this.validarDatosRegistro(usuario);

    if (usuario.rol !== rol) {
      throw new Error('El rol del usuario no corresponde con la operación.');
    }

    if (await this.usuarioRepository.existePorEmail(usuario.email)) {
      throw new Error('El email ya está en uso.');
    }

    if (await this.usuarioRepository.existePorDocumento(usuario.dniRuc)) {
      throw new Error('El DNI/RUC ya está en uso.');
    }

    return this.usuarioRepository.guardar(usuario);
  }

  private async generarSesion(usuario: Usuario): Promise<SesionDto> {
    const payloadBase = {
      sub: usuario.idUsuario,
      email: usuario.email,
      rol: usuario.rol,
    };
    const accessToken = this.jwtService.firmarAccessToken(payloadBase);
    const refreshToken = this.jwtService.firmarRefreshToken(payloadBase);

    await this.usuarioRepository.guardarRefreshToken(
      usuario.idUsuario,
      this.contrasenaService.generarHash(refreshToken),
      this.jwtService.obtenerFechaExpiracionRefreshToken(),
    );

    return {
      accessToken,
      refreshToken,
      usuario: UsuarioMapper.aSesionDto(usuario),
    };
  }

  private async crearUsuarioDesdeDatos(
    datos: RegistrarClienteDto | RegistrarVendedorDto,
    rol: Usuario['rol'],
  ): Promise<Usuario> {
    return new Usuario(
      0,
      datos.nombres?.trim(),
      datos.apellidos?.trim(),
      datos.email?.trim().toLowerCase(),
      this.contrasenaService.generarHash(datos.contrasena),
      datos.telefono?.trim(),
      new Date(),
      datos.dniRuc?.trim(),
      datos.direccion?.trim(),
      rol,
      'ACTIVO',
    );
  }

  private validarDatosRegistro(usuario: Usuario): void {
    if (
      !usuario.nombres ||
      !usuario.apellidos ||
      !usuario.email ||
      !usuario.contrasenaHash ||
      !usuario.telefono ||
      !usuario.dniRuc ||
      !usuario.direccion
    ) {
      throw new Error('Faltan datos obligatorios del usuario.');
    }
  }

  private async modificarDatosUsuario(
    idUsuario: number,
    datos: Partial<Usuario>,
    rol: Usuario['rol'],
  ): Promise<boolean> {
    const usuario = await this.usuarioRepository.buscarPorId(idUsuario);

    if (!usuario || usuario.rol !== rol) {
      return false;
    }

    const usuarioActualizado = new Usuario(
      usuario.idUsuario,
      datos.nombres ?? usuario.nombres,
      datos.apellidos ?? usuario.apellidos,
      datos.email ?? usuario.email,
      datos.contrasenaHash ?? usuario.contrasenaHash,
      datos.telefono ?? usuario.telefono,
      usuario.fechaRegistro,
      datos.dniRuc ?? usuario.dniRuc,
      datos.direccion ?? usuario.direccion,
      usuario.rol,
      datos.estado ?? usuario.estado,
    );

    return this.usuarioRepository.actualizar(usuarioActualizado);
  }
}
