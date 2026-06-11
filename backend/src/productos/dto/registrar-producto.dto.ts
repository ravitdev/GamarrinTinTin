import { LadoProducto, Talla } from '../domain/producto.entity';

export interface RegistrarProductoVarianteDto {
  colorNombre: string;
  colorHex: string;
  talla: Talla;
  stock: number;
}

export interface RegistrarProductoImagenDto {
  colorHex: string;
  lado: LadoProducto;
  urlImagen: string;
  displayOrder?: number;
}

export interface RegistrarDescuentoVolumenDto {
  cantidadMinima: number;
  porcentajeDescuento: number;
}

export interface RegistrarProductoDto {
  idCategoria: number;
  nombre: string;
  descripcion: string;
  precioBase: number;
  esPersonalizable: boolean;
  variantes: RegistrarProductoVarianteDto[];
  imagenes: RegistrarProductoImagenDto[];
  descuentosVolumen?: RegistrarDescuentoVolumenDto[];
}