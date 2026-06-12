import { ApiClient } from '@/lib/api-client';
import { mapBackendProductToFrontend } from '@/lib/product-adapter';
import type { Producto, RolUsuario } from '@/lib/types';
import {
  UserService,
  type DeactivationRequest,
  type DocumentChangeRequest,
  type UpdateProfilePayload,
  type UserProfile,
} from '@/features/user/services/user.service';

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

  static async getClients(): Promise<UserProfile[]> {
    return UserService.listUsersByRole('CLIENTE' as RolUsuario);
  }

  static async getVendedores(): Promise<UserProfile[]> {
    return UserService.listUsersByRole('VENDEDOR' as RolUsuario);
  }

  static async updateUser(id: number, data: UpdateProfilePayload): Promise<UserProfile> {
    return UserService.updateUserById(id, data);
  }

  static async deactivateUser(id: number, idSolicitud?: number): Promise<void> {
    return UserService.deactivateUser(id, idSolicitud);
  }

  static async getPendingDocumentRequests(): Promise<DocumentChangeRequest[]> {
    return UserService.listPendingDocumentRequests();
  }

  static async approveDocumentRequest(idSolicitud: number): Promise<UserProfile> {
    return UserService.approveDocumentRequest(idSolicitud);
  }

  static async getPendingDeactivationRequests(): Promise<DeactivationRequest[]> {
    return UserService.listPendingDeactivationRequests();
  }

  static async respondToQuotation(quotationId: string, approved: boolean, price?: number) {
    return ApiClient.post(`/admin/quotations/${quotationId}/respond`, { approved, price });
  }

  static async createVendedor(data: CreateVendedorPayload): Promise<VendedorCreated> {
    return ApiClient.post<VendedorCreated>('/usuarios/vendedores', data);
  }
}

