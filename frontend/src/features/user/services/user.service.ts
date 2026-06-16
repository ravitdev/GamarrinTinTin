import { ApiClient } from '@/lib/api-client';
import type { EstadoUsuario, RolUsuario, TipoDocumento } from '@/lib/types';

export interface UserProfile {
  idUsuario: number;
  nombres: string;
  apellidos: string;
  email: string;
  telefono: string;
  tipoDocumento: TipoDocumento;
  numeroDocumento: string;
  direccion: string | null;
  rol: RolUsuario;
  estado: EstadoUsuario;
  fechaRegistro: string;
  solicitudCambioDocumentoPendiente: boolean;
  solicitudDesactivacionPendiente: boolean;
  puedeDesactivarse: boolean;
  motivoNoDesactivacion?: string;
  totalPedidos?: number;
  totalGastado?: number;
  fechaUltimoPedido?: string | null;
  pedidos?: ClientOrderSummary[];
}

export interface ClientOrderSummary {
  idPedido: number;
  codigo: string;
  fecha: string;
  estado: 'REGISTRADO' | 'CONFIRMADO' | 'PROCESANDO' | 'ENVIADO' | 'ENTREGADO' | 'CANCELADO';
  total: number;
  items: number;
  productos: string[];
}

export interface UpdateProfilePayload {
  nombres?: string;
  apellidos?: string;
  email?: string;
  telefono?: string;
  direccion?: string | null;
  tipoDocumento?: TipoDocumento;
  numeroDocumento?: string;
}

export interface ChangePasswordPayload {
  contrasenaActual: string;
  contrasenaNueva: string;
}

export interface DocumentChangeRequestPayload {
  tipoDocumento: TipoDocumento;
  numeroDocumento: string;
}

export interface DocumentChangeRequest {
  idSolicitud: number;
  idUsuario: number;
  nombres: string;
  apellidos: string;
  email: string;
  rol: string;
  tipoDocumentoActual: TipoDocumento;
  numeroDocumentoActual: string;
  tipoDocumentoNuevo: TipoDocumento;
  numeroDocumentoNuevo: string;
  estado: string;
  fechaSolicitud: string;
}

export interface DeactivationRequest {
  idSolicitud: number;
  idUsuario: number;
  nombres: string;
  apellidos: string;
  email: string;
  rol: string;
  estado: string;
  fechaSolicitud: string;
  puedeDesactivarse: boolean;
  motivoNoDesactivacion?: string;
}

export interface DeactivationValidation {
  puede: boolean;
  motivo?: string;
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
  static async getProfile(): Promise<UserProfile> {
    return ApiClient.get<UserProfile>('/usuarios/perfil');
  }

  static async updateProfile(data: UpdateProfilePayload): Promise<UserProfile> {
    return ApiClient.patch<UserProfile>('/usuarios/perfil', data);
  }

  static async changePassword(data: ChangePasswordPayload): Promise<void> {
    return ApiClient.patch<void>('/usuarios/perfil/contrasena', data);
  }

  static async requestDocumentChange(
    data: DocumentChangeRequestPayload,
  ): Promise<DocumentChangeRequest> {
    return ApiClient.post<DocumentChangeRequest>(
      '/usuarios/perfil/solicitud-documento',
      data,
    );
  }

  static async requestAccountDeactivation(): Promise<DeactivationRequest> {
    return ApiClient.post<DeactivationRequest>(
      '/usuarios/perfil/solicitud-desactivacion',
    );
  }

  static async getUserById(id: number): Promise<UserProfile> {
    return ApiClient.get<UserProfile>(`/usuarios/${id}`);
  }

  static async updateUserById(
    id: number,
    data: UpdateProfilePayload,
  ): Promise<UserProfile> {
    return ApiClient.patch<UserProfile>(`/usuarios/${id}`, data);
  }

  static async deactivateUser(id: number, idSolicitud?: number): Promise<void> {
    return ApiClient.post<void>(`/usuarios/${id}/desactivar`, { idSolicitud });
  }

  static async reactivateUser(id: number): Promise<void> {
    return ApiClient.post<void>(`/usuarios/${id}/reactivar`, {});
  }

  static async canDeactivateUser(id: number): Promise<DeactivationValidation> {
    return ApiClient.get<DeactivationValidation>(`/usuarios/${id}/puede-desactivar`);
  }

  static async listUsersByRole(rol: RolUsuario): Promise<UserProfile[]> {
    return ApiClient.get<UserProfile[]>(`/usuarios?rol=${rol}`);
  }

  static async listPendingDocumentRequests(): Promise<DocumentChangeRequest[]> {
    return ApiClient.get<DocumentChangeRequest[]>(
      '/usuarios/solicitudes-documento/pendientes',
    );
  }

  static async approveDocumentRequest(idSolicitud: number): Promise<UserProfile> {
    return ApiClient.patch<UserProfile>(
      `/usuarios/solicitudes-documento/${idSolicitud}/aprobar`,
    );
  }

  static async listPendingDeactivationRequests(): Promise<DeactivationRequest[]> {
    return ApiClient.get<DeactivationRequest[]>(
      '/usuarios/solicitudes-desactivacion/pendientes',
    );
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
}
