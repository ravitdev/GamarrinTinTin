import { RolUsuario } from '../domain/usuario.entity';

export interface UsuarioAutenticado {
  idUsuario: number;
  email: string;
  rol: RolUsuario;
}
