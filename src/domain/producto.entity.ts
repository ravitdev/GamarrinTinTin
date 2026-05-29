// src/domain/producto.entity.ts

export class DescuentoPorVolumen {
  constructor(
    public idDescuento: number,
    public cantidadMinima: number,
    public porcentajeDescuento: number
  ) {}
}

export interface TallaVariedad {
  nombre: string; // S, M, L, XL
  precio: number;
  stock: number;
}

export type EstadoProducto = 'activo' | 'inactivo';

export class Producto {
  constructor(
    public idProducto: number,
    public nombre: string,
    public descripcion: string,
    public categoria: string, // Polos, Poleras, etc.
    public estado: EstadoProducto,
    public tallas: TallaVariedad[],
    public disenos: string[], // URLs de imágenes
    public descuentos: DescuentoPorVolumen[] = []
  ) {}
}