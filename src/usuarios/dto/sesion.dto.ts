import { RolUsuario } from '../domain/usuario.entity';

export interface UsuarioSesionDto {
  idUsuario: number;
  nombres: string;
  apellidos: string;
  email: string;
  rol: RolUsuario;
}

export interface SesionDto {
  accessToken: string;
  usuario: UsuarioSesionDto;
}
