import {
  EstadoUsuario,
  RolUsuario,
  TipoDocumento,
  Usuario,
} from './domain/usuario.entity';

export interface UsuarioRegistro {
  idUsuario: number;
  nombres: string;
  apellidos: string;
  email: string;
  contrasenaHash: string;
  telefono: string;
  fechaRegistro: Date;
  tipoDocumento: TipoDocumento;
  numeroDocumento: string;
  direccion: string | null;
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
      registro.tipoDocumento,
      registro.numeroDocumento,
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
      tipoDocumento: usuario.tipoDocumento,
      numeroDocumento: usuario.numeroDocumento,
      direccion: usuario.direccion,
      rol: usuario.rol,
      estado: usuario.estado,
    };
  }
}
