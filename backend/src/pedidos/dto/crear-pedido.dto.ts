export interface CrearPedidoDetalleDto {
  idProductoVariante: number;
  idCotizacion?: number;
  cantidad: number;
}

export interface CrearPedidoDto {
  items: CrearPedidoDetalleDto[];
}
