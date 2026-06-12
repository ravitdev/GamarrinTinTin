// ============================================================================
// MIDDLEWARE DE SEGURIDAD PERIMETRAL
// ----------------------------------------------------------------------------
// Intercepta rutas privadas antes de que lleguen al servidor/cliente.
// Estrategia: parsear el JWT de la cookie (sin verificar firma — el backend
// lo valida). Si el claim 'rol' no tiene permiso para la ruta solicitada,
// redirige a /catalogo.
//
// Rutas protegidas:
//   /admin/*     → solo RolUsuario.ADMINISTRADOR
//   /vendedor/*  → solo RolUsuario.VENDEDOR o ADMINISTRADOR
// ============================================================================

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { RolUsuario } from '@/lib/types';

const COOKIE_NAME = 'gtt_access_token';

/** Decodifica el payload de un JWT sin verificar la firma (solo frontend). */
function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    // Base64url → Base64 → JSON
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = Buffer.from(base64, 'base64').toString('utf-8');
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const token = request.cookies.get(COOKIE_NAME)?.value ?? null;
  const payload = token ? decodeJwtPayload(token) : null;
  const rol = payload?.rol as RolUsuario | undefined;

  // --- Rutas /admin/* → solo ADMINISTRADOR ---
  if (pathname.startsWith('/admin')) {
    if (!token || rol !== RolUsuario.ADMINISTRADOR) {
      return NextResponse.redirect(new URL('/catalogo', request.url));
    }
  }

  // --- Rutas /vendedor/* → VENDEDOR o ADMINISTRADOR ---
  if (pathname.startsWith('/vendedor')) {
    const permitido =
      rol === RolUsuario.VENDEDOR || rol === RolUsuario.ADMINISTRADOR;
    if (!token || !permitido) {
      return NextResponse.redirect(new URL('/catalogo', request.url));
    }
  }

  return NextResponse.next();
}

/** Solo correr en las rutas privadas; ignorar assets y API routes. */
export const config = {
  matcher: ['/admin/:path*', '/vendedor/:path*'],
};
