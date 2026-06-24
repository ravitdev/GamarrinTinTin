export interface ConfirmarRegistroClienteDto {
  email: string;
  codigo: string;
}

export interface AnularRegistroClienteDto {
  token: string;
}
