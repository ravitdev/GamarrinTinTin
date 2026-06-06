import { Usuario } from './domain/usuario.entity';
import { UsuarioSesionDto } from './dto/sesion.dto';

export class UsuarioMapper {
  static aSesionDto(usuario: Usuario): UsuarioSesionDto {
    return {
      idUsuario: usuario.idUsuario,
      nombres: usuario.nombres,
      apellidos: usuario.apellidos,
      email: usuario.email,
      rol: usuario.rol,
    };
  }
}
