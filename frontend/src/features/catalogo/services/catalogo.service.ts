// ============================================================================
// CAPA DE SERVICIO (Catalogo) - Comunicacion HTTP con el backend NestJS
// ============================================================================

import { apiClient } from '@/lib/api-client';
import { products, categorias } from '@/lib/mock-data';
import { mapBackendProductToFrontend } from '@/lib/product-adapter';
import type { Producto, Talla, TipoProducto } from '@/lib/types';

export type CatalogoSort = 'relevance' | 'price-asc' | 'price-desc' | 'newest';

export interface CatalogoQuery {
  buscar?: string;
  categorias?: string[];
  tallas?: Talla[];
  tipoProducto?: TipoProducto[];
  tipoDiseno?: string[];
  sort?: CatalogoSort;
  page?: number;
  limit?: number;
}

export interface PaginatedProducts {
  data: Producto[];
  total: number;
  page: number;
  limit: number;
}

const CATEGORY_TO_ID: Record<string, string> = {
  polo: '1',
  polos: '1',
  polera: '2',
  poleras: '2',
};

function buildCatalogoUrl(query: CatalogoQuery): string {
  const params = new URLSearchParams();

  if (query.buscar?.trim()) {
    params.set('buscar', query.buscar.trim());
  }

  if (query.categorias?.length === 1) {
    const categoria = query.categorias[0].toLowerCase();
    const idCategoria = CATEGORY_TO_ID[categoria];

    if (idCategoria) {
      params.set('idCategoria', idCategoria);
    }
  }

  if (query.tipoDiseno?.length === 1) {
    const tipo = query.tipoDiseno[0];

    if (tipo === 'personalizable') {
      params.set('esPersonalizable', 'true');
    }

    if (tipo === 'predefinido') {
      params.set('esPersonalizable', 'false');
    }
  }

  const queryString = params.toString();

  return queryString ? `/productos?${queryString}` : '/productos';
}

function applyLocalFilters(data: Producto[], query: CatalogoQuery): Producto[] {
  let filtered = [...data];

  // Si hay más de una categoría seleccionada, el backend no puede resolverlo
  // con un solo idCategoria, así que se termina de filtrar localmente.
  if (query.categorias && query.categorias.length > 1) {
    filtered = filtered.filter((p) =>
      query.categorias!.some((catNameOrId) => {
        const catName = p.categoriaObjeto?.nombre || p.categoria || '';

        return (
          catName.toLowerCase().includes(catNameOrId.toLowerCase()) ||
          catNameOrId.toLowerCase().includes(catName.toLowerCase()) ||
          String(p.categoriaObjeto?.idCategoria) === catNameOrId
        );
      }),
    );
  }

  // Talla se filtra localmente porque está dentro de variantes del producto.
  if (query.tallas?.length) {
    filtered = filtered.filter((p) =>
      (p.tallas || []).some((t: any) => query.tallas!.includes(t as Talla)),
    );
  }

  if (query.sort === 'price-asc') {
    filtered.sort((a, b) => a.precioBase - b.precioBase);
  }

  if (query.sort === 'price-desc') {
    filtered.sort((a, b) => b.precioBase - a.precioBase);
  }

  if (query.sort === 'newest') {
    filtered.sort(
      (a, b) =>
        new Date(b.fechaCreacion || 0).getTime() -
        new Date(a.fechaCreacion || 0).getTime(),
    );
  }

  return filtered;
}

function paginate(data: Producto[], query: CatalogoQuery): PaginatedProducts {
  const page = query.page ?? 1;
  const limit = query.limit ?? data.length;
  const start = (page - 1) * limit;

  return {
    data: data.slice(start, start + limit),
    total: data.length,
    page,
    limit,
  };
}

export async function fetchCatalogo(
  query: CatalogoQuery = {},
): Promise<PaginatedProducts> {
  try {
    const url = buildCatalogoUrl(query);

    const rawProducts = await apiClient<any[]>(url, {
      method: 'GET',
      auth: false,
    });

    const mappedProducts = rawProducts.map(mapBackendProductToFrontend);
    const filteredProducts = applyLocalFilters(mappedProducts, query);

    return paginate(filteredProducts, query);
  } catch (error) {
    console.error('Error conectando catálogo con backend:', error);

    let data = [...products];

    if (query.buscar?.trim()) {
      const buscar = query.buscar.trim().toLowerCase();

      data = data.filter(
        (p) =>
          p.nombre.toLowerCase().includes(buscar) ||
          p.descripcion.toLowerCase().includes(buscar),
      );
    }

    if (query.categorias?.length) {
      data = data.filter((p) => {
        const cat = categorias.find((c) => c.idCategoria === p.idCategoria);
        if (!cat) return false;

        return query.categorias!.some(
          (catNameOrId) =>
            cat.nombre.toLowerCase().includes(catNameOrId.toLowerCase()) ||
            catNameOrId.toLowerCase().includes(cat.nombre.toLowerCase()),
        );
      });
    }

    if (query.tallas?.length) {
      data = data.filter((p) =>
        (p.tallas || []).some((t) => query.tallas!.includes(t as Talla)),
      );
    }

    if (query.tipoDiseno?.length === 1) {
      const tipo = query.tipoDiseno[0];

      data = data.filter((p) =>
        tipo === 'personalizable' ? p.esPersonalizable : !p.esPersonalizable,
      );
    }

    data = applyLocalFilters(data, query);

    return paginate(data, query);
  }
}

export async function fetchProductById(id: number): Promise<Producto> {
  try {
    const rawProduct = await apiClient<any>(`/productos/${id}`, {
      method: 'GET',
      auth: false,
    });

    return mapBackendProductToFrontend(rawProduct);
  } catch {
    const product = products.find((p) => p.idProducto === id);

    if (!product) {
      throw new Error(`Producto con id "${id}" no encontrado`);
    }

    return product;
  }
}