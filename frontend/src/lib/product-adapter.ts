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
  const tallas: string[] = Array.from(
    new Set((backendProduct.variantes || []).map((v: any) => v.talla)),
  );

  // 3. Map images (preserve full objects with lado/colorHex)
  const imagenes: ProductoImagen[] = (backendProduct.imagenes || []).map((img: any) => ({
    idProductoImagen: img.idProductoImagen,
    idProducto: backendProduct.idProducto,
    colorHex: img.colorHex,
    lado: img.lado,
    ladoProducto: img.lado,
    urlImagen: img.urlImagen || '/placeholder.svg',
    displayOrder: img.displayOrder ?? 0,
  }));

  // 4. Map colors (colores) — derive FRONT/BACK URLs from imagenes by colorHex + lado
  let colores: any[] = [];
  if (backendProduct.variantes && backendProduct.variantes.length > 0) {
    const colorMap = new Map<string, any>();
    backendProduct.variantes.forEach((v: any, index: number) => {
      if (!colorMap.has(v.colorHex)) {
        const colorHexUpper = v.colorHex?.toUpperCase();
        const frontImg = (backendProduct.imagenes || []).find(
          (img: any) =>
            img.colorHex?.toUpperCase() === colorHexUpper &&
            img.lado === 'FRONT',
        );
        const backImg = (backendProduct.imagenes || []).find(
          (img: any) =>
            img.colorHex?.toUpperCase() === colorHexUpper &&
            img.lado === 'BACK',
        );
        const fallbackUrl = backendProduct.imagenPrincipal || '/placeholder.svg';
        colorMap.set(v.colorHex, {
          idColor: index + 1,
          nombre: v.colorNombre,
          codigoHex: v.colorHex,
          hexCode: v.colorHex,
          urlImagen: frontImg?.urlImagen || backImg?.urlImagen || fallbackUrl,
          urlImagenFrontal: frontImg?.urlImagen || null,
          urlImagenTrasera: backImg?.urlImagen || null,
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
          hexCode: colorHex,
          urlImagen: img.urlImagen || backendProduct.imagenPrincipal || '/placeholder.svg',
          urlImagenFrontal: img.lado === 'FRONT' ? img.urlImagen : null,
          urlImagenTrasera: img.lado === 'BACK' ? img.urlImagen : null,
        });
      }
    });
    colores = Array.from(colorMap.values());
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
    stock: (backendProduct.variantes || []).reduce(
      (total: number, variante: any) => total + (Number(variante.stock) || 0),
      0,
    ),
    categoria, // backward-compatibility for UI (expects string)
    categoriaObjeto: backendProduct.categoria, // original category object
    tallas,
    colores,
    descuentosVolumen,
    disenosPredefinidos: [], // default mock empty array
    imagenes: imagenes.length > 0 ? imagenes : (backendProduct.imagenPrincipal ? [{
      idProducto: backendProduct.idProducto,
      colorHex: backendProduct.variantes?.[0]?.colorHex || '#000000',
      lado: 'FRONT',
      ladoProducto: 'FRONT',
      urlImagen: backendProduct.imagenPrincipal,
      displayOrder: 0,
    }] : []),
    tipoDiseno: backendProduct.esPersonalizable ? 'personalizable' : 'predefinido',
    esPersonalizable: backendProduct.esPersonalizable,
    estado: backendProduct.esActivo ? 'ACTIVO' : 'INACTIVO',
  };
}
