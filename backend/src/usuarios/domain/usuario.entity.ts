export type RolUsuario = 'CLIENTE' | 'VENDEDOR' | 'ADMINISTRADOR';

export type EstadoUsuario = 'ACTIVO' | 'INACTIVO';

export class Usuario {
  constructor(
    public idUsuario: number,
    public nombres: string,
    public apellidos: string,
    public email: string,
    public contrasenaHash: string,
    public telefono: string,
    public fechaRegistro: Date,
    public dniRuc: string,
    public direccion: string,
    public rol: RolUsuario,
    public estado: EstadoUsuario,
  ) {}

  estaActivo(): boolean {
    return this.estado === 'ACTIVO';
  }
}
