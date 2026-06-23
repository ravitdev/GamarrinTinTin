export interface ActualizarEstadoPedidoDto {
  estado:
    | 'REGISTRADO'
    | 'CONFIRMADO'
    | 'PROCESANDO'
    | 'ENVIADO'
    | 'ENTREGADO'
    | 'CANCELADO';
}