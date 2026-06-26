// ============================================================================
// CAPA GLOBAL Y TRANSVERSAL - Cliente HTTP base
// ----------------------------------------------------------------------------
// Centraliza la configuracion del backend (NestJS) y maneja de forma generica:
//   - La URL base del API.
//   - La inyeccion obligatoria del token JWT en las cabeceras Authorization.
//   - El parseo tipado de la respuesta y el manejo de errores HTTP.
// Cualquier *.service.ts de la capa de features debe consumir este cliente y
// NUNCA llamar a fetch/axios directamente.
// ============================================================================

/** URL base del backend NestJS. Configurable por variable de entorno. */
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

/** Error tipado que expone el codigo de estado HTTP del backend. */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly body?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

function extractErrorMessage(data: unknown, fallback: string): string {
  if (!data || typeof data !== 'object') return fallback;

  if ('message' in data) {
    const message = (data as { message: unknown }).message;
    if (Array.isArray(message)) return message.map(String).join(', ');
    if (message) return String(message);
  }

  if ('error' in data) {
    const error = (data as { error: unknown }).error;
    if (typeof error === 'string') return error;
    if (error && typeof error === 'object' && 'issues' in error) {
      const issues = (error as { issues: unknown }).issues;
      if (Array.isArray(issues)) {
        return issues
          .map((issue) => {
            if (issue && typeof issue === 'object' && 'message' in issue) {
              return String((issue as { message: unknown }).message);
            }
            return String(issue);
          })
          .join(', ');
      }
    }
  }

  if ('issues' in data) {
    const issues = (data as { issues: unknown }).issues;
    if (Array.isArray(issues)) {
      return issues
        .map((issue) => {
          if (issue && typeof issue === 'object' && 'message' in issue) {
            return String((issue as { message: unknown }).message);
          }
          return String(issue);
        })
        .join(', ');
    }
  }

  return fallback;
}

/**
 * Recupera el token JWT almacenado en el cliente.
 * En un proyecto real esto podria leer de cookies httpOnly via un endpoint,
 * de un store de auth, etc. Aqui se centraliza para no repetir la logica.
 */
function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem('gtt_access_token');
}

type RequestOptions = Omit<RequestInit, 'body'> & {
  /** Cuerpo de la peticion; se serializa a JSON automaticamente. */
  body?: unknown;
  /** Si es false, no se inyecta el header Authorization. Por defecto true. */
  auth?: boolean;
};

/**
 * Punto unico de entrada para todas las solicitudes HTTP.
 * Retorna una promesa tipada con el cuerpo de la respuesta ya parseado.
 */
export async function apiClient<TResponse>(
  endpoint: string,
  { body, auth = true, headers, ...init }: RequestOptions = {}
): Promise<TResponse> {
  const finalHeaders = new Headers(headers);
  finalHeaders.set('Content-Type', 'application/json');

  // Inyeccion obligatoria del JWT cuando la peticion lo requiere.
  if (auth) {
    const token = getAuthToken();
    if (token) finalHeaders.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...init,
    headers: finalHeaders,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  // 204 No Content: no hay cuerpo que parsear.
  if (response.status === 204) {
    return undefined as TResponse;
  }

  const data = await response.json().catch(() => null);

  // 401 Unauthorized: sesión expirada o token inválido.
  // Si la petición no usa auth, por ejemplo login, se debe respetar el mensaje real del backend.
  if (response.status === 401) {
    const message = extractErrorMessage(
      data,
      'Sesión expirada. Por favor inicia sesión nuevamente.',
    );

    if (auth && typeof window !== 'undefined') {
      window.localStorage.removeItem('gtt_access_token');
      window.localStorage.removeItem('gtt_refresh_token');
      document.cookie = 'gtt_access_token=; Max-Age=0; path=/';

      if (!window.location.pathname.startsWith('/login')) {
        const reason =
          message === 'La cuenta no está disponible.'
            ? 'account_inactive'
            : 'session_expired';

        window.location.href = `/login?reason=${reason}`;
      }
    }

    throw new ApiError(response.status, message, data);
  }

  if (!response.ok) {
    const message = extractErrorMessage(data, `Error HTTP ${response.status}`);
    throw new ApiError(response.status, message, data);
  }

  // Desempaquetar el envoltorio del backend NestJS
  if (data && typeof data === 'object' && 'success' in data) {
    if (data.success === false) {
      throw new ApiError(response.status, extractErrorMessage(data, 'Error'), data);
    }
    if ('data' in data) {
      return data.data as TResponse;
    }
  }

  return data as TResponse;
}

/** Construye un query string a partir de un objeto, ignorando valores vacios. */
export function buildQueryString(
  params: Record<string, string | number | boolean | string[] | undefined | null>
): string {
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    if (Array.isArray(value)) {
      // NestJS recibe arrays repetidos: ?categorias=polo&categorias=polera
      value.forEach((v) => search.append(key, String(v)));
    } else {
      search.set(key, String(value));
    }
  }

  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

/**
 * Clase estatica de conveniencia que expone metodos HTTP tipados.
 * Internamente delega a la funcion `apiClient` para mantener la logica centralizada.
 */
export class ApiClient {
  static async get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return apiClient<T>(endpoint, { ...options, method: 'GET' });
  }

  static async post<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return apiClient<T>(endpoint, { ...options, method: 'POST', body });
  }

  static async put<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return apiClient<T>(endpoint, { ...options, method: 'PUT', body });
  }

  static async patch<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return apiClient<T>(endpoint, { ...options, method: 'PATCH', body });
  }

  static async delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return apiClient<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

