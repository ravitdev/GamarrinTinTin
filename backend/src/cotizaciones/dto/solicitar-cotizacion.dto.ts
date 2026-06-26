export interface ImagenPersonalizacionCotizacionDto {
  idDisenoPredefinido?: number | null;
  urlImagen: string;
  lado: 'FRONT' | 'BACK';
  xPosicion: number;
  yPosicion: number;
  anchoPorcentaje: number;
  altoPorcentaje: number;
  displayOrder?: number;
}

export interface SolicitarCotizacionDto {
  idProductoVariante: number;
  cantidad: number;
  razon: 'PERSONALIZACION' | 'STOCK_INSUFICIENTE';
  personalizacion?: {
    imagenes: ImagenPersonalizacionCotizacionDto[];
  };
}