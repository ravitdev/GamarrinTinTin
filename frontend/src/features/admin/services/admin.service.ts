import { ApiClient } from '@/lib/api-client';

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

export interface Product {
  id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  stock: number;
  imagen: string;
  categoria: 'polo' | 'polera' | 'otro';
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

  static async getProducts() {
    return ApiClient.get('/admin/products');
  }

  static async createProduct(data: Omit<Product, 'id'>) {
    return ApiClient.post('/admin/products', data);
  }

  static async updateProduct(id: string, data: Partial<Product>) {
    return ApiClient.put(`/admin/products/${id}`, data);
  }

  static async deleteProduct(id: string) {
    return ApiClient.delete(`/admin/products/${id}`);
  }

  static async getClients() {
    return ApiClient.get('/admin/clients');
  }

  static async respondToQuotation(quotationId: string, approved: boolean, price?: number) {
    return ApiClient.post(`/admin/quotations/${quotationId}/respond`, { approved, price });
  }
}
