import { Inject, Injectable } from '@nestjs/common';
import type { ActualizarPerfilDto, CambiarContrasenaDto, UsuarioPerfilDto } from './dto/perfil.dto';
import type { IniciarSesionDto } from './dto/iniciar-sesion.dto';
import type { RefreshTokenDto } from './dto/refresh-token.dto';
import type { RegistrarClienteDto } from './dto/registrar-cliente.dto';
import type { RegistrarVendedorDto } from './dto/registrar-vendedor.dto';
import type { SesionDto } from './dto/sesion.dto';
import type { SolicitarCambioDocumentoDto, SolicitudCambioDocumentoDto } from './dto/solicitud-cambio-documento.dto';
import type { SolicitudDesactivacionDto } from './dto/solicitud-desactivacion.dto';
import { SolicitudCambioDocumento, SolicitudDesactivacion } from './domain/solicitud.entity';
import { RolUsuario, TipoDocumento, Usuario } from './domain/usuario.entity';
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
    permitirCambioDocumento = false,
  ): Promise<boolean> {
    return this.modificarDatosUsuario(idUsuario, datos, 'CLIENTE', permitirCambioDocumento);
  }

  async modificarDatosVendedor(
    idUsuario: number,
    datos: Partial<Usuario>,
    permitirCambioDocumento = false,
  ): Promise<boolean> {
    return this.modificarDatosUsuario(idUsuario, datos, 'VENDEDOR', permitirCambioDocumento);
  }

  async modificarDatosAdmin(
    idUsuario: number,
    datos: Partial<Usuario>,
  ): Promise<boolean> {
    return this.modificarDatosUsuario(idUsuario, datos, 'ADMINISTRADOR', false);
  }

  async obtenerPerfil(idUsuario: number): Promise<UsuarioPerfilDto> {
    const usuario = await this.obtenerUsuario(idUsuario);
    if (!usuario) {
      throw new Error('El usuario no existe.');
    }

    const validacion = await this.validarPuedeDesactivarse(idUsuario);
    const solicitudDocumento =
      await this.usuarioRepository.buscarSolicitudCambioDocumentoPendiente(idUsuario);
    const solicitudDesactivacion =
      await this.usuarioRepository.buscarSolicitudDesactivacionPendiente(idUsuario);

    return UsuarioMapper.aPerfilDto(usuario, {
      solicitudCambioDocumentoPendiente: solicitudDocumento !== null,
      solicitudDesactivacionPendiente: solicitudDesactivacion !== null,
      puedeDesactivarse: validacion.puede,
      motivoNoDesactivacion: validacion.motivo,
    });
  }

  async actualizarPerfil(
    idSolicitante: number,
    rolSolicitante: RolUsuario,
    idObjetivo: number,
    datos: ActualizarPerfilDto,
  ): Promise<Usuario> {
    this.validarAutorizacionEdicion(idSolicitante, rolSolicitante, idObjetivo);

    const usuario = await this.usuarioRepository.buscarPorId(idObjetivo);
    if (!usuario) {
      throw new Error('El usuario no existe.');
    }

    const esAdminEditando = rolSolicitante === 'ADMINISTRADOR' && idSolicitante !== idObjetivo;
    const cambioDocumentoSolicitado =
      (datos.tipoDocumento !== undefined &&
        datos.tipoDocumento !== usuario.tipoDocumento) ||
      (datos.numeroDocumento !== undefined &&
        this.normalizarTexto(datos.numeroDocumento) !== usuario.numeroDocumento);

    if (cambioDocumentoSolicitado && !esAdminEditando) {
      throw new Error(
        'Para modificar el documento debe solicitar el cambio y esperar la aprobación de un administrador.',
      );
    }

    const actualizado = await this.modificarDatosUsuario(
      idObjetivo,
      {
        nombres: datos.nombres,
        apellidos: datos.apellidos,
        email: datos.email,
        telefono: datos.telefono,
        direccion: datos.direccion,
        tipoDocumento: datos.tipoDocumento,
        numeroDocumento: datos.numeroDocumento,
      },
      usuario.rol,
      esAdminEditando,
    );

    if (!actualizado) {
      throw new Error('No fue posible actualizar el perfil.');
    }

    const usuarioActualizado = await this.usuarioRepository.buscarPorId(idObjetivo);
    if (!usuarioActualizado) {
      throw new Error('El usuario no existe.');
    }

    return usuarioActualizado;
  }

  async cambiarContrasena(
    idUsuario: number,
    datos: CambiarContrasenaDto,
  ): Promise<boolean> {
    const usuario = await this.usuarioRepository.buscarPorId(idUsuario);
    if (!usuario) {
      throw new Error('El usuario no existe.');
    }

    if (
      !this.contrasenaService.verificar(
        datos.contrasenaActual,
        usuario.contrasenaHash,
      )
    ) {
      throw new Error('La contraseña actual no es correcta.');
    }

    this.validarContrasena(datos.contrasenaNueva);

    return this.modificarDatosUsuario(
      idUsuario,
      { contrasenaHash: this.contrasenaService.generarHash(datos.contrasenaNueva) },
      usuario.rol,
      false,
    );
  }

  async solicitarCambioDocumento(
    idUsuario: number,
    datos: SolicitarCambioDocumentoDto,
  ): Promise<SolicitudCambioDocumentoDto> {
    const usuario = await this.usuarioRepository.buscarPorId(idUsuario);
    if (!usuario) {
      throw new Error('El usuario no existe.');
    }

    if (usuario.rol === 'ADMINISTRADOR') {
      throw new Error('Los administradores no pueden solicitar cambio de documento.');
    }

    const tipoDocumento = datos.tipoDocumento;
    const numeroDocumento = this.normalizarTexto(datos.numeroDocumento);
    this.validarDocumento(tipoDocumento, numeroDocumento);

    if (
      tipoDocumento === usuario.tipoDocumento &&
      numeroDocumento === usuario.numeroDocumento
    ) {
      throw new Error('El nuevo documento debe ser diferente al actual.');
    }

    if (await this.usuarioRepository.existePorDocumento(numeroDocumento)) {
      throw new Error('El número de documento ya está en uso.');
    }

    const pendiente =
      await this.usuarioRepository.buscarSolicitudCambioDocumentoPendiente(idUsuario);
    if (pendiente) {
      throw new Error('Ya existe una solicitud de cambio de documento pendiente.');
    }

    const solicitud = await this.usuarioRepository.crearSolicitudCambioDocumento(
      new SolicitudCambioDocumento(
        0,
        idUsuario,
        tipoDocumento,
        numeroDocumento,
        'PENDIENTE',
        new Date(),
      ),
    );

    return UsuarioMapper.aSolicitudCambioDocumentoDto(solicitud, usuario);
  }

  async aprobarSolicitudCambioDocumento(
    idSolicitud: number,
    idAdmin: number,
  ): Promise<Usuario> {
    const solicitudes =
      await this.usuarioRepository.listarSolicitudesCambioDocumentoPendientes();
    const solicitudConUsuario = solicitudes.find((s) => s.idSolicitud === idSolicitud);

    if (!solicitudConUsuario) {
      throw new Error('La solicitud de cambio de documento no existe o ya fue procesada.');
    }

    const { usuario } = solicitudConUsuario;

    if (
      await this.usuarioRepository.existePorDocumento(
        solicitudConUsuario.numeroDocumento,
      )
    ) {
      throw new Error('El número de documento ya está en uso.');
    }

    await this.modificarDatosUsuario(
      usuario.idUsuario,
      {
        tipoDocumento: solicitudConUsuario.tipoDocumento,
        numeroDocumento: solicitudConUsuario.numeroDocumento,
      },
      usuario.rol,
      true,
    );

    await this.usuarioRepository.resolverSolicitudCambioDocumento(
      idSolicitud,
      'APROBADA',
      idAdmin,
    );

    const actualizado = await this.usuarioRepository.buscarPorId(usuario.idUsuario);
    if (!actualizado) {
      throw new Error('El usuario no existe.');
    }

    return actualizado;
  }

  async listarSolicitudesCambioDocumentoPendientes(): Promise<SolicitudCambioDocumentoDto[]> {
    const solicitudes =
      await this.usuarioRepository.listarSolicitudesCambioDocumentoPendientes();

    return solicitudes.map((solicitud) =>
      UsuarioMapper.aSolicitudCambioDocumentoDto(solicitud, solicitud.usuario),
    );
  }

  async solicitarDesactivacion(idUsuario: number): Promise<SolicitudDesactivacionDto> {
    const usuario = await this.usuarioRepository.buscarPorId(idUsuario);
    if (!usuario) {
      throw new Error('El usuario no existe.');
    }

    if (!usuario.estaActivo()) {
      throw new Error('La cuenta ya se encuentra inactiva.');
    }

    const pendiente =
      await this.usuarioRepository.buscarSolicitudDesactivacionPendiente(idUsuario);
    if (pendiente) {
      throw new Error('Ya existe una solicitud de desactivación pendiente.');
    }

    const validacion = await this.validarPuedeDesactivarse(idUsuario);
    if (!validacion.puede) {
      throw new Error(validacion.motivo ?? 'La cuenta no puede ser desactivada.');
    }

    const solicitud = await this.usuarioRepository.crearSolicitudDesactivacion(
      new SolicitudDesactivacion(0, idUsuario, 'PENDIENTE', new Date()),
    );

    return UsuarioMapper.aSolicitudDesactivacionDto(
      solicitud,
      usuario,
      validacion.puede,
      validacion.motivo,
    );
  }

  async listarSolicitudesDesactivacionPendientes(): Promise<SolicitudDesactivacionDto[]> {
    const solicitudes =
      await this.usuarioRepository.listarSolicitudesDesactivacionPendientes();

    return Promise.all(
      solicitudes.map(async (solicitud) => {
        const validacion = await this.validarPuedeDesactivarse(solicitud.usuario.idUsuario);
        return UsuarioMapper.aSolicitudDesactivacionDto(
          solicitud,
          solicitud.usuario,
          validacion.puede,
          validacion.motivo,
        );
      }),
    );
  }

  async procesarDesactivacionCuenta(
    idUsuario: number,
    idAdmin: number,
    idSolicitud?: number,
  ): Promise<boolean> {
    const usuario = await this.usuarioRepository.buscarPorId(idUsuario);
    if (!usuario) {
      throw new Error('El usuario no existe.');
    }

    if (!usuario.estaActivo()) {
      throw new Error('La cuenta ya se encuentra inactiva.');
    }

    const validacion = await this.validarPuedeDesactivarse(idUsuario);
    if (!validacion.puede) {
      throw new Error(validacion.motivo ?? 'La cuenta no puede ser desactivada.');
    }

    const desactivado = await this.usuarioRepository.desactivar(idUsuario);
    if (!desactivado) {
      throw new Error('No fue posible desactivar la cuenta.');
    }

    await this.usuarioRepository.revocarRefreshToken(idUsuario);

    if (idSolicitud) {
      await this.usuarioRepository.resolverSolicitudDesactivacion(
        idSolicitud,
        'PROCESADA',
        idAdmin,
      );
    }

    return true;
  }

  async validarPuedeDesactivarse(
    idUsuario: number,
  ): Promise<{ puede: boolean; motivo?: string }> {
    const usuario = await this.usuarioRepository.buscarPorId(idUsuario);
    if (!usuario) {
      return { puede: false, motivo: 'El usuario no existe.' };
    }

    if (!usuario.estaActivo()) {
      return { puede: false, motivo: 'La cuenta ya se encuentra inactiva.' };
    }

    if (usuario.rol === 'CLIENTE') {
      const pedidosEnProceso =
        await this.usuarioRepository.contarPedidosEnProceso(idUsuario);
      if (pedidosEnProceso > 0) {
        return {
          puede: false,
          motivo:
            'La cuenta tiene pedidos en proceso. Debe esperar a que se entreguen o cancelen.',
        };
      }
    }

    return { puede: true };
  }

  async listarUsuariosPorRol(rol: RolUsuario): Promise<Usuario[]> {
    return this.usuarioRepository.listarPorRol(rol);
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
    permitirCambioDocumento = false,
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

    const cambioDocumento =
      tipoDocumento !== usuario.tipoDocumento ||
      numeroDocumento !== usuario.numeroDocumento;

    if (cambioDocumento && !permitirCambioDocumento) {
      throw new Error(
        'Para modificar el documento debe solicitar el cambio y esperar la aprobación de un administrador.',
      );
    }

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

  private validarAutorizacionEdicion(
    idSolicitante: number,
    rolSolicitante: RolUsuario,
    idObjetivo: number,
  ): void {
    if (idSolicitante === idObjetivo) {
      return;
    }

    if (rolSolicitante !== 'ADMINISTRADOR') {
      throw new Error('No tiene permisos para modificar este usuario.');
    }
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

    if (!telefono.startsWith('9')) {
      throw new Error('El teléfono debe empezar con 9.');
    }
  }

  private validarDocumento(
    tipoDocumento: TipoDocumento,
    numeroDocumento: string,
  ): void {
    if (!['DNI', 'RUC'].includes(tipoDocumento)) {
      throw new Error('El tipo de documento no es válido.');
    }

    if (tipoDocumento === 'DNI') {
      if (!/^\d{8}$/.test(numeroDocumento)) {
        throw new Error('El DNI debe tener 8 dígitos.');
      }
      return;
    }

    if (!/^\d{11}$/.test(numeroDocumento)) {
      throw new Error('El RUC debe tener 11 dígitos.');
    }

    if (!numeroDocumento.startsWith('10') && !numeroDocumento.startsWith('20')) {
      throw new Error('El RUC debe empezar con 10 o 20.');
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
