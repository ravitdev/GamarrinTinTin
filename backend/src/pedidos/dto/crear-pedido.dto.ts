export type TipoEntregaDto = 'ENVIO' | 'RECOJO_TIENDA';

export interface CrearPedidoDetalleDto {
  idProductoVariante: number;
  idCotizacion?: number;
  cantidad: number;
}

export interface CrearPedidoDto {
  items: CrearPedidoDetalleDto[];
  tipoEntrega: TipoEntregaDto;
  direccionEnvio?: string | null;
}