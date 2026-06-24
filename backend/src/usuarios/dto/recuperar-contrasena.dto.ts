export interface SolicitarRecuperacionContrasenaDto {
  email: string;
}

export interface RestablecerContrasenaDto {
  token: string;
  contrasenaNueva: string;
}
