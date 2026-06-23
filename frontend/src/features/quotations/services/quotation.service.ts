import { ApiClient } from '@/lib/api-client';
import type { Quotation, QuotationStatus } from '@/lib/types';

export interface CreateQuotationPayload {
  idProductoVariante: number;
  cantidad: number;
  razon: 'PERSONALIZACION' | 'STOCK_INSUFICIENTE';
}

interface BackendQuotation {
  idCotizacion: number;
  codigo: string;
  idCliente: number;
  atendidoPorId: number | null;
  idProductoVariante: number;
  cantidad: number;
  razon: 'PERSONALIZACION' | 'STOCK_INSUFICIENTE';
  estado: 'PENDIENTE' | 'COTIZADO' | 'PAGADO' | 'EXPIRADO' | 'RECHAZADO';
  precioCotizado: number | null;
  fechaCotizacion: string | null;
  fechaExpiracion: string | null;
  nombreProductoSnapshot: string;
  colorSnapshot: string;
  tallaSnapshot: string;
  precioBaseSnapshot: number;
  fechaCreacion: string;
  fechaActualizacion: string;
  cliente?: {
    nombres: string;
    apellidos: string;
    email: string;
    telefono: string;
    tipoDocumento: string;
    numeroDocumento: string;
    direccion: string | null;
  };
  producto?: {
    idProducto: number;
    descripcion: string;
    categoria: string;
    colorHex: string;
    descuentosVolumen: {
      cantidadMinima: number;
      porcentajeDescuento: number;
    }[];
  };
}

const estadosFrontend: Record<BackendQuotation['estado'], QuotationStatus> = {
  PENDIENTE: 'pendiente',
  COTIZADO: 'cotizado',
  PAGADO: 'pagado',
  EXPIRADO: 'vencido',
  RECHAZADO: 'rechazado',
};

function mapBackendQuotation(cotizacion: BackendQuotation): Quotation {
  return {
    id: cotizacion.idCotizacion,
    codigo: cotizacion.codigo,
    cliente: {
      nombres: cotizacion.cliente?.nombres ?? '',
      apellidos: cotizacion.cliente?.apellidos ?? '',
      correo: cotizacion.cliente?.email ?? '',
      celular: cotizacion.cliente?.telefono ?? '',
      tipoDocumento: cotizacion.cliente?.tipoDocumento ?? '',
      documento: cotizacion.cliente?.numeroDocumento ?? '',
      direccion: cotizacion.cliente?.direccion ?? '',
    },
    producto: {
      id: cotizacion.producto?.idProducto ?? 0,
      nombre: cotizacion.nombreProductoSnapshot,
      precio: Number(cotizacion.precioBaseSnapshot),
      descripcion: cotizacion.producto?.descripcion ?? '',
      categoria: cotizacion.producto?.categoria ?? '',
      descuentosVolumen: cotizacion.producto?.descuentosVolumen ?? [],
    },
    colorSeleccionado: {
      nombre: cotizacion.colorSnapshot,
      hexCode: cotizacion.producto?.colorHex ?? '#FFFFFF',
    },
    tallaSeleccionada: cotizacion.tallaSnapshot,
    cantidad: cotizacion.cantidad,
    estado: estadosFrontend[cotizacion.estado],
    createdAt: cotizacion.fechaCreacion,
    updatedAt: cotizacion.fechaActualizacion,
    precioSugerido:
      cotizacion.precioCotizado === null
        ? undefined
        : Number(cotizacion.precioCotizado),
    fechaVencimiento: cotizacion.fechaExpiracion ?? undefined,
  };
}

export class QuotationService {
  static async submitQuotationRequest(
    data: CreateQuotationPayload,
  ): Promise<Quotation> {
    const cotizacion = await ApiClient.post<BackendQuotation>(
      '/cotizaciones',
      data,
    );
    return mapBackendQuotation(cotizacion);
  }

  static async getMyQuotations(): Promise<Quotation[]> {
    const cotizaciones =
      await ApiClient.get<BackendQuotation[]>('/cotizaciones/propias');
    return cotizaciones.map(mapBackendQuotation);
  }

  static async getAllQuotations(): Promise<Quotation[]> {
    const cotizaciones =
      await ApiClient.get<BackendQuotation[]>('/cotizaciones/solicitudes');
    return cotizaciones.map(mapBackendQuotation);
  }

  static async getQuotationDetail(
    id: string | number,
  ): Promise<Quotation> {
    const cotizacion = await ApiClient.get<BackendQuotation>(
      `/cotizaciones/propias/${id}`,
    );
    return mapBackendQuotation(cotizacion);
  }

  static async updateQuotation(
    id: string | number,
    updates: Partial<Quotation>,
  ): Promise<Quotation> {
    if (
      updates.estado !== 'cotizado' ||
      typeof updates.precioSugerido !== 'number'
    ) {
      throw new Error('La operación solicitada para la cotización no es válida.');
    }

    const cotizacion = await ApiClient.patch<BackendQuotation>(
      `/cotizaciones/${id}/respuesta`,
      {
        precioCotizado: updates.precioSugerido,
      },
    );
    return mapBackendQuotation(cotizacion);
  }

  static async addQuotationToCart(
    id: string | number,
  ): Promise<Quotation> {
    const cotizacion = await ApiClient.post<BackendQuotation>(
      `/cotizaciones/propias/${id}/carrito`,
      {},
    );
    return mapBackendQuotation(cotizacion);
  }
}
