import { apiClient } from '@/lib/api-client';
import type { Quotation } from '@/lib/types';

export interface ImagenPersonalizacionCotizacionPayload {
  idDisenoPredefinido?: number | null;
  urlImagen: string;
  lado: 'FRONT' | 'BACK';
  xPosicion: number;
  yPosicion: number;
  anchoPorcentaje: number;
  altoPorcentaje: number;
  displayOrder?: number;
}

export interface CreateQuotationPayload {
  idProductoVariante: number;
  cantidad: number;
  razon: 'PERSONALIZACION' | 'STOCK_INSUFICIENTE';
  personalizacion?: {
    imagenes: ImagenPersonalizacionCotizacionPayload[];
  };
}

export interface RespondQuotationPayload {
  precioPropuesto: number;
}

export class QuotationService {
  static async submitQuotationRequest(
    data: CreateQuotationPayload,
  ): Promise<Quotation> {
    return apiClient<Quotation>('/cotizaciones', {
      method: 'POST',
      body: data,
      auth: true,
    });
  }

  static async getMyQuotations(): Promise<Quotation[]> {
    return apiClient<Quotation[]>('/cotizaciones/mis-cotizaciones', {
      method: 'GET',
      auth: true,
    });
  }

  static async getAllQuotations(): Promise<Quotation[]> {
    return apiClient<Quotation[]>('/cotizaciones', {
      method: 'GET',
      auth: true,
    });
  }

  static async getQuotationDetail(id: string | number): Promise<Quotation> {
    return apiClient<Quotation>(`/cotizaciones/${id}`, {
      method: 'GET',
      auth: true,
    });
  }

  static async respondQuotation(
    id: string | number,
    data: RespondQuotationPayload,
  ): Promise<Quotation> {
    return apiClient<Quotation>(`/cotizaciones/${id}/responder`, {
      method: 'PATCH',
      body: data,
      auth: true,
    });
  }

  static async updateQuotation(
    id: string | number,
    updates: Partial<Quotation>,
  ): Promise<Quotation> {
    if (updates.estado === 'cotizado' && updates.precioSugerido) {
      return this.respondQuotation(id, {
        precioPropuesto: updates.precioSugerido,
      });
    }

    throw new Error(
      'Esta operación todavía no está disponible en el backend de cotizaciones.',
    );
  }

  static async acceptQuotation(id: string | number): Promise<Quotation> {
    return this.updateQuotation(id, { estado: 'cotizado' });
  }

  static async rejectQuotation(id: string | number): Promise<Quotation> {
    return this.updateQuotation(id, { estado: 'rechazado' });
  }
}
