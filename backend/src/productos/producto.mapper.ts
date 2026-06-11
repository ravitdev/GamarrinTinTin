import {
  CategoriaResumen,
  DescuentoVolumen,
  LadoProducto,
  Producto,
  ProductoImagen,
  ProductoVariante,
  Talla,
} from './domain/producto.entity';
import {
  ProductoCatalogoResponseDto,
  ProductoDetalleResponseDto,
} from './dto/producto-response.dto';

type DecimalLike = number | { toNumber(): number };

interface CategoriaRegistro {
  idCategoria: number;
  nombre: string;
}

interface ProductoVarianteRegistro {
  idProductoVariante: number;
  idProducto: number;
  colorNombre: string;
  colorHex: string;
  talla: Talla;
  stock: number;
  esActivo: boolean;
}

interface ProductoImagenRegistro {
  idProductoImagen: number;
  idProducto: number;
  colorHex: string;
  lado: LadoProducto;
  urlImagen: string;
  displayOrder: number;
  esActivo: boolean;
}

interface DescuentoVolumenRegistro {
  idDescuentoVolumen: number;
  idProducto: number;
  cantidadMinima: number;
  porcentajeDescuento: DecimalLike;
  esActivo: boolean;
}

export interface ProductoRegistro {
  idProducto: number;
  idCategoria: number;
  nombre: string;
  descripcion: string;
  precioBase: DecimalLike;
  esPersonalizable: boolean;
  esActivo: boolean;
  fechaCreacion: Date;
  fechaActualizacion: Date;
  categoria?: CategoriaRegistro | null;
  variantes?: ProductoVarianteRegistro[];
  imagenes?: ProductoImagenRegistro[];
  descuentosVolumen?: DescuentoVolumenRegistro[];
}

export class ProductoMapper {
  static aEntidad(registro: ProductoRegistro): Producto {
    return new Producto(
      registro.idProducto,
      registro.idCategoria,
      registro.nombre,
      registro.descripcion,
      this.aNumero(registro.precioBase),
      registro.esPersonalizable,
      registro.esActivo,
      new Date(registro.fechaCreacion),
      new Date(registro.fechaActualizacion),
      registro.categoria
        ? new CategoriaResumen(
            registro.categoria.idCategoria,
            registro.categoria.nombre,
          )
        : undefined,
      (registro.variantes ?? []).map(
        (variante) =>
          new ProductoVariante(
            variante.idProductoVariante,
            variante.idProducto,
            variante.colorNombre,
            variante.colorHex,
            variante.talla,
            variante.stock,
            variante.esActivo,
          ),
      ),
      (registro.imagenes ?? []).map(
        (imagen) =>
          new ProductoImagen(
            imagen.idProductoImagen,
            imagen.idProducto,
            imagen.colorHex,
            imagen.lado,
            imagen.urlImagen,
            imagen.displayOrder,
            imagen.esActivo,
          ),
      ),
      (registro.descuentosVolumen ?? []).map(
        (descuento) =>
          new DescuentoVolumen(
            descuento.idDescuentoVolumen,
            descuento.idProducto,
            descuento.cantidadMinima,
            this.aNumero(descuento.porcentajeDescuento),
            descuento.esActivo,
          ),
      ),
    );
  }

  static aCatalogoDto(producto: Producto): ProductoCatalogoResponseDto {
    const imagenPrincipal =
      producto.imagenes
        .filter((imagen) => imagen.esActivo)
        .sort((a, b) => a.displayOrder - b.displayOrder)[0]?.urlImagen ?? null;

    return {
      idProducto: producto.idProducto,
      nombre: producto.nombre,
      descripcion: producto.descripcion,
      precioBase: producto.precioBase,
      esPersonalizable: producto.esPersonalizable,
      categoria: producto.categoria
        ? {
            idCategoria: producto.categoria.idCategoria,
            nombre: producto.categoria.nombre,
          }
        : undefined,
      imagenPrincipal,
    };
  }

  static aDetalleDto(producto: Producto): ProductoDetalleResponseDto {
    return {
      idProducto: producto.idProducto,
      idCategoria: producto.idCategoria,
      nombre: producto.nombre,
      descripcion: producto.descripcion,
      precioBase: producto.precioBase,
      esPersonalizable: producto.esPersonalizable,
      esActivo: producto.esActivo,
      categoria: producto.categoria
        ? {
            idCategoria: producto.categoria.idCategoria,
            nombre: producto.categoria.nombre,
          }
        : undefined,
      variantes: producto.variantes
        .filter((variante) => variante.esActivo)
        .map((variante) => ({
          idProductoVariante: variante.idProductoVariante,
          colorNombre: variante.colorNombre,
          colorHex: variante.colorHex,
          talla: variante.talla,
          stock: variante.stock,
        })),
      imagenes: producto.imagenes
        .filter((imagen) => imagen.esActivo)
        .sort((a, b) => a.displayOrder - b.displayOrder)
        .map((imagen) => ({
          idProductoImagen: imagen.idProductoImagen,
          colorHex: imagen.colorHex,
          lado: imagen.lado,
          urlImagen: imagen.urlImagen,
          displayOrder: imagen.displayOrder,
        })),
      descuentosVolumen: producto.descuentosVolumen
        .filter((descuento) => descuento.esActivo)
        .sort((a, b) => a.cantidadMinima - b.cantidadMinima)
        .map((descuento) => ({
          idDescuentoVolumen: descuento.idDescuentoVolumen,
          cantidadMinima: descuento.cantidadMinima,
          porcentajeDescuento: descuento.porcentajeDescuento,
        })),
    };
  }

  private static aNumero(valor: DecimalLike): number {
    return typeof valor === 'number' ? valor : valor.toNumber();
  }
}