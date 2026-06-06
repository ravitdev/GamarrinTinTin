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

  insertar(usuario: Usuario, usuariosTable: UsuarioRegistro[]): boolean {
    usuariosTable.push(UsuarioDataMapper.aRegistro(usuario));
    return true;
  }

  actualizar(usuario: Usuario, usuariosTable: UsuarioRegistro[]): boolean {
    const index = usuariosTable.findIndex(
      (registro) => registro.idUsuario === usuario.idUsuario,
    );

    if (index === -1) {
      return false;
    }

    usuariosTable[index] = UsuarioDataMapper.aRegistro(usuario);
    return true;
  }

  desactivar(idUsuario: number, usuariosTable: UsuarioRegistro[]): boolean {
    const registro = usuariosTable.find(
      (usuario) => usuario.idUsuario === idUsuario,
    );

    if (!registro) {
      return false;
    }

    registro.estado = 'INACTIVO';
    return true;
  }

  seleccionarPorId(
    idUsuario: number,
    usuariosTable: UsuarioRegistro[],
  ): Usuario | null {
    const registro = usuariosTable.find(
      (usuario) => usuario.idUsuario === idUsuario,
    );

    return registro ? UsuarioDataMapper.aEntidad(registro) : null;
  }

  seleccionarPorEmail(
    email: string,
    usuariosTable: UsuarioRegistro[],
  ): Usuario | null {
    const emailNormalizado = email.trim().toLowerCase();
    const registro = usuariosTable.find(
      (usuario) => usuario.email.toLowerCase() === emailNormalizado,
    );

    return registro ? UsuarioDataMapper.aEntidad(registro) : null;
  }

  existePorEmail(email: string, usuariosTable: UsuarioRegistro[]): boolean {
    return this.seleccionarPorEmail(email, usuariosTable) !== null;
  }

  existePorDocumento(
    dniRuc: string,
    usuariosTable: UsuarioRegistro[],
  ): boolean {
    const documentoNormalizado = dniRuc.trim();
    return usuariosTable.some(
      (usuario) => usuario.dniRuc === documentoNormalizado,
    );
  }

  seleccionarTodos(usuariosTable: UsuarioRegistro[]): Usuario[] {
    return usuariosTable.map((registro) =>
      UsuarioDataMapper.aEntidad(registro),
    );
  }
}
