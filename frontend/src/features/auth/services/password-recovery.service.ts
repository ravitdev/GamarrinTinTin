import { apiClient } from '@/lib/api-client';

export class PasswordRecoveryService {
  static async requestPasswordRecovery(email: string): Promise<void> {
    await apiClient<unknown>('/usuarios/recuperar-contrasena', {
      method: 'POST',
      auth: false,
      body: { email },
    });
  }

  static async resetPassword(params: {
    token: string;
    contrasenaNueva: string;
  }): Promise<void> {
    await apiClient<unknown>('/usuarios/restablecer-contrasena', {
      method: 'POST',
      auth: false,
      body: params,
    });
  }
}