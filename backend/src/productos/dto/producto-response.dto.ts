import { LadoProducto, Talla } from '../domain/producto.entity';

export interface CategoriaProductoResponseDto {
  idCategoria: number;
  nombre: string;
}

export interface ProductoCatalogoResponseDto {
  idProducto: number;
  idCategoria: number;
  nombre: string;
  descripcion: string;
  precioBase: number;
  esPersonalizable: boolean;
  esActivo: boolean;
  fechaCreacion: Date;
  categoria?: CategoriaProductoResponseDto;
  imagenPrincipal?: string | null;
  variantes: ProductoVarianteResponseDto[];
}

export interface ProductoVarianteResponseDto {
  idProductoVariante: number;
  colorNombre: string;
  colorHex: string;
  talla: Talla;
  stock: number;
}

export interface ProductoImagenResponseDto {
  idProductoImagen: number;
  colorHex: string;
  lado: LadoProducto;
  urlImagen: string;
  displayOrder: number;
}

export interface DescuentoVolumenResponseDto {
  idDescuentoVolumen: number;
  cantidadMinima: number;
  porcentajeDescuento: number;
}

export interface ProductoDetalleResponseDto {
  idProducto: number;
  idCategoria: number;
  nombre: string;
  descripcion: string;
  precioBase: number;
  esPersonalizable: boolean;
  esActivo: boolean;
  categoria?: CategoriaProductoResponseDto;
  imagenPrincipal?: string | null;
  variantes: ProductoVarianteResponseDto[];
  imagenes: ProductoImagenResponseDto[];
  descuentosVolumen: DescuentoVolumenResponseDto[];
}