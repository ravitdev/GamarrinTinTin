// src/producto.manager.ts
import { IProductoRepository } from './iproducto.repository';
import { Producto, DescuentoPorVolumen, TallaVariedad } from './domain/producto.entity';

export class ProductoManager {
  constructor(private readonly productoRepository: IProductoRepository) {}

  // =========================================================
  // CU 1: Registrar producto en el catálogo
  // =========================================================
  async registrarProducto(
    idProducto: number,
    nombre: string,
    descripcion: string,
    categoria: string,
    tallas: TallaVariedad[],
    disenos: string[]
  ): Promise<string> {
    // Flujo básico: Validación de duplicados
    const existe = await this.productoRepository.buscarPorNombre(nombre);
    if (existe) {
      throw new Error('Error: Ya existe un producto con ese nombre en el catálogo.');
    }

    const nuevoProducto = new Producto(
      idProducto, nombre, descripcion, categoria, 'activo', tallas, disenos, []
    );

    await this.productoRepository.guardar(nuevoProducto);
    return "Producto registrado exitosamente.";
  }

  // =========================================================
  // CU 2: Modificar producto del catálogo (Incluye Adicionar Inventario)
  // =========================================================
  async modificarProducto(productoModificado: Producto): Promise<string> {
    // Excepción: Producto no encontrado
    const productoExistente = await this.productoRepository.buscarPorId(productoModificado.idProducto);
    if (!productoExistente || productoExistente.estado === 'inactivo') {
      throw new Error('Error: El producto no existe o se encuentra inactivo y no puede ser modificado.');
    }

    // Excepción: Datos inválidos
    if (!productoModificado.nombre || productoModificado.tallas.length === 0) {
      throw new Error('Error: Faltan campos obligatorios o el formato es incorrecto.');
    }

    await this.productoRepository.actualizar(productoModificado);
    return "Información del producto actualizada correctamente.";
  }

  // =========================================================
  // CU 3: Eliminación lógica (Desactivar / Activar)
  // =========================================================
  async cambiarEstadoProducto(idProducto: number, nuevoEstado: 'activo' | 'inactivo'): Promise<string> {
    const producto = await this.productoRepository.buscarPorId(idProducto);
    if (!producto) throw new Error('Producto no encontrado.');

    // Excepción: El producto tiene pedidos en proceso
    if (nuevoEstado === 'inactivo') {
      const tienePedidos = await this.productoRepository.tienePedidosEnProceso(idProducto);
      if (tienePedidos) {
        throw new Error('No es posible desactivar el producto porque tiene pedidos en proceso asociados.');
      }
    }

    producto.estado = nuevoEstado;
    await this.productoRepository.actualizar(producto);
    
    return nuevoEstado === 'inactivo' 
      ? "El producto ha sido desactivado del catálogo exitosamente."
      : "El producto ha sido activado en el catálogo exitosamente.";
  }

  // =========================================================
  // CU 4: Agregar / Eliminar descuentos por volumen
  // =========================================================
  async configurarDescuento(idProducto: number, cantidadMinima: number, porcentaje: number): Promise<string> {
    const producto = await this.productoRepository.buscarPorId(idProducto);
    if (!producto) throw new Error('Producto no encontrado.');

    // Excepción: Rango duplicado
    const rangoDuplicado = producto.descuentos.find(d => d.cantidadMinima === cantidadMinima);
    if (rangoDuplicado) {
      throw new Error('Ya existe un rango de descuento con esa cantidad mínima para este producto. Por favor ingrese un valor diferente.');
    }

    // Excepción: Datos inválidos
    if (cantidadMinima <= 0 || porcentaje <= 0 || porcentaje >= 100) {
      throw new Error('Error: La cantidad mínima o el porcentaje ingresado no son valores válidos.');
    }

    const nuevoId = producto.descuentos.length + 1;
    producto.descuentos.push(new DescuentoPorVolumen(nuevoId, cantidadMinima, porcentaje));
    
    await this.productoRepository.actualizar(producto);
    return "Rango de descuento registrado exitosamente.";
  }

  async eliminarDescuento(idProducto: number, idDescuento: number): Promise<string> {
    const producto = await this.productoRepository.buscarPorId(idProducto);
    if (!producto) throw new Error('Producto no encontrado.');

    producto.descuentos = producto.descuentos.filter(d => d.idDescuento !== idDescuento);
    await this.productoRepository.actualizar(producto);
    return "Rango eliminado y lista actualizada.";
  }

  // =========================================================
  // CU 5: Consultar catálogo de productos
  // =========================================================
  async consultarCatalogo(categoriaSeleccionada?: string, tallaFiltro?: string): Promise<any[]> {
    const catalogo = await this.productoRepository.obtenerCatalogoActivo(categoriaSeleccionada);
    
    // Excepción: Categoría vacía
    if (catalogo.length === 0) {
      throw new Error('No hay productos disponibles en esta categoría por el momento.');
    }

    // Flujo Alternativo: Filtros adicionales (Ej: Talla)
    let listadoVisible = catalogo;
    if (tallaFiltro) {
      listadoVisible = listadoVisible.filter(p => p.tallas.some(t => t.nombre === tallaFiltro));
    }

    // Retornamos la vista simplificada para el cliente (Postcondición)
    return listadoVisible.map(p => ({
      imagenPrincipal: p.disenos[0],
      nombre: p.nombre,
      precioDesde: Math.min(...p.tallas.map(t => t.precio)), // Muestra el precio más bajo
      tiposDiseno: p.disenos.join(', ')
    }));
  }
}