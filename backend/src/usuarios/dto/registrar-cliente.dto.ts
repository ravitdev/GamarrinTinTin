export interface RegistrarClienteDto {
  nombres: string;
  apellidos: string;
  email: string;
  contrasena: string;
  telefono: string;
  tipoDocumento: 'DNI' | 'RUC';
  numeroDocumento: string;
  direccion?: string | null;
}
