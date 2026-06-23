import { API_BASE_URL, ApiError, apiClient } from '@/lib/api-client';
import type { DisenoPredefinido } from '@/lib/types';

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

interface RegistrarDisenoPredefinidoPayload {
  nombre: string;
  file: File;
}

function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem('gtt_access_token');
}

function extractErrorMessage(data: unknown, fallback: string): string {
  if (!data || typeof data !== 'object') return fallback;

  if ('message' in data) {
    const message = (data as { message: unknown }).message;
    if (Array.isArray(message)) return message.map(String).join(', ');
    if (message) return String(message);
  }

  return fallback;
}

async function parseMultipartResponse<T>(response: Response): Promise<T> {
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiError(
      response.status,
      extractErrorMessage(data, `Error HTTP ${response.status}`),
      data,
    );
  }

  if (data && typeof data === 'object' && 'success' in data) {
    const apiResponse = data as ApiResponse<T>;

    if (apiResponse.success === false) {
      throw new ApiError(
        response.status,
        extractErrorMessage(data, 'Error al procesar la solicitud.'),
        data,
      );
    }

    return apiResponse.data as T;
  }

  return data as T;
}

export class DisenoPredefinidoService {
  static async listarActivos(): Promise<DisenoPredefinido[]> {
    return apiClient<DisenoPredefinido[]>('/disenos-predefinidos', {
      method: 'GET',
      auth: false,
    });
  }

  static async registrar(
    payload: RegistrarDisenoPredefinidoPayload,
  ): Promise<DisenoPredefinido> {
    const token = getAuthToken();

    if (!token) {
      throw new ApiError(
        401,
        'Debes iniciar sesión como vendedor o administrador.',
      );
    }

    const formData = new FormData();
    formData.append('nombre', payload.nombre);
    formData.append('file', payload.file);

    const response = await fetch(`${API_BASE_URL}/disenos-predefinidos`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    return parseMultipartResponse<DisenoPredefinido>(response);
  }

  static async desactivar(
    idDisenoPredefinido: number,
  ): Promise<DisenoPredefinido> {
    return apiClient<DisenoPredefinido>(
      `/disenos-predefinidos/${idDisenoPredefinido}`,
      {
        method: 'DELETE',
        auth: true,
      },
    );
  }
}