import { createHash, randomBytes } from 'node:crypto';
import { Inject, Injectable, Optional } from '@nestjs/common';
import { NotificacionManager } from '../notificaciones/notificacion.manager';
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
    @Optional()
    private readonly notificacionManager?: NotificacionManager,
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

  async registrarCuentaCliente(
    datos: RegistrarClienteDto,
  ): Promise<{ email: string; fechaExpiracion: Date }> {
    const usuario = this.crearUsuarioDesdeDatos(datos, 'CLIENTE');
    this.validarDatosRegistro(usuario);

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

    const codigo = this.generarCodigoVerificacion();
    const tokenAnulacion = this.generarTokenSeguro();
    const fechaExpiracion = new Date(Date.now() + 5 * 60 * 1000);

    await this.usuarioRepository.guardarRegistroPendiente({
      nombres: usuario.nombres,
      apellidos: usuario.apellidos,
      email: usuario.email,
      contrasenaHash: usuario.contrasenaHash,
      telefono: usuario.telefono,
      tipoDocumento: usuario.tipoDocumento,
      numeroDocumento: usuario.numeroDocumento,
      direccion: usuario.direccion,
      rol: 'CLIENTE',
      codigoHash: this.contrasenaService.generarHash(codigo),
      tokenAnulacionHash: this.generarHashToken(tokenAnulacion),
      estado: 'PENDIENTE',
      fechaExpiracion,
    });

    await this.notificacionManager?.enviarCodigoVerificacionRegistro(
      usuario.email,
      usuario.nombres,
      codigo,
      tokenAnulacion,
    );

    return {
      email: usuario.email,
      fechaExpiracion,
    };
  }

  async confirmarRegistroCliente(
    email: string,
    codigo: string,
  ): Promise<SesionDto> {
    const emailNormalizado = this.normalizarTexto(email).toLowerCase();
    const codigoNormalizado = this.normalizarTexto(codigo).toUpperCase();

    this.validarEmail(emailNormalizado);

    if (!/^[A-Z0-9]{6}$/.test(codigoNormalizado)) {
      throw new Error('El código de verificación debe tener 6 caracteres.');
    }

    const pendiente =
      await this.usuarioRepository.buscarRegistroPendientePorEmail(
        emailNormalizado,
      );

    if (!pendiente || pendiente.estado !== 'PENDIENTE') {
      throw new Error('No existe un registro pendiente para este correo.');
    }

    if (pendiente.fechaExpiracion < new Date()) {
      await this.usuarioRepository.actualizarEstadoRegistroPendiente(
        pendiente.idRegistro!,
        'EXPIRADO',
      );
      throw new Error('El código de verificación ha expirado.');
    }

    if (
      !this.contrasenaService.verificar(
        codigoNormalizado,
        pendiente.codigoHash,
      )
    ) {
      throw new Error('El código de verificación no es correcto.');
    }

    if (await this.usuarioRepository.existePorEmail(pendiente.email)) {
      throw new Error('El email ya está en uso.');
    }

    if (
      await this.usuarioRepository.existePorDocumento(
        pendiente.numeroDocumento,
      )
    ) {
      throw new Error('El numero de documento ya está en uso.');
    }

    const usuario = await this.usuarioRepository.guardar(
      new Usuario(
        0,
        pendiente.nombres,
        pendiente.apellidos,
        pendiente.email,
        pendiente.contrasenaHash,
        pendiente.telefono,
        new Date(),
        pendiente.tipoDocumento,
        pendiente.numeroDocumento,
        pendiente.direccion,
        'CLIENTE',
        'ACTIVO',
      ),
    );

    await this.usuarioRepository.actualizarEstadoRegistroPendiente(
      pendiente.idRegistro!,
      'CONFIRMADO',
    );

    await this.notificacionManager?.enviarBienvenida(
      usuario.email,
      usuario.nombres,
    );

    return this.generarSesion(usuario);
  }

  async reenviarCodigoRegistroCliente(
    email: string,
  ): Promise<{ email: string; fechaExpiracion: Date }> {
    const emailNormalizado = this.normalizarTexto(email).toLowerCase();
    this.validarEmail(emailNormalizado);

    const pendiente =
      await this.usuarioRepository.buscarRegistroPendientePorEmail(
        emailNormalizado,
      );

    if (
      !pendiente ||
      !['PENDIENTE', 'EXPIRADO'].includes(pendiente.estado ?? 'PENDIENTE')
    ) {
      throw new Error('No existe un registro pendiente para este correo.');
    }

    if (await this.usuarioRepository.existePorEmail(pendiente.email)) {
      throw new Error('El email ya está en uso.');
    }

    const codigo = this.generarCodigoVerificacion();
    const tokenAnulacion = this.generarTokenSeguro();
    const fechaExpiracion = new Date(Date.now() + 5 * 60 * 1000);

    const actualizado =
      await this.usuarioRepository.actualizarCodigoRegistroPendiente(
        pendiente.idRegistro!,
        this.contrasenaService.generarHash(codigo),
        this.generarHashToken(tokenAnulacion),
        fechaExpiracion,
      );

    await this.notificacionManager?.enviarCodigoVerificacionRegistro(
      actualizado.email,
      actualizado.nombres,
      codigo,
      tokenAnulacion,
    );

    return {
      email: actualizado.email,
      fechaExpiracion: actualizado.fechaExpiracion,
    };
  }

  async anularRegistroCliente(token: string): Promise<boolean> {
    const tokenNormalizado = this.normalizarTexto(token);

    if (!tokenNormalizado) {
      throw new Error('El token de anulación es obligatorio.');
    }

    const pendiente =
      await this.usuarioRepository.buscarRegistroPendientePorTokenAnulacion(
        this.generarHashToken(tokenNormalizado),
      );

    if (!pendiente || pendiente.estado !== 'PENDIENTE') {
      return true;
    }

    return this.usuarioRepository.actualizarEstadoRegistroPendiente(
      pendiente.idRegistro!,
      'ANULADO',
    );
  }
  async registrarUsuarioVendedor(
    datos: RegistrarVendedorDto,
  ): Promise<Usuario> {
    const usuario = this.crearUsuarioDesdeDatos(datos, 'VENDEDOR');
    const registrado = await this.registrarVendedor(usuario);
    await this.notificacionManager?.enviarBienvenida(
      registrado.email,
      registrado.nombres,
    );
    return registrado;
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
    const pedidos =
      usuario.rol === 'CLIENTE'
        ? await this.usuarioRepository.listarPedidosResumenPorCliente(idUsuario)
        : undefined;

    return UsuarioMapper.aPerfilDto(usuario, {
      solicitudCambioDocumentoPendiente: solicitudDocumento !== null,
      solicitudDesactivacionPendiente: solicitudDesactivacion !== null,
      puedeDesactivarse: validacion.puede,
      motivoNoDesactivacion: validacion.motivo,
      totalPedidos: pedidos?.length,
      totalGastado: pedidos?.reduce((total, pedido) => total + pedido.total, 0),
      fechaUltimoPedido: pedidos?.[0]?.fecha ?? null,
      pedidos,
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

    const actualizada = await this.modificarDatosUsuario(
      idUsuario,
      { contrasenaHash: this.contrasenaService.generarHash(datos.contrasenaNueva) },
      usuario.rol,
      false,
    );

    if (actualizada) {
      await this.usuarioRepository.revocarRefreshToken(idUsuario);
      await this.notificacionManager?.enviarContrasenaActualizada(usuario.email);
    }

    return actualizada;
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

    if (usuario.rol === 'VENDEDOR' && tipoDocumento !== 'DNI') {
      throw new Error('Los vendedores solo pueden solicitar cambio de DNI.');
    }

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

  async rechazarSolicitudCambioDocumento(
    idSolicitud: number,
    idAdmin: number,
  ): Promise<void> {
    const solicitudes =
      await this.usuarioRepository.listarSolicitudesCambioDocumentoPendientes();
    const solicitudConUsuario = solicitudes.find((s) => s.idSolicitud === idSolicitud);

    if (!solicitudConUsuario) {
      throw new Error('La solicitud de cambio de documento no existe o ya fue procesada.');
    }

    await this.usuarioRepository.resolverSolicitudCambioDocumento(
      idSolicitud,
      'RECHAZADA',
      idAdmin,
    );
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

  async procesarReactivacionCuenta(idUsuario: number): Promise<boolean> {
    const usuario = await this.usuarioRepository.buscarPorId(idUsuario);

    if (!usuario) {
      throw new Error('El usuario no existe.');
    }

    if (usuario.estaActivo()) {
      throw new Error('La cuenta ya se encuentra activa.');
    }

    const reactivado = await this.usuarioRepository.reactivar(idUsuario);

    if (!reactivado) {
      throw new Error('No fue posible reactivar la cuenta.');
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

    const usuario = await this.usuarioRepository.buscarPorEmail(emailNormalizado);

    // La respuesta no revela si una cuenta existe.
    if (!usuario || !usuario.estaActivo()) {
      return true;
    }

    if (
      !this.usuarioRepository.guardarTokenRecuperacion ||
      !this.notificacionManager
    ) {
      throw new Error('El servicio de recuperación no está disponible.');
    }

    const token = randomBytes(32).toString('hex');
    const fechaExpiracion = new Date(Date.now() + 60 * 60 * 1000);

    await this.usuarioRepository.guardarTokenRecuperacion(
      usuario.idUsuario,
      this.generarHashToken(token),
      fechaExpiracion,
    );

    const frontendUrl =
      process.env.FRONTEND_URL?.replace(/\/+$/, '') || 'http://localhost:3001';
    const enlace = `${frontendUrl}/restablecer-contrasena?token=${encodeURIComponent(token)}`;

    await this.notificacionManager.enviarRecuperacionContrasena(
      usuario.email,
      enlace,
    );
    return true;
  }

  async restablecerContrasena(
    token: string,
    contrasenaNueva: string,
  ): Promise<boolean> {
    const tokenNormalizado = token?.trim();
    if (!tokenNormalizado) {
      throw new Error('El token de recuperación es obligatorio.');
    }

    this.validarContrasena(contrasenaNueva);

    if (
      !this.usuarioRepository.obtenerTokenRecuperacion ||
      !this.usuarioRepository.consumirTokenRecuperacion
    ) {
      throw new Error('El servicio de recuperación no está disponible.');
    }

    const registro = await this.usuarioRepository.obtenerTokenRecuperacion(
      this.generarHashToken(tokenNormalizado),
    );

    if (!registro || registro.fechaExpiracion <= new Date()) {
      throw new Error('El enlace de recuperación no es válido o ha expirado.');
    }

    const usuario = await this.usuarioRepository.buscarPorId(registro.idUsuario);
    if (!usuario || !usuario.estaActivo()) {
      throw new Error('El enlace de recuperación no es válido o ha expirado.');
    }

    await this.usuarioRepository.consumirTokenRecuperacion(
      registro.idToken,
      usuario.idUsuario,
      this.contrasenaService.generarHash(contrasenaNueva),
    );
    await this.notificacionManager?.enviarContrasenaActualizada(usuario.email);
    return true;
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
    const direccion = this.normalizarTextoOpcional(datos.direccion);
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

    const direccionActualizada =
      datos.direccion === undefined
        ? usuario.direccion
        : this.normalizarTextoOpcional(datos.direccion);

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
      direccionActualizada,
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

  private normalizarTexto(valor: string | null | undefined): string {
    return valor?.trim() ?? '';
  }

  private normalizarTextoOpcional(valor: string | null | undefined): string | null {
    const texto = valor?.trim() ?? '';
    return texto.length > 0 ? texto : null;
  }

  private generarCodigoVerificacion(): string {
    const caracteres = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let codigo = '';

    for (let i = 0; i < 6; i += 1) {
      codigo += caracteres[randomBytes(1)[0] % caracteres.length];
    }

    return codigo;
  }

  private generarTokenSeguro(): string {
    return randomBytes(32).toString('base64url');
  }

  private generarHashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
