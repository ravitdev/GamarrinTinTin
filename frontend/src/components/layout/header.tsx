'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { ShoppingCart, User, Menu, X, Search, ChevronDown, LayoutDashboard, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { RolUsuario } from '@/lib/types';

interface MaintenanceBanner {
  activo: boolean;
  mensaje: string;
  fechaInicio?: string;
  fechaFin?: string;
}

const MAINTENANCE_KEY = 'gtt_maintenance';

export function Header({ cartItemCount = 0 }: { cartItemCount?: number }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen]         = useState(false);
  const [maintenance, setMaintenance]           = useState<MaintenanceBanner | null>(null);

  const { isLoggedIn, user, rol, logout, isHydrating } = useAuth();

  // Read maintenance config from localStorage (set by admin config page)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(MAINTENANCE_KEY);
      if (stored) {
        const cfg: MaintenanceBanner = JSON.parse(stored);
        setMaintenance(cfg);
      }
    } catch { /* ignore */ }
  }, []);

  // Deep-link directo al area de trabajo de cada rol
  const panelHref  = rol === RolUsuario.ADMINISTRADOR ? '/admin'        : '/vendedor';
  const panelLabel = rol === RolUsuario.ADMINISTRADOR ? 'Volver al Panel Admin'   : 'Volver al Panel Vendedor';
  const showPanel  = isLoggedIn && (rol === RolUsuario.ADMINISTRADOR || rol === RolUsuario.VENDEDOR);

  const userName = user ? `${user.nombres} ${user.apellidos}` : '';
  const rolLabel = user?.rol ?? '';

  return (
    <>
    {/* Maintenance Banner */}
    {maintenance?.activo && (
      <div className="w-full bg-yellow-400 text-yellow-900 py-2 px-4 flex items-center justify-center gap-2 text-sm font-medium z-50">
        <AlertTriangle className="w-4 h-4 shrink-0" />
        <span>{maintenance.mensaje || 'El sistema estará en mantenimiento programado. Disculpe las molestias.'}</span>
        {maintenance.fechaInicio && maintenance.fechaFin && (
          <span className="hidden sm:inline opacity-75">
            ({new Date(maintenance.fechaInicio).toLocaleString('es-PE')} – {new Date(maintenance.fechaFin).toLocaleString('es-PE')})
          </span>
        )}
      </div>
    )}
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <span className="font-serif text-xl font-bold text-primary-foreground">G</span>
            </div>
            <span className="hidden font-serif text-xl font-semibold text-foreground sm:inline-block">
              GamarrinTinTin
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-8 md:flex">
            <Link
              href="/catalogo"
              className="text-sm font-medium text-foreground/80 transition-colors hover:text-foreground"
            >
              Catalogo
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-1 text-sm font-medium text-foreground/80 transition-colors hover:text-foreground">
                Categorias
                <ChevronDown className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="w-48">
                <DropdownMenuItem asChild>
                  <Link href="/catalogo?categoria=polo">Polos</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/catalogo?categoria=polera">Poleras</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/catalogo?tipo=personalizable">Personalizables</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Link
              href="/nosotros"
              className="text-sm font-medium text-foreground/80 transition-colors hover:text-foreground"
            >
              Nosotros
            </Link>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Search Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="hidden sm:flex"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
            >
              <Search className="h-5 w-5" />
              <span className="sr-only">Buscar</span>
            </Button>

            {/* Backoffice shortcut — visible solo para ADMIN y VENDEDOR */}
            {showPanel && (
              <Link href={panelHref} className="hidden sm:block">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 border-accent/40 text-accent hover:bg-accent/10 hover:text-accent"
                >
                  <LayoutDashboard className="h-3.5 w-3.5" />
                  {panelLabel}
                </Button>
              </Link>
            )}

            {/* Cart */}
            <Link href="/carrito">
              <Button variant="ghost" size="icon" className="relative">
                <ShoppingCart className="h-5 w-5" />
                {cartItemCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-xs font-medium text-accent-foreground">
                    {cartItemCount > 9 ? '9+' : cartItemCount}
                  </span>
                )}
                <span className="sr-only">Carrito de compras</span>
              </Button>
            </Link>

            {/* User Menu — while hydrating show nothing to avoid flash */}
            {!isHydrating && (
              isLoggedIn ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <User className="h-5 w-5" />
                      <span className="sr-only">Menu de usuario</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="px-2 py-1.5">
                      <p className="text-sm font-medium">{userName}</p>
                      <p className="text-xs capitalize text-muted-foreground">{rolLabel.toLowerCase()}</p>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/mi-cuenta">Mi Cuenta</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/mis-pedidos">Mis Pedidos</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/mis-cotizaciones">Mis Cotizaciones</Link>
                    </DropdownMenuItem>
                    {showPanel && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link href={panelHref} className="flex items-center gap-2">
                            <LayoutDashboard className="h-4 w-4" />
                            {panelLabel}
                          </Link>
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onSelect={() => logout()}
                    >
                      Cerrar Sesión
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <div className="hidden items-center gap-2 sm:flex">
                  <Link href="/login">
                    <Button variant="ghost" size="sm">
                      Iniciar Sesion
                    </Button>
                  </Link>
                  <Link href="/registro">
                    <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90">
                      Registrarse
                    </Button>
                  </Link>
                </div>
              )
            )}

            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              <span className="sr-only">Menu</span>
            </Button>
          </div>
        </div>

        {/* Search Bar (Expandable) */}
        <div
          className={cn(
            'overflow-hidden transition-all duration-300',
            isSearchOpen ? 'h-14 opacity-100' : 'h-0 opacity-0'
          )}
        >
          <div className="flex items-center gap-2 pb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                placeholder="Buscar productos..."
                className="h-10 w-full rounded-lg border border-input bg-background pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <Button variant="outline" size="sm" onClick={() => setIsSearchOpen(false)}>
              Cancelar
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={cn(
          'border-t border-border bg-card md:hidden',
          isMobileMenuOpen ? 'block' : 'hidden'
        )}
      >
        <nav className="container mx-auto space-y-1 px-4 py-4">
          <Link
            href="/catalogo"
            className="block rounded-lg px-3 py-2 text-sm font-medium hover:bg-muted"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Catalogo
          </Link>
          <Link
            href="/catalogo?categoria=polo"
            className="block rounded-lg px-3 py-2 pl-6 text-sm text-muted-foreground hover:bg-muted"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Polos
          </Link>
          <Link
            href="/catalogo?categoria=polera"
            className="block rounded-lg px-3 py-2 pl-6 text-sm text-muted-foreground hover:bg-muted"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Poleras
          </Link>
          <Link
            href="/nosotros"
            className="block rounded-lg px-3 py-2 text-sm font-medium hover:bg-muted"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Nosotros
          </Link>
          {/* Backoffice shortcut (mobile) */}
          {showPanel && (
            <Link
              href={panelHref}
              className="flex items-center gap-2 rounded-lg border border-accent/40 px-3 py-2 text-sm font-medium text-accent hover:bg-accent/10"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <LayoutDashboard className="h-4 w-4" />
              {panelLabel}
            </Link>
          )}
          {!isLoggedIn && (
            <div className="flex gap-2 pt-4">
              <Link href="/login" className="flex-1">
                <Button variant="outline" className="w-full" size="sm">
                  Iniciar Sesion
                </Button>
              </Link>
              <Link href="/registro" className="flex-1">
                <Button className="w-full bg-accent text-accent-foreground hover:bg-accent/90" size="sm">
                  Registrarse
                </Button>
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
    </>
  );
}
