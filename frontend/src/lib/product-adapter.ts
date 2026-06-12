import type { Producto, ProductoVariante, ProductoImagen } from './types';

/**
 * Maps NestJS Backend Product DTOs (relational variantes/imagenes/descuentosVolumen)
 * to the simplified format expected by the frontend v0 pages.
 */
export function mapBackendProductToFrontend(backendProduct: any): any {
  if (!backendProduct) return null;

  const precioBase = Number(backendProduct.precioBase || 0);

  // 1. Map volume discounts
  const descuentosVolumen = (backendProduct.descuentosVolumen || []).map((d: any) => ({
    idDescuento: d.idDescuentoVolumen,
    cantidadMinima: d.cantidadMinima,
    porcentajeDescuento: Number(d.porcentajeDescuento),
  }));

  // 2. Extract unique sizes (tallas)
  let tallas: string[] = [];
  if (backendProduct.variantes && backendProduct.variantes.length > 0) {
    tallas = Array.from(new Set(backendProduct.variantes.map((v: any) => v.talla)));
  } else {
    tallas = ['S', 'M', 'L', 'XL'];
  }

  // 3. Map images
  const imagenes = (backendProduct.imagenes || []).map((img: any) => img.urlImagen);

  // 4. Map colors (colores)
  let colores: any[] = [];
  if (backendProduct.variantes && backendProduct.variantes.length > 0) {
    const colorMap = new Map<string, any>();
    backendProduct.variantes.forEach((v: any, index: number) => {
      if (!colorMap.has(v.colorHex)) {
        // Find matching image URL for this color
        const matchingImg = (backendProduct.imagenes || []).find(
          (img: any) => img.colorHex.toUpperCase() === v.colorHex.toUpperCase()
        );
        colorMap.set(v.colorHex, {
          idColor: index + 1,
          nombre: v.colorNombre,
          codigoHex: v.colorHex,
          urlImagen: matchingImg?.urlImagen || backendProduct.imagenPrincipal || '/placeholder.svg',
        });
      }
    });
    colores = Array.from(colorMap.values());
  } else if (backendProduct.imagenes && backendProduct.imagenes.length > 0) {
    const colorMap = new Map<string, any>();
    backendProduct.imagenes.forEach((img: any, index: number) => {
      const colorHex = img.colorHex || '#FFFFFF';
      if (!colorMap.has(colorHex)) {
        colorMap.set(colorHex, {
          idColor: index + 1,
          nombre: img.colorHex === '#FFFFFF' ? 'Blanco' : 'Color ' + (index + 1),
          codigoHex: colorHex,
          urlImagen: img.urlImagen || '/placeholder.svg',
        });
      }
    });
    colores = Array.from(colorMap.values());
  } else {
    // Fallback if no variants and no images
    colores = [
      {
        idColor: 1,
        nombre: 'Blanco',
        codigoHex: '#FFFFFF',
        urlImagen: backendProduct.imagenPrincipal || '/placeholder.svg',
      },
    ];
  }

  // 5. Map categories
  const categoria = backendProduct.categoria ? backendProduct.categoria.nombre : 'Prenda';

  return {
    ...backendProduct,
    idProducto: backendProduct.idProducto,
    nombre: backendProduct.nombre,
    descripcion: backendProduct.descripcion,
    precioBase,
    precio: precioBase, // backward-compatibility for UI
    stock: backendProduct.stock || 100,
    categoria, // backward-compatibility for UI (expects string)
    categoriaObjeto: backendProduct.categoria, // original category object
    tallas,
    colores,
    descuentosVolumen,
    disenosPredefinidos: [], // default mock empty array
    imagenes: imagenes.length > 0 ? imagenes : [backendProduct.imagenPrincipal || '/placeholder.svg'],
    estado: backendProduct.esActivo ? 'ACTIVO' : 'INACTIVO',
  };
}
