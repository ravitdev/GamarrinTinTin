export interface ConfirmarRegistroClienteDto {
  email: string;
  codigo: string;
}

export interface ReenviarCodigoRegistroClienteDto {
  email: string;
}

export interface AnularRegistroClienteDto {
  token: string;
}
