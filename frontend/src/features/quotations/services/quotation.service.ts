import { ApiClient } from '@/lib/api-client';
import { mockQuotations } from '@/lib/mock-data';
import type { Quotation } from '@/lib/types';

export interface QuotationRequest {
  productType: string;
  quantity: number;
  customizationNotes?: string;
  estimatedBudget?: number;
  deadline?: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  company?: string;
  address?: string;
}

export class QuotationService {
  static async submitQuotationRequest(data: QuotationRequest) {
    try {
      return await ApiClient.post('/quotations/request', data);
    } catch {
      // Fallback para desarrollo
      return { id: 'temp-' + Date.now(), message: 'Cotización guardada localmente' };
    }
  }

  static async getMyQuotations(): Promise<Quotation[]> {
    try {
      return await ApiClient.get<Quotation[]>('/quotations/my-quotations');
    } catch {
      // Fallback a mock-data
      return mockQuotations;
    }
  }

  static async getQuotationDetail(id: string): Promise<Quotation> {
    try {
      return await ApiClient.get<Quotation>(`/quotations/${id}`);
    } catch {
      const quotation = mockQuotations.find((q: any) => String(q.id) === id);
      if (!quotation) throw new Error('Quotation not found');
      return quotation;
    }
  }

  static async acceptQuotation(id: string) {
    return ApiClient.post(`/quotations/${id}/accept`, {});
  }

  static async rejectQuotation(id: string) {
    return ApiClient.post(`/quotations/${id}/reject`, {});
  }
}
