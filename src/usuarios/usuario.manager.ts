import { Inject, Injectable } from '@nestjs/common';
import type { IniciarSesionDto } from './dto/iniciar-sesion.dto';
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
    const email = (
      credenciales.email ?? credenciales.correoElectronico
    )?.trim();
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

    const accessToken = this.jwtService.firmar({
      sub: usuario.idUsuario,
      email: usuario.email,
      rol: usuario.rol,
    });

    return {
      accessToken,
      usuario: UsuarioMapper.aSesionDto(usuario),
    };
  }

  async registrarCliente(usuario: Usuario): Promise<boolean> {
    return this.registrarUsuario(usuario, 'CLIENTE');
  }

  async registrarVendedor(usuario: Usuario): Promise<boolean> {
    return this.registrarUsuario(usuario, 'VENDEDOR');
  }

  async cerrarSesion(idUsuario: number): Promise<boolean> {
    return (await this.usuarioRepository.buscarPorId(idUsuario)) !== null;
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
  ): Promise<boolean> {
    if (usuario.rol !== rol) {
      throw new Error('El rol del usuario no corresponde con la operacion.');
    }

    if (await this.usuarioRepository.existePorEmail(usuario.email)) {
      throw new Error('El email ya está en uso.');
    }

    if (await this.usuarioRepository.existePorDocumento(usuario.dniRuc)) {
      throw new Error('El DNI/RUC ya está en uso.');
    }

    return this.usuarioRepository.guardar(usuario);
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
