import { Usuario } from './domain/usuario.entity';

export interface IUsuarioRepository {
  guardar(usuario: Usuario): Promise<Usuario>;
  actualizar(usuario: Usuario): Promise<boolean>;
  desactivar(idUsuario: number): Promise<boolean>;
  buscarPorId(idUsuario: number): Promise<Usuario | null>;
  buscarPorEmail(email: string): Promise<Usuario | null>;
  existePorEmail(email: string): Promise<boolean>;
  existePorDocumento(numeroDocumento: string): Promise<boolean>;
  listarUsuarios(): Promise<Usuario[]>;
  guardarRefreshToken(
    idUsuario: number,
    refreshTokenHash: string,
    fechaExpiracion: Date,
  ): Promise<boolean>;
  obtenerRefreshToken(
    idUsuario: number,
  ): Promise<{ refreshTokenHash: string; fechaExpiracion: Date } | null>;
  revocarRefreshToken(idUsuario: number): Promise<boolean>;
}
