import { mockQuotations } from '@/lib/mock-data';
import type { Quotation } from '@/lib/types';

export interface CreateQuotationPayload {
  productoId: number;
  producto?: {
    id: number;
    nombre: string;
    precio: number;
    descripcion: string;
    categoria: string;
    descuentosVolumen: Array<{
      cantidadMinima: number;
      porcentajeDescuento: number;
    }>;
  };
  colorNombre: string;
  colorHex: string;
  talla: string;
  cantidad: number;
  razon: 'PERSONALIZACION' | 'STOCK_INSUFICIENTE';
  comentarios?: string;
  cliente: {
    nombres: string;
    apellidos: string;
    correo: string;
    celular: string;
    tipoDocumento: string;
    documento: string;
    direccion: string;
  };
  disenoPecho?: string | null;
  disenoEspalda?: string | null;
}

const LOCAL_STORAGE_KEY = 'gtt_quotations';

export class QuotationService {
  private static getStoredQuotations(): Quotation[] {
    if (typeof window === 'undefined') {
      return mockQuotations;
    }
    const stored = window.localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!stored) {
      window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(mockQuotations));
      return mockQuotations;
    }
    try {
      return JSON.parse(stored);
    } catch {
      return mockQuotations;
    }
  }

  private static saveQuotations(quotations: Quotation[]) {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(quotations));
    }
  }

  static async submitQuotationRequest(data: CreateQuotationPayload): Promise<Quotation> {
    const list = this.getStoredQuotations();
    
    const productoInfo = data.producto ?? {
    id: data.productoId,
    nombre: 'Producto personalizado',
    precio: 0,
    descripcion: 'Producto solicitado para cotización.',
    categoria: 'Prenda',
    descuentosVolumen: [],
  };

    const nextId = list.length > 0 ? Math.max(...list.map(q => Number(q.id) || 0)) + 1 : 1;
    const nextCodeNum = String(nextId).padStart(3, '0');
    
    const newQuotation: Quotation = {
      id: nextId,
      codigo: `COT-${nextCodeNum}`,
      cliente: data.cliente,
      producto: productoInfo,
      colorSeleccionado: {
        nombre: data.colorNombre,
        hexCode: data.colorHex
      },
      tallaSeleccionada: data.talla,
      cantidad: data.cantidad,
      estado: 'pendiente',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      disenoPecho: data.disenoPecho,
      disenoEspalda: data.disenoEspalda
    };

    list.unshift(newQuotation);
    this.saveQuotations(list);
    return newQuotation;
  }

  static async getMyQuotations(): Promise<Quotation[]> {
    return this.getStoredQuotations();
  }

  static async getAllQuotations(): Promise<Quotation[]> {
    return this.getStoredQuotations();
  }

  static async getQuotationDetail(id: string | number): Promise<Quotation> {
    const list = this.getStoredQuotations();
    const quotation = list.find((q) => String(q.id) === String(id));
    if (!quotation) throw new Error('Quotation not found');
    return quotation;
  }

  static async updateQuotation(id: string | number, updates: Partial<Quotation>): Promise<Quotation> {
    const list = this.getStoredQuotations();
    const index = list.findIndex((q) => String(q.id) === String(id));
    if (index === -1) throw new Error('Quotation not found');
    
    const updated = {
      ...list[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    list[index] = updated;
    this.saveQuotations(list);
    return updated;
  }

  static async acceptQuotation(id: string | number): Promise<Quotation> {
    return this.updateQuotation(id, { estado: 'cotizado' });
  }

  static async rejectQuotation(id: string | number): Promise<Quotation> {
    return this.updateQuotation(id, { estado: 'rechazado' });
  }
}

