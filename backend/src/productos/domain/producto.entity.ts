export type Talla = 'S' | 'M' | 'L' | 'XL';

export type LadoProducto = 'FRONT' | 'BACK';

export class CategoriaResumen {
  constructor(
    public idCategoria: number,
    public nombre: string,
  ) {}
}

export class ProductoVariante {
  constructor(
    public idProductoVariante: number,
    public idProducto: number,
    public colorNombre: string,
    public colorHex: string,
    public talla: Talla,
    public stock: number,
    public esActivo: boolean,
  ) {}
}

export class ProductoImagen {
  constructor(
    public idProductoImagen: number,
    public idProducto: number,
    public colorHex: string,
    public lado: LadoProducto,
    public urlImagen: string,
    public displayOrder: number,
    public esActivo: boolean,
  ) {}
}

export class DescuentoVolumen {
  constructor(
    public idDescuentoVolumen: number,
    public idProducto: number,
    public cantidadMinima: number,
    public porcentajeDescuento: number,
    public esActivo: boolean,
  ) {}
}

export class Producto {
  constructor(
    public idProducto: number,
    public idCategoria: number,
    public nombre: string,
    public descripcion: string,
    public precioBase: number,
    public esPersonalizable: boolean,
    public esActivo: boolean,
    public fechaCreacion: Date,
    public fechaActualizacion: Date,
    public categoria?: CategoriaResumen,
    public variantes: ProductoVariante[] = [],
    public imagenes: ProductoImagen[] = [],
    public descuentosVolumen: DescuentoVolumen[] = [],
  ) {}

  estaActivo(): boolean {
    return this.esActivo;
  }
}