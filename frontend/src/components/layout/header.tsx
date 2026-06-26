'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { ShoppingCart, User, Menu, X, Search, LayoutDashboard, AlertTriangle } from 'lucide-react';
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
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen]         = useState(false);
  const [searchTerm, setSearchTerm]             = useState('');
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

  const runSearch = () => {
    const term = searchTerm.trim();
    router.push(term ? `/catalogo?buscar=${encodeURIComponent(term)}` : '/catalogo');
    setIsSearchOpen(false);
    setIsMobileMenuOpen(false);
  };

  return (
    <>
    {/* Maintenance Banner */}
    {maintenance?.activo && (
      <div className="flex w-full items-center justify-center gap-2 bg-warning px-4 py-2 text-sm font-medium text-warning-foreground">
        <AlertTriangle className="h-4 w-4 shrink-0" />
        <span>{maintenance.mensaje || 'El sistema estará en mantenimiento programado. Disculpe las molestias.'}</span>
        {maintenance.fechaInicio && maintenance.fechaFin && (
          <span className="hidden opacity-75 sm:inline">
            ({new Date(maintenance.fechaInicio).toLocaleString('es-PE')} – {new Date(maintenance.fechaFin).toLocaleString('es-PE')})
          </span>
        )}
      </div>
    )}
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card/85 backdrop-blur supports-[backdrop-filter]:bg-card/70">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" className="group flex items-center gap-2.5">
            <div className="reg-frame flex h-9 w-9 items-center justify-center rounded-md bg-primary">
              <span className="font-display text-lg font-bold text-primary-foreground">G</span>
            </div>
            <span className="hidden font-display text-lg font-bold tracking-tight text-foreground sm:inline-block">
              Gamarrin<span className="text-accent">TinTin</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-7 md:flex">
            <Link
              href="/catalogo"
              className="text-sm font-medium text-foreground/70 transition-colors hover:text-foreground"
            >
              Catálogo
            </Link>
            <Link
              href="/solicitar-cotizacion"
              className="text-sm font-medium text-foreground/70 transition-colors hover:text-foreground"
            >
              Cotizar por volumen
            </Link>
            <Link
              href="/nosotros"
              className="text-sm font-medium text-foreground/70 transition-colors hover:text-foreground"
            >
              Nosotros
            </Link>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-1.5">
            {/* Search Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="hidden sm:flex"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
            >
              <Search className="h-5 w-5" />
              <span className="sr-only">Buscar productos</span>
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
                  <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-accent font-mono text-[10px] font-semibold text-accent-foreground">
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
                      <span className="sr-only">Menú de usuario</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="px-2 py-1.5">
                      <p className="text-sm font-medium">{userName}</p>
                      <p className="text-xs capitalize text-muted-foreground">{rolLabel.toLowerCase()}</p>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/mi-cuenta">Mi cuenta</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/mis-pedidos">Mis pedidos</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/mis-cotizaciones">Mis cotizaciones</Link>
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
                      Cerrar sesión
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <div className="hidden items-center gap-2 sm:flex">
                  <Link href="/login">
                    <Button variant="ghost" size="sm">
                      Iniciar sesión
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
              <span className="sr-only">Menú</span>
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
          <form
            className="flex items-center gap-2 pb-4"
            onSubmit={(e) => { e.preventDefault(); runSearch(); }}
          >
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                autoFocus={isSearchOpen}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar polos, poleras, diseños…"
                className="h-10 w-full rounded-lg border border-input bg-background pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <Button type="submit" size="sm">Buscar</Button>
            <Button type="button" variant="outline" size="sm" onClick={() => setIsSearchOpen(false)}>
              Cancelar
            </Button>
          </form>
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
          {/* Mobile search */}
          <form
            className="relative mb-3"
            onSubmit={(e) => { e.preventDefault(); runSearch(); }}
          >
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar productos…"
              className="h-10 w-full rounded-lg border border-input bg-background pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </form>
          <Link
            href="/catalogo"
            className="block rounded-lg px-3 py-2 text-sm font-medium hover:bg-muted"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Catálogo
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
            href="/solicitar-cotizacion"
            className="block rounded-lg px-3 py-2 text-sm font-medium hover:bg-muted"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Cotizar por volumen
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
                  Iniciar sesión
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
