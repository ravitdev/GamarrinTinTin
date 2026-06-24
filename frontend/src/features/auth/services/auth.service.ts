// ============================================================================
// SERVICIO DE AUTENTICACIÓN — alineado con el backend NestJS real
// Endpoints disponibles:
//   POST /usuarios/clientes   → registro de cliente
//   POST /usuarios/login      → login
//   POST /usuarios/logout     → logout
//   POST /usuarios/refresh-token → renovar token
// ============================================================================

import { ApiClient } from '@/lib/api-client';
import type { AuthResponse, RegistroData } from '@/lib/types';

export interface AuthCredentials {
  email:    string;
  password: string;
}

export interface RegistroPendienteResponse {
  email: string;
  fechaExpiracion: string | Date;
}

// Re-export so consumers can import from the service if they prefer
export type { RegistroData };

export class AuthService {
  /**
   * POST /usuarios/login
   * Envía { email, contrasena } y recibe { accessToken, refreshToken, usuario }.
   * Retorna el objeto mapeado al formato esperado por el frontend.
   */
  static async login(credentials: AuthCredentials): Promise<AuthResponse> {
    const raw = await ApiClient.post<any>('/usuarios/login', {
      email:     credentials.email,
      contrasena: credentials.password,
    }, { auth: false });

    // Guardar refresh token en localStorage para futuras renovaciones
    if (typeof window !== 'undefined' && raw.refreshToken) {
      window.localStorage.setItem('gtt_refresh_token', raw.refreshToken);
    }

    return {
      access_token: raw.accessToken,
      usuario: raw.usuario,
    };
  }

  /**
   * POST /usuarios/clientes
   * Envía los campos de registro requeridos por el backend.
   */
  static async register(data: RegistroData): Promise<RegistroPendienteResponse> {
    const payload = {
      nombres:    data.nombres,
      apellidos:  data.apellidos,
      email:      data.email,
      contrasena: data.password,
      telefono:   data.celular,
      tipoDocumento: data.tipoDocumento,
      numeroDocumento: data.numeroDocumento,
      direccion: data.direccion?.trim() || null,
    };
    return ApiClient.post<RegistroPendienteResponse>('/usuarios/clientes', payload, { auth: false });
  }

  static async confirmRegistration(email: string, codigo: string): Promise<AuthResponse> {
    const raw = await ApiClient.post<any>(
      '/usuarios/clientes/confirmar',
      { email, codigo },
      { auth: false },
    );

    if (typeof window !== 'undefined' && raw.refreshToken) {
      window.localStorage.setItem('gtt_refresh_token', raw.refreshToken);
    }

    return {
      access_token: raw.accessToken,
      usuario: raw.usuario,
    };
  }

  static async resendRegistrationCode(
    email: string,
  ): Promise<RegistroPendienteResponse> {
    return ApiClient.post<RegistroPendienteResponse>(
      '/usuarios/clientes/reenviar-codigo',
      { email },
      { auth: false },
    );
  }

  static async cancelRegistration(token: string): Promise<void> {
    await ApiClient.post<void>(
      '/usuarios/clientes/anular',
      { token },
      { auth: false },
    );
  }

  /**
   * POST /usuarios/logout
   */
  static async logout(): Promise<void> {
    return ApiClient.post<void>('/usuarios/logout', {});
  }

  /**
   * POST /usuarios/refresh-token
   * Renueva la sesión usando el refresh token almacenado.
   */
  static async refreshToken(refreshToken: string): Promise<AuthResponse> {
    const raw = await ApiClient.post<any>('/usuarios/refresh-token', { refreshToken }, { auth: false });
    return {
      access_token: raw.accessToken,
      usuario: raw.usuario,
    };
  }

  static async requestPasswordReset(email: string): Promise<void> {
    return ApiClient.post<void>(
      '/usuarios/recuperar-contrasena',
      { email },
      { auth: false },
    );
  }

  static async resetPassword(
    token: string,
    contrasenaNueva: string,
  ): Promise<void> {
    return ApiClient.post<void>(
      '/usuarios/restablecer-contrasena',
      { token, contrasenaNueva },
      { auth: false },
    );
  }
}
