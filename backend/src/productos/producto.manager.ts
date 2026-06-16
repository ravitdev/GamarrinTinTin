import { Injectable } from '@nestjs/common';
import { CambiarEstadoProductoDto } from './dto/cambiar-estado-producto.dto';
import { ModificarProductoDto } from './dto/modificar-producto.dto';
import type { ConsultarCatalogoProductosDto } from './dto/consultar-catalogo-productos.dto';
import {
  ProductoCatalogoResponseDto,
  ProductoDetalleResponseDto,
} from './dto/producto-response.dto';
import { RegistrarProductoDto } from './dto/registrar-producto.dto';
import { ProductoMapper } from './producto.mapper';
import { ProductoRepository } from './producto.repository';

@Injectable()
export class ProductoManager {
  constructor(private readonly productoRepository: ProductoRepository) {}

  async consultarCatalogo(
    filtros: ConsultarCatalogoProductosDto = {},
  ): Promise<ProductoCatalogoResponseDto[]> {
    const productos = await this.productoRepository.listarCatalogo({
      buscar:
        filtros.buscar !== undefined
          ? this.normalizarTexto(filtros.buscar)
          : undefined,
      idCategoria:
        filtros.idCategoria !== undefined
          ? Number(filtros.idCategoria)
          : undefined,
      esPersonalizable:
        filtros.esPersonalizable !== undefined
          ? filtros.esPersonalizable === 'true'
          : undefined,
    });

    return productos.map((producto) => ProductoMapper.aCatalogoDto(producto));
  }

  async listarProductosParaAdministracion(): Promise<ProductoDetalleResponseDto[]> {
    const productos = await this.productoRepository.listarTodosParaAdministracion();
    return productos.map((producto) => ProductoMapper.aDetalleDto(producto));
  }

  async consultarDetalleProducto(
    idProducto: number,
  ): Promise<ProductoDetalleResponseDto> {
    this.validarId(idProducto, 'El producto no es válido.');

    const producto = await this.productoRepository.buscarDetallePorId(idProducto);

    if (!producto) {
      throw new Error('Producto no encontrado.');
    }

    return ProductoMapper.aDetalleDto(producto);
  }

  async registrarProducto(
    datos: RegistrarProductoDto,
  ): Promise<ProductoDetalleResponseDto> {
    this.validarDatosRegistro(datos);

    const nombreNormalizado = this.normalizarTexto(datos.nombre);
    await this.validarNombreDisponible(nombreNormalizado);

    const producto = await this.productoRepository.registrar({
      idCategoria: datos.idCategoria,
      nombre: nombreNormalizado,
      descripcion: this.normalizarTexto(datos.descripcion),
      precioBase: datos.precioBase,
      esPersonalizable: datos.esPersonalizable,
      variantes: datos.variantes.map((variante) => ({
        colorNombre: this.normalizarTexto(variante.colorNombre),
        colorHex: this.normalizarColorHex(variante.colorHex),
        talla: variante.talla,
        stock: variante.stock,
      })),
      imagenes: datos.imagenes.map((imagen) => ({
        colorHex: this.normalizarColorHex(imagen.colorHex),
        lado: imagen.lado,
        urlImagen: this.normalizarTexto(imagen.urlImagen),
        displayOrder: imagen.displayOrder ?? 0,
      })),
      descuentosVolumen: (datos.descuentosVolumen ?? []).map((descuento) => ({
        cantidadMinima: descuento.cantidadMinima,
        porcentajeDescuento: descuento.porcentajeDescuento,
      })),
    });

    return ProductoMapper.aDetalleDto(producto);
  }

  async modificarProducto(
    idProducto: number,
    datos: ModificarProductoDto,
  ): Promise<ProductoDetalleResponseDto> {
    this.validarId(idProducto, 'El producto no es válido.');
    this.validarDatosModificacion(datos);

    const nombreNormalizado =
      datos.nombre !== undefined ? this.normalizarTexto(datos.nombre) : undefined;

    if (nombreNormalizado !== undefined) {
      await this.validarNombreDisponible(nombreNormalizado, idProducto);
    }

    const producto = await this.productoRepository.modificar(idProducto, {
      idCategoria: datos.idCategoria,
      nombre: nombreNormalizado,
      descripcion:
        datos.descripcion !== undefined
          ? this.normalizarTexto(datos.descripcion)
          : undefined,
      precioBase: datos.precioBase,
      esPersonalizable: datos.esPersonalizable,
      variantes: datos.variantes?.map((variante) => ({
        colorNombre: this.normalizarTexto(variante.colorNombre),
        colorHex: this.normalizarColorHex(variante.colorHex),
        talla: variante.talla,
        stock: variante.stock,
      })),
      imagenes: datos.imagenes?.map((imagen) => ({
        colorHex: this.normalizarColorHex(imagen.colorHex),
        lado: imagen.lado,
        urlImagen: this.normalizarTexto(imagen.urlImagen),
        displayOrder: imagen.displayOrder ?? 0,
      })),
      descuentosVolumen: datos.descuentosVolumen?.map((descuento) => ({
        cantidadMinima: descuento.cantidadMinima,
        porcentajeDescuento: descuento.porcentajeDescuento,
      })),
    });

    return ProductoMapper.aDetalleDto(producto);
  }

  async desactivarProducto(idProducto: number): Promise<boolean> {
    this.validarId(idProducto, 'El producto no es válido.');

    const producto = await this.productoRepository.buscarDetallePorId(idProducto);

    if (!producto) {
      throw new Error('Producto no encontrado.');
    }

    return this.productoRepository.desactivar(idProducto);
  }

  async cambiarEstadoProducto(
    idProducto: number,
    datos: CambiarEstadoProductoDto,
  ): Promise<ProductoDetalleResponseDto> {
    this.validarId(idProducto, 'El producto no es válido.');
    this.validarBooleano(
      datos.esActivo,
      'Debe indicar si el producto queda activo o inactivo.',
    );

    const producto = await this.productoRepository.cambiarEstado(
      idProducto,
      datos.esActivo,
    );

    return ProductoMapper.aDetalleDto(producto);
  }

  private validarDatosRegistro(datos: RegistrarProductoDto): void {
    this.validarId(datos.idCategoria, 'La categoría del producto no es válida.');
    this.validarTextoObligatorio(datos.nombre, 'El nombre del producto es obligatorio.');
    this.validarTextoObligatorio(
      datos.descripcion,
      'La descripción del producto es obligatoria.',
    );
    this.validarPrecio(datos.precioBase);
    this.validarBooleano(
      datos.esPersonalizable,
      'Debe indicar si el producto es personalizable.',
    );
    this.validarVariantes(datos.variantes);
    this.validarImagenes(datos.imagenes);
    this.validarDescuentos(datos.descuentosVolumen ?? []);
  }

  private validarDatosModificacion(datos: ModificarProductoDto): void {
    const tieneCambios =
      datos.idCategoria !== undefined ||
      datos.nombre !== undefined ||
      datos.descripcion !== undefined ||
      datos.precioBase !== undefined ||
      datos.esPersonalizable !== undefined ||
      datos.variantes !== undefined ||
      datos.imagenes !== undefined ||
      datos.descuentosVolumen !== undefined;

    if (!tieneCambios) {
      throw new Error('Debe enviar al menos un dato para modificar.');
    }

    if (datos.idCategoria !== undefined) {
      this.validarId(datos.idCategoria, 'La categoría del producto no es válida.');
    }

    if (datos.nombre !== undefined) {
      this.validarTextoObligatorio(
        datos.nombre,
        'El nombre del producto es obligatorio.',
      );
    }

    if (datos.descripcion !== undefined) {
      this.validarTextoObligatorio(
        datos.descripcion,
        'La descripción del producto es obligatoria.',
      );
    }

    if (datos.precioBase !== undefined) {
      this.validarPrecio(datos.precioBase);
    }

    if (datos.esPersonalizable !== undefined) {
      this.validarBooleano(
        datos.esPersonalizable,
        'Debe indicar si el producto es personalizable.',
      );
    }

    if (datos.variantes !== undefined) {
      this.validarVariantes(datos.variantes);
    }

    if (datos.imagenes !== undefined) {
      this.validarImagenes(datos.imagenes);
    }

    if (datos.descuentosVolumen !== undefined) {
      this.validarDescuentos(datos.descuentosVolumen);
    }
  }

  private validarVariantes(variantes: RegistrarProductoDto['variantes']): void {
    if (!variantes || variantes.length === 0) {
      throw new Error('El producto debe tener al menos una variante.');
    }

    const combinaciones = new Set<string>();

    for (const variante of variantes) {
      this.validarTextoObligatorio(
        variante.colorNombre,
        'El nombre del color es obligatorio.',
      );

      this.validarColorHex(variante.colorHex);

      if (!['S', 'M', 'L', 'XL'].includes(variante.talla)) {
        throw new Error('La talla del producto no es válida.');
      }

      if (!Number.isInteger(variante.stock) || variante.stock < 0) {
        throw new Error('El stock debe ser un entero mayor o igual a cero.');
      }

      const clave = `${this.normalizarColorHex(variante.colorHex)}-${variante.talla}`;

      if (combinaciones.has(clave)) {
        throw new Error('No se permiten variantes duplicadas por color y talla.');
      }

      combinaciones.add(clave);
    }
  }

  private validarImagenes(imagenes: RegistrarProductoDto['imagenes']): void {
    if (!imagenes || imagenes.length === 0) {
      throw new Error('El producto debe tener al menos una imagen.');
    }

    const combinaciones = new Set<string>();

    for (const imagen of imagenes) {
      this.validarColorHex(imagen.colorHex);

      if (!['FRONT', 'BACK'].includes(imagen.lado)) {
        throw new Error('El lado de la imagen no es válido.');
      }

      this.validarTextoObligatorio(
        imagen.urlImagen,
        'La URL de la imagen es obligatoria.',
      );

      if (
        imagen.displayOrder !== undefined &&
        (!Number.isInteger(imagen.displayOrder) || imagen.displayOrder < 0)
      ) {
        throw new Error('El orden de visualización debe ser un entero mayor o igual a cero.');
      }

      const clave = `${this.normalizarColorHex(imagen.colorHex)}-${imagen.lado}`;

      if (combinaciones.has(clave)) {
        throw new Error('No se permiten imágenes duplicadas por color y lado.');
      }

      combinaciones.add(clave);
    }
  }

  private validarDescuentos(
    descuentos: NonNullable<RegistrarProductoDto['descuentosVolumen']>,
  ): void {
    const cantidades = new Set<number>();

    for (const descuento of descuentos) {
      if (
        !Number.isInteger(descuento.cantidadMinima) ||
        descuento.cantidadMinima <= 0
      ) {
        throw new Error('La cantidad mínima del descuento debe ser mayor a cero.');
      }

      if (
        typeof descuento.porcentajeDescuento !== 'number' ||
        descuento.porcentajeDescuento <= 0 ||
        descuento.porcentajeDescuento > 100
      ) {
        throw new Error('El porcentaje de descuento debe ser mayor a 0 y menor o igual a 100.');
      }

      if (cantidades.has(descuento.cantidadMinima)) {
        throw new Error('No se permiten descuentos duplicados por cantidad mínima.');
      }

      cantidades.add(descuento.cantidadMinima);
    }
  }

  private validarId(id: number, mensaje: string): void {
    if (!Number.isInteger(id) || id <= 0) {
      throw new Error(mensaje);
    }
  }

  private validarPrecio(precio: number): void {
    if (typeof precio !== 'number' || precio <= 0) {
      throw new Error('El precio base debe ser mayor a cero.');
    }
  }

  private validarBooleano(valor: boolean, mensaje: string): void {
    if (typeof valor !== 'boolean') {
      throw new Error(mensaje);
    }
  }

  private validarTextoObligatorio(valor: string, mensaje: string): void {
    if (!valor || valor.trim().length === 0) {
      throw new Error(mensaje);
    }
  }

  private validarColorHex(colorHex: string): void {
    const colorNormalizado = this.normalizarColorHex(colorHex);

    if (!/^#[0-9A-F]{6}$/.test(colorNormalizado)) {
      throw new Error('El color debe tener formato hexadecimal válido.');
    }
  }

  private normalizarTexto(valor: string | undefined): string {
    return valor?.trim() ?? '';
  }

  private normalizarColorHex(colorHex: string): string {
    return this.normalizarTexto(colorHex).toUpperCase();
  }

  private async validarNombreDisponible(
    nombre: string,
    idProductoExcluir?: number,
  ): Promise<void> {
    const existe = await this.productoRepository.existeNombreActivo(
      nombre,
      idProductoExcluir,
    );

    if (existe) {
      throw new Error('Ya existe un producto activo con ese nombre.');
    }
  }
}
