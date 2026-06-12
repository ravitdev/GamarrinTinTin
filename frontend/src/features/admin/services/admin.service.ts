import { ApiClient } from '@/lib/api-client';
import { mapBackendProductToFrontend } from '@/lib/product-adapter';
import type { Producto } from '@/lib/types';

export interface AdminStats {
  monthlySales: string;
  activeOrders: number;
  pendingQuotations: number;
  newCustomers: number;
}

export interface AdminOrder {
  id: string;
  customer: string;
  total: number;
  items: number;
  status: 'pendiente' | 'en_produccion' | 'enviado' | 'entregado';
  date: string;
}

export interface AdminQuotation {
  id: string;
  customer: string;
  items: number;
  date: string;
  priority: 'high' | 'medium' | 'low';
}

export interface CreateProductVariantPayload {
  colorNombre: string;
  colorHex: string;
  talla: string;
  stock: number;
}

export interface CreateProductImagePayload {
  colorHex: string;
  lado: 'FRONT' | 'BACK';
  urlImagen: string;
  displayOrder?: number;
}

export interface CreateProductDiscountPayload {
  cantidadMinima: number;
  porcentajeDescuento: number;
}

export interface CreateProductPayload {
  idCategoria: number;
  nombre: string;
  descripcion: string;
  precioBase: number;
  esPersonalizable: boolean;
  variantes: CreateProductVariantPayload[];
  imagenes: CreateProductImagePayload[];
  descuentosVolumen?: CreateProductDiscountPayload[];
}

export interface CreateVendedorPayload {
  nombres: string;
  apellidos: string;
  email: string;
  contrasena: string;
  telefono: string;
  tipoDocumento: 'DNI' | 'RUC';
  numeroDocumento: string;
  direccion: string;
}

export interface VendedorCreated {
  idUsuario: number;
  nombres: string;
  apellidos: string;
  email: string;
  rol: string;
}

export class AdminService {
  static async getStats() {
    return ApiClient.get('/admin/stats');
  }

  static async getRecentOrders() {
    return ApiClient.get('/admin/orders/recent');
  }

  static async getPendingQuotations() {
    return ApiClient.get('/admin/quotations/pending');
  }

  static async getProducts(): Promise<Producto[]> {
    const rawProducts = await ApiClient.get<any[]>('/productos');

    const detailedProducts = await Promise.all(
      rawProducts.map((product) =>
        ApiClient.get<any>(`/productos/${product.idProducto}`),
      ),
    );

    return detailedProducts.map(mapBackendProductToFrontend);
  }

  static async createProduct(data: CreateProductPayload): Promise<Producto> {
    const rawProduct = await ApiClient.post<any>('/productos', data);
    return mapBackendProductToFrontend(rawProduct);
  }

  static async updateProduct(id: string, data: Partial<CreateProductPayload>): Promise<Producto> {
    const rawProduct = await ApiClient.put<any>(`/productos/${id}`, data);
    return mapBackendProductToFrontend(rawProduct);
  }

  static async deleteProduct(id: string) {
    return ApiClient.delete(`/productos/${id}`);
  }

  static async getClients() {
    return ApiClient.get('/admin/clients');
  }

  static async respondToQuotation(quotationId: string, approved: boolean, price?: number) {
    return ApiClient.post(`/admin/quotations/${quotationId}/respond`, { approved, price });
  }

  static async createVendedor(data: CreateVendedorPayload): Promise<VendedorCreated> {
    return ApiClient.post<VendedorCreated>('/usuarios/vendedores', data);
  }
}

