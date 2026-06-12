import { ApiClient } from '@/lib/api-client';

export interface VendedorStats {
  salesThisMonth: string;
  activeOrders: number;
  pendingQuotations: number;
  commissions: string;
}

export interface VendedorOrder {
  id: string;
  customer: string;
  total: number;
  commission: number;
  status: 'pendiente' | 'en_produccion' | 'enviado' | 'entregado';
  date: string;
}

export interface VendedorQuotation {
  id: string;
  customer: string;
  items: number;
  amount: number;
  status: 'draft' | 'sent' | 'accepted' | 'rejected';
  date: string;
}

export class VendedorService {
  static async getStats() {
    return ApiClient.get('/vendedor/stats');
  }

  static async getMyOrders() {
    return ApiClient.get('/vendedor/orders');
  }

  static async getMyQuotations() {
    return ApiClient.get('/vendedor/quotations');
  }

  static async createQuotation(data: {
    customer: string;
    items: Array<{ productId: string; quantity: number }>;
    notes?: string;
  }) {
    return ApiClient.post('/vendedor/quotations', data);
  }

  static async updateQuotation(id: string, data: any) {
    return ApiClient.put(`/vendedor/quotations/${id}`, data);
  }

  static async sendQuotation(quotationId: string, customerEmail: string) {
    return ApiClient.post(`/vendedor/quotations/${quotationId}/send`, { customerEmail });
  }

  static async getProducts() {
    return ApiClient.get('/vendedor/products');
  }

  static async getCommissions() {
    return ApiClient.get('/vendedor/commissions');
  }
}
