import { apiClient } from '@/lib/api-client';
import type { DisenoPredefinido } from '@/lib/types';

export class DisenoPredefinidoService {
  static async listarActivos(): Promise<DisenoPredefinido[]> {
    return apiClient<DisenoPredefinido[]>('/disenos-predefinidos', {
      method: 'GET',
      auth: false,
    });
  }
}