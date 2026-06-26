'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AuthService, type RegistroPendienteResponse } from '../services/auth.service';
import type { Usuario, AuthResponse, RolUsuario, RegistroData, AuthCredentials } from '@/lib/types';

// ---------------------------------------------------------------------------
// Constantes compartidas con api-client.ts y middleware.ts
// ---------------------------------------------------------------------------
const TOKEN_KEY = 'gtt_access_token';
const USER_KEY  = 'gtt_user';

/** Guarda el token en localStorage Y en cookie para que el middleware lo lea. */
function persistToken(token: string): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(TOKEN_KEY, token);
  // Cookie legible por el middleware (no httpOnly): 7 días
  document.cookie = `${TOKEN_KEY}=${token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Strict`;
}

/** Persiste el usuario serializado en localStorage. */
function persistUser(user: Usuario): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(USER_KEY, JSON.stringify(user));
}

/** Elimina el token y el usuario de localStorage y de la cookie. */
function clearSession(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);
  document.cookie = `${TOKEN_KEY}=; path=/; max-age=0`;
}

/** Lee el usuario cacheado de localStorage (solo para rehidratación). */
function readCachedUser(): Usuario | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as Usuario) : null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Tipos del hook
// ---------------------------------------------------------------------------
interface UseAuthReturn {
  isLoading:   boolean;
  isHydrating: boolean;
  error:       string | null;
  isLoggedIn:  boolean;
  user:        Usuario | null;
  rol:         RolUsuario | null;
  login:       (credentials: AuthCredentials) => Promise<void>;
  register:    (data: RegistroData) => Promise<RegistroPendienteResponse>;
  confirmRegistration: (email: string, codigo: string) => Promise<void>;
  logout:      () => Promise<void>;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------
export function useAuth(): UseAuthReturn {
  const router = useRouter();

  const [isLoading, setIsLoading]     = useState(false);
  const [isHydrating, setIsHydrating] = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [user, setUser]               = useState<Usuario | null>(null);

  // ----- Rehidratación de sesión al montar -----
  // No hay endpoint /auth/me: se rehidrata desde el usuario cacheado en
  // localStorage que se guarda en cada login exitoso.
  useEffect(() => {
    const token = typeof window !== 'undefined'
      ? window.localStorage.getItem(TOKEN_KEY)
      : null;

    if (!token) {
      setIsHydrating(false);
      return;
    }

    const cached = readCachedUser();
    if (cached) {
      setUser(cached);
    } else {
      // Token existe pero no hay usuario cacheado → sesión corrupta, limpiar.
      clearSession();
    }

    setIsHydrating(false);
  }, []);

  // ----- Login -----
  const login = useCallback(
    async (credentials: AuthCredentials) => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await AuthService.login(credentials) as AuthResponse;
        persistToken(response.access_token);
        persistUser(response.usuario);
        setUser(response.usuario);

        // Redirigir según rol al panel correspondiente o al callback si existe
        const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
        const callback = params?.get('callback');
        if (callback) {
          router.push(callback);
        } else {
          const rol = response.usuario.rol;
          if (rol === 'ADMINISTRADOR') {
            router.push('/admin');
          } else if (rol === 'VENDEDOR') {
            router.push('/vendedor');
          } else {
            router.push('/catalogo');
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Credenciales incorrectas');
        throw err; // re-lanzar para que la pantalla pueda disparar el toast
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // ----- Registro -----
  const register = useCallback(
    async (data: RegistroData) => {
      setIsLoading(true);
      setError(null);
      try {
        return await AuthService.register(data);
        // Registro exitoso → redirigir a login con mensaje
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al crear la cuenta');
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [router]
  );

  // ----- Confirmacion de registro -----
  const confirmRegistration = useCallback(
    async (email: string, codigo: string) => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await AuthService.confirmRegistration(email, codigo);
        persistToken(response.access_token);
        persistUser(response.usuario);
        setUser(response.usuario);
        router.push('/catalogo');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al confirmar la cuenta');
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [router]
  );

  // ----- Logout -----
  const logout = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      await AuthService.logout().catch(() => {
        // Si el backend falla, igual limpiamos localmente
      });
    } finally {
      clearSession();
      setUser(null);
      setIsLoading(false);
      router.push('/login');
    }
  }, [router]);

  return {
    isLoading,
    isHydrating,
    error,
    isLoggedIn: user !== null,
    user,
    rol: user?.rol ?? null,
    login,
    register,
    confirmRegistration,
    logout,
  };
}
