export type RolUsuario = 'CLIENTE' | 'VENDEDOR' | 'ADMINISTRADOR';

export type EstadoUsuario = 'ACTIVO' | 'INACTIVO';

export type TipoDocumento = 'DNI' | 'RUC';

export class Usuario {
  constructor(
    public idUsuario: number,
    public nombres: string,
    public apellidos: string,
    public email: string,
    public contrasenaHash: string,
    public telefono: string,
    public fechaRegistro: Date,
    public tipoDocumento: TipoDocumento,
    public numeroDocumento: string,
    public direccion: string,
    public rol: RolUsuario,
    public estado: EstadoUsuario,
  ) {}

  estaActivo(): boolean {
    return this.estado === 'ACTIVO';
  }
}
