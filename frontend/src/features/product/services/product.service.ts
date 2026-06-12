import { ApiClient } from '@/lib/api-client';
import { apiClient } from '@/lib/api-client';
import { products } from '@/lib/mock-data';
import { mapBackendProductToFrontend } from '@/lib/product-adapter';
import type { Producto } from '@/lib/types';

export interface ProductDetail {
  idProducto: number;
  nombre: string;
  descripcion: string;
  precioBase: number;
  descuentosVolumen: Array<{ cantidadMinima: number; porcentajeDescuento: number }>;
  colores: Array<{ idColor: number; nombre: string; codigoHex: string }>;
  tallas: Array<'S' | 'M' | 'L' | 'XL'>;
  stock: number;
  imagenes: string[];
  estado: 'ACTIVO' | 'INACTIVO';
}

export interface PersonalizationOptions {
  logoUpload?: boolean;
  textEmbroidery?: boolean;
  printLocation?: string[];
  colors?: string[];
  estimatedPrice?: number;
}

export interface AdicionarStockVariantePayload {
  colorHex: string;
  talla: 'S' | 'M' | 'L' | 'XL';
  stockAdicional: number;
}

export class ProductService {
  static async getProductDetail(id: number): Promise<Producto> {
    try {
      const rawProduct = await ApiClient.get<any>(`/productos/${id}`);
      return mapBackendProductToFrontend(rawProduct);
    } catch {
      // Fallback a mock-data en desarrollo
      const product = products.find((p) => p.idProducto === id);
      if (!product) throw new Error(`Producto con id ${id} no encontrado`);
      return product;
    }
  }

  static async getRelatedProducts(id: number): Promise<Producto[]> {
    try {
      const rawProducts = await ApiClient.get<any[]>(`/productos/${id}/relacionados`);
      return rawProducts.map(mapBackendProductToFrontend);
    } catch {
      // Fallback a mock-data
      return products.filter((p) => p.idProducto !== id).map(mapBackendProductToFrontend).slice(0, 4);
    }
  }

  /**
   * P19: Desactiva (eliminación lógica) un producto del catálogo.
   * Rechazado si el producto tiene pedidos en proceso (P21).
   */
  static async desactivarProducto(idProducto: number): Promise<{ message: string }> {
    return apiClient<{ message: string }>(`/productos/${idProducto}`, {
      method: 'DELETE',
      auth: true,
    });
  }

  /**
   * P20: Reactiva un producto previamente desactivado.
   */
  static async activarProducto(idProducto: number): Promise<{ message: string }> {
    return apiClient<{ message: string }>(`/productos/${idProducto}/activar`, {
      method: 'PATCH',
      auth: true,
    });
  }

  /**
   * P16: Adiciona stock de forma incremental a variantes existentes.
   */
  static async adicionarStock(
    idProducto: number,
    variantes: AdicionarStockVariantePayload[],
  ): Promise<Producto> {
    const raw = await apiClient<any>(`/productos/${idProducto}/stock`, {
      method: 'PATCH',
      auth: true,
      body: { variantes },
    });
    return mapBackendProductToFrontend(raw.data ?? raw);
  }
}
