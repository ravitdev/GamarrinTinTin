import { Inject, Injectable } from '@nestjs/common';
import type { IniciarSesionDto } from './dto/iniciar-sesion.dto';
import type { RefreshTokenDto } from './dto/refresh-token.dto';
import type { RegistrarClienteDto } from './dto/registrar-cliente.dto';
import type { RegistrarVendedorDto } from './dto/registrar-vendedor.dto';
import type { SesionDto } from './dto/sesion.dto';
import { TipoDocumento, Usuario } from './domain/usuario.entity';
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
    const email = this.normalizarTexto(credenciales.email).toLowerCase();
    const contrasena = credenciales.contrasena;

    if (!email || !contrasena) {
      throw new Error('Debe ingresar email y contraseña.');
    }

    this.validarEmail(email);

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
    const usuario = this.crearUsuarioDesdeDatos(datos, 'CLIENTE');
    return this.registrarCliente(usuario);
  }

  async registrarUsuarioVendedor(
    datos: RegistrarVendedorDto,
  ): Promise<Usuario> {
    const usuario = this.crearUsuarioDesdeDatos(datos, 'VENDEDOR');
    return this.registrarVendedor(usuario);
  }

  async cerrarSesion(idUsuario: number): Promise<boolean> {
    this.validarId(idUsuario, 'El usuario de la sesión no es válido.');
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
    this.validarId(idUsuario, 'El usuario no es válido.');
    return this.usuarioRepository.desactivar(idUsuario);
  }

  async recuperarContrasena(email: string): Promise<boolean> {
    const emailNormalizado = this.normalizarTexto(email).toLowerCase();
    this.validarEmail(emailNormalizado);
    return this.usuarioRepository.existePorEmail(emailNormalizado);
  }

  async obtenerUsuario(idUsuario: number): Promise<Usuario | null> {
    this.validarId(idUsuario, 'El usuario no es válido.');
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

    if (
      await this.usuarioRepository.existePorDocumento(
        usuario.numeroDocumento,
      )
    ) {
      throw new Error('El numero de documento ya está en uso.');
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

  private crearUsuarioDesdeDatos(
    datos: RegistrarClienteDto | RegistrarVendedorDto,
    rol: Usuario['rol'],
  ): Usuario {
    const nombres = this.normalizarTexto(datos.nombres);
    const apellidos = this.normalizarTexto(datos.apellidos);
    const email = this.normalizarTexto(datos.email).toLowerCase();
    const telefono = this.normalizarTexto(datos.telefono);
    const tipoDocumento = datos.tipoDocumento;
    const numeroDocumento = this.normalizarTexto(datos.numeroDocumento);
    const direccion = this.normalizarTexto(datos.direccion);
    const contrasena = datos.contrasena;

    this.validarContrasena(contrasena);

    return new Usuario(
      0,
      nombres,
      apellidos,
      email,
      this.contrasenaService.generarHash(contrasena),
      telefono,
      new Date(),
      tipoDocumento,
      numeroDocumento,
      direccion,
      rol,
      'ACTIVO',
    );
  }

  private validarDatosRegistro(usuario: Usuario): void {
    this.validarTextoObligatorio(usuario.nombres, 'Los nombres son obligatorios.');
    this.validarTextoObligatorio(
      usuario.apellidos,
      'Los apellidos son obligatorios.',
    );
    this.validarEmail(usuario.email);
    this.validarTelefono(usuario.telefono);
    this.validarDocumento(usuario.tipoDocumento, usuario.numeroDocumento);
    this.validarTextoObligatorio(
      usuario.direccion,
      'La dirección es obligatoria.',
    );
  }

  private async modificarDatosUsuario(
    idUsuario: number,
    datos: Partial<Usuario>,
    rol: Usuario['rol'],
  ): Promise<boolean> {
    this.validarId(idUsuario, 'El usuario no es válido.');

    const usuario = await this.usuarioRepository.buscarPorId(idUsuario);

    if (!usuario || usuario.rol !== rol) {
      return false;
    }

    const email = this.normalizarTexto(datos.email ?? usuario.email).toLowerCase();
    const tipoDocumento = datos.tipoDocumento ?? usuario.tipoDocumento;
    const numeroDocumento = this.normalizarTexto(
      datos.numeroDocumento ?? usuario.numeroDocumento,
    );

    if (
      email !== usuario.email &&
      (await this.usuarioRepository.existePorEmail(email))
    ) {
      throw new Error('El email ya está en uso.');
    }

    if (
      numeroDocumento !== usuario.numeroDocumento &&
      (await this.usuarioRepository.existePorDocumento(numeroDocumento))
    ) {
      throw new Error('El número de documento ya está en uso.');
    }

    const usuarioActualizado = new Usuario(
      usuario.idUsuario,
      this.normalizarTexto(datos.nombres ?? usuario.nombres),
      this.normalizarTexto(datos.apellidos ?? usuario.apellidos),
      email,
      datos.contrasenaHash ?? usuario.contrasenaHash,
      this.normalizarTexto(datos.telefono ?? usuario.telefono),
      usuario.fechaRegistro,
      tipoDocumento,
      numeroDocumento,
      this.normalizarTexto(datos.direccion ?? usuario.direccion),
      usuario.rol,
      datos.estado ?? usuario.estado,
    );

    this.validarDatosRegistro(usuarioActualizado);
    return this.usuarioRepository.actualizar(usuarioActualizado);
  }

  private validarId(id: number, mensaje: string): void {
    if (!Number.isInteger(id) || id <= 0) {
      throw new Error(mensaje);
    }
  }

  private validarTextoObligatorio(valor: string, mensaje: string): void {
    if (!valor || valor.trim().length === 0) {
      throw new Error(mensaje);
    }
  }

  private validarEmail(email: string): void {
    const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    if (!emailValido) {
      throw new Error('El email no tiene un formato válido.');
    }
  }

  private validarTelefono(telefono: string): void {
    if (!/^\d{9}$/.test(telefono)) {
      throw new Error('El teléfono debe tener 9 dígitos.');
    }
  }

  private validarDocumento(
    tipoDocumento: TipoDocumento,
    numeroDocumento: string,
  ): void {
    if (!['DNI', 'RUC'].includes(tipoDocumento)) {
      throw new Error('El tipo de documento no es válido.');
    }

    const reglasDocumento = {
      DNI: { patron: /^\d{8}$/, mensaje: 'El DNI debe tener 8 dígitos.' },
      RUC: { patron: /^\d{11}$/, mensaje: 'El RUC debe tener 11 dígitos.' },
    };
    const regla = reglasDocumento[tipoDocumento];

    if (!regla.patron.test(numeroDocumento)) {
      throw new Error(regla.mensaje);
    }
  }

  private validarContrasena(contrasena: string): void {
    if (!contrasena || contrasena.length < 8) {
      throw new Error('La contraseña debe tener al menos 8 caracteres.');
    }

    if (!/[A-Za-z]/.test(contrasena) || !/\d/.test(contrasena)) {
      throw new Error('La contraseña debe incluir letras y números.');
    }
  }

  private normalizarTexto(valor: string | undefined): string {
    return valor?.trim() ?? '';
  }
}
