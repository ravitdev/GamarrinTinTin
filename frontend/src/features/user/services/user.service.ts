import { ApiClient } from '@/lib/api-client';

export interface UserProfile {
  id: string;
  nombres: string;
  apellidos: string;
  correo: string;
  celular: string;
  tipoDocumento: 'DNI' | 'RUC';
  documento: string;
  direccion: string;
  rol: 'cliente' | 'vendedor' | 'administrador';
  estado: 'activo' | 'inactivo';
  createdAt: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  total: number;
  items: number;
  status: 'pendiente' | 'en_produccion' | 'enviado' | 'entregado';
  date: string;
}

export interface Quotation {
  id: string;
  quotationNumber: string;
  items: number;
  total: number;
  status: 'pending' | 'approved' | 'rejected';
  date: string;
}

export class UserService {
  static async getProfile() {
    return ApiClient.get('/users/profile');
  }

  static async updateProfile(data: Partial<UserProfile>) {
    return ApiClient.put('/users/profile', data);
  }

  static async getMyOrders() {
    return ApiClient.get('/users/orders');
  }

  static async getOrderDetail(orderId: string) {
    return ApiClient.get(`/users/orders/${orderId}`);
  }

  static async getMyQuotations() {
    return ApiClient.get('/users/quotations');
  }

  static async getQuotationDetail(quotationId: string) {
    return ApiClient.get(`/users/quotations/${quotationId}`);
  }

  static async deleteAccount() {
    return ApiClient.delete('/users/account');
  }
}
