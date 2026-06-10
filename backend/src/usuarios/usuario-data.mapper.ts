import { EstadoUsuario, RolUsuario, Usuario } from './domain/usuario.entity';

export interface UsuarioRegistro {
  idUsuario: number;
  nombres: string;
  apellidos: string;
  email: string;
  contrasenaHash: string;
  telefono: string;
  fechaRegistro: Date;
  dniRuc: string;
  direccion: string;
  rol: RolUsuario;
  estado: EstadoUsuario;
}

export class UsuarioDataMapper {
  static aEntidad(registro: UsuarioRegistro): Usuario {
    return new Usuario(
      registro.idUsuario,
      registro.nombres,
      registro.apellidos,
      registro.email,
      registro.contrasenaHash,
      registro.telefono,
      new Date(registro.fechaRegistro),
      registro.dniRuc,
      registro.direccion,
      registro.rol,
      registro.estado,
    );
  }

  static aRegistro(usuario: Usuario): UsuarioRegistro {
    return {
      idUsuario: usuario.idUsuario,
      nombres: usuario.nombres,
      apellidos: usuario.apellidos,
      email: usuario.email,
      contrasenaHash: usuario.contrasenaHash,
      telefono: usuario.telefono,
      fechaRegistro: new Date(usuario.fechaRegistro),
      dniRuc: usuario.dniRuc,
      direccion: usuario.direccion,
      rol: usuario.rol,
      estado: usuario.estado,
    };
  }
}
