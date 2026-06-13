// ============================================================================
// CAPA DE SERVICIO (Catalogo) - Comunicacion HTTP con el backend NestJS
// ----------------------------------------------------------------------------
// Unica responsabilidad: traducir intenciones de negocio en solicitudes HTTP
// y devolver promesas TIPADAS. No contiene estado de React ni JSX.
// Consume el cliente base centralizado (lib/api-client.ts).
// ============================================================================

import { apiClient } from '@/lib/api-client';
import { products, categorias } from '@/lib/mock-data';
import { mapBackendProductToFrontend } from '@/lib/product-adapter';
import type {
  Producto,
  Categoria,
  Talla,
  TipoProducto,
} from '@/lib/types';

/** Opciones de ordenamiento aceptadas por el endpoint del catalogo. */
export type CatalogoSort = 'relevance' | 'price-asc' | 'price-desc' | 'newest';

/**
 * Filtros que viajan como Query Params hacia el API de NestJS.
 * Coincide con un DTO @Query() del controlador de productos.
 */
export interface CatalogoQuery {
  categorias?: string[];
  tallas?: Talla[];
  tipoProducto?: TipoProducto[];
  precioMin?: number | null;
  precioMax?: number | null;
  sort?: CatalogoSort;
  page?: number;
  limit?: number;
  tipoDiseno?: string[]; // compatibility
}

/** Respuesta paginada tipada que retorna el backend. */
export interface PaginatedProducts {
  data: Producto[];
  total: number;
  page: number;
  limit: number;
}

/**
 * GET /productos
 * Lista productos del catalogo aplicando filtros localmente.
 * Si el backend no esta disponible, retorna los datos de mock-data como fallback
 * para que la UI no explote durante el desarrollo.
 */
export async function fetchCatalogo(
  query: CatalogoQuery = {}
): Promise<PaginatedProducts> {
  try {
    const rawProducts = await apiClient<any[]>('/productos', {
      method: 'GET',
      auth: false,
    });

    const mappedProducts = rawProducts.map(mapBackendProductToFrontend);

    let data = [...mappedProducts];

    // Aplicar filtros en el cliente
    if (query.categorias?.length) {
      data = data.filter((p) =>
        query.categorias!.some((catNameOrId) => {
          const catName = p.categoriaObjeto?.nombre || p.categoria || '';
          return catName.toLowerCase().includes(catNameOrId.toLowerCase()) ||
                 catNameOrId.toLowerCase().includes(catName.toLowerCase()) ||
                 String(p.categoriaObjeto?.idCategoria) === catNameOrId;
        })
      );
    }
    if (query.tallas?.length) {
      data = data.filter((p) =>
        (p.tallas || []).some((t: any) => query.tallas!.includes(t as Talla))
      );
    }
    if (query.tipoDiseno?.length) {
      data = data.filter((p) =>
        query.tipoDiseno!.some((tipo) =>
          tipo === 'personalizable' ? p.esPersonalizable : !p.esPersonalizable
        )
      );
    }
    if (query.precioMin != null) {
      data = data.filter((p) => p.precioBase >= query.precioMin!);
    }
    if (query.precioMax != null) {
      data = data.filter((p) => p.precioBase <= query.precioMax!);
    }
    if (query.sort === 'price-asc') data.sort((a, b) => a.precioBase - b.precioBase);
    if (query.sort === 'price-desc') data.sort((a, b) => b.precioBase - a.precioBase);
    if (query.sort === 'newest') {
      data.sort((a, b) => new Date(b.fechaCreacion || 0).getTime() - new Date(a.fechaCreacion || 0).getTime());
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? data.length;
    const start = (page - 1) * limit;

    return {
      data: data.slice(start, start + limit),
      total: data.length,
      page,
      limit,
    };
  } catch (error) {
    console.error('Error conectando catálogo con backend:', error);
    // Fallback a mock-data cuando el backend no esta disponible.
    let data = [...products];

    if (query.categorias?.length) {
      data = data.filter((p) => {
        const cat = categorias.find(c => c.idCategoria === p.idCategoria);
        if (!cat) return false;
        return query.categorias!.some((catNameOrId) => 
          cat.nombre.toLowerCase().includes(catNameOrId.toLowerCase()) ||
          catNameOrId.toLowerCase().includes(cat.nombre.toLowerCase())
        );
      });
    }
    if (query.tallas?.length) {
      data = data.filter((p) =>
        (p.tallas || []).some((t) => query.tallas!.includes(t as Talla))
      );
    }
    if (query.tipoDiseno?.length) {
      data = data.filter((p) =>
        query.tipoDiseno!.some((tipo) =>
          tipo === 'personalizable' ? p.esPersonalizable : !p.esPersonalizable
        )
      );
    }
    if (query.precioMin != null) {
      data = data.filter((p) => p.precioBase >= query.precioMin!);
    }
    if (query.precioMax != null) {
      data = data.filter((p) => p.precioBase <= query.precioMax!);
    }
    if (query.sort === 'price-asc') data.sort((a, b) => a.precioBase - b.precioBase);
    if (query.sort === 'price-desc') data.sort((a, b) => b.precioBase - a.precioBase);

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
}

/**
 * GET /productos/:id
 * Obtiene el detalle de un producto puntual.
 * Fallback a mock-data si el backend no esta disponible.
 */
export async function fetchProductById(id: number): Promise<Producto> {
  try {
    const rawProduct = await apiClient<any>(`/productos/${id}`, {
      method: 'GET',
      auth: false,
    });
    return mapBackendProductToFrontend(rawProduct);
  } catch {
    const product = products.find((p) => p.idProducto === id);
    if (!product) throw new Error(`Producto con id "${id}" no encontrado`);
    return product;
  }
}
