import { Usuario } from './domain/usuario.entity';

export interface IUsuarioRepository {
  guardar(usuario: Usuario): Promise<boolean>;
  actualizar(usuario: Usuario): Promise<boolean>;
  desactivar(idUsuario: number): Promise<boolean>;
  buscarPorId(idUsuario: number): Promise<Usuario | null>;
  buscarPorEmail(email: string): Promise<Usuario | null>;
  existePorEmail(email: string): Promise<boolean>;
  existePorDocumento(dniRuc: string): Promise<boolean>;
  listarUsuarios(): Promise<Usuario[]>;
}
