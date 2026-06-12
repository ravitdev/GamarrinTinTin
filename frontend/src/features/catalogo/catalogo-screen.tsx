'use client';

// ============================================================================
// CAPA DE PANTALLA / FEATURE (Catalogo) - Vista principal.
// ----------------------------------------------------------------------------
// Consume el Custom Hook (use-catalogo) y renderiza el diseno visual
// (Radix UI + Tailwind). Esta limpia de logica pesada: no hace fetch ni
// calcula filtros; solo distribuye estado y callbacks a los componentes.
// ============================================================================

import dynamic from 'next/dynamic';
import { Filter, SlidersHorizontal, Grid3X3, LayoutList, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { ProductGrid } from '@/components/product/product-grid';
import { cn } from '@/lib/utils';
import { useCatalogo } from './hooks/use-catalogo';
import type { CatalogoSort } from './services/catalogo.service';
import { useCart } from '@/features/cart/hooks/use-cart';

const FilterSidebar = dynamic(() => import('./components/filter-sidebar').then(mod => ({ default: mod.FilterSidebar })), {
  loading: () => <div className="text-xs text-muted-foreground">Cargando filtros...</div>,
});

export function CatalogoScreen() {
  const { cart } = useCart();
  const {
    products,
    total,
    isLoading,
    filters,
    sortBy,
    viewMode,
    activeFiltersCount,
    setSortBy,
    setViewMode,
    toggleCategoryFilter,
    toggleSizeFilter,
    toggleDesignFilter,
    clearFilters,
  } = useCatalogo();

  return (
    <div className="flex min-h-screen flex-col">
      <Header cartItemCount={cart?.items?.length || 0} />

      <main className="flex-1 py-8">
        <div className="container mx-auto px-4">
          {/* Encabezado */}
          <div className="mb-8">
            <h1 className="font-serif text-3xl font-semibold text-foreground">
              Catalogo de Productos
            </h1>
            <p className="mt-2 text-muted-foreground">
              Encuentra la prenda perfecta para tu marca o evento
            </p>
          </div>

          {/* Filtros activos */}
          {activeFiltersCount > 0 && (
            <div className="mb-6 flex flex-wrap items-center gap-2">
              <span className="text-sm text-muted-foreground">Filtros activos:</span>
              {filters.categorias.map((cat) => (
                <Badge key={cat} variant="secondary" className="gap-1 capitalize">
                  {cat}
                  <button onClick={() => toggleCategoryFilter(cat)}>
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              {filters.tallas.map((size) => (
                <Badge key={size} variant="secondary" className="gap-1">
                  Talla {size}
                  <button onClick={() => toggleSizeFilter(size)}>
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              {filters.tipoDiseno.map((tipo) => (
                <Badge key={tipo} variant="secondary" className="gap-1 capitalize">
                  {tipo}
                  <button onClick={() => toggleDesignFilter(tipo)}>
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              <button onClick={clearFilters} className="text-sm text-accent hover:underline">
                Limpiar todos
              </button>
            </div>
          )}

          <div className="flex gap-8">
            {/* Sidebar de filtros (desktop) */}
            <aside className="hidden w-64 shrink-0 lg:block">
              <div className="sticky top-24 rounded-xl border border-border bg-card p-6">
                <div className="mb-4 flex items-center gap-2">
                  <Filter className="h-5 w-5 text-accent" />
                  <h2 className="font-medium text-foreground">Filtros</h2>
                </div>
                <FilterSidebar
                  filters={filters}
                  activeFiltersCount={activeFiltersCount}
                  onToggleCategory={toggleCategoryFilter}
                  onToggleSize={toggleSizeFilter}
                  onToggleDesign={toggleDesignFilter}
                  onClear={clearFilters}
                />
              </div>
            </aside>

            {/* Contenido principal */}
            <div className="flex-1">
              {/* Toolbar */}
              <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-card p-4">
                <div className="flex items-center gap-4">
                  {/* Filtros en mobile */}
                  <Sheet>
                    <SheetTrigger asChild>
                      <Button variant="outline" size="sm" className="lg:hidden">
                        <SlidersHorizontal className="mr-2 h-4 w-4" />
                        Filtros
                        {activeFiltersCount > 0 && (
                          <Badge className="ml-2 bg-accent text-accent-foreground">
                            {activeFiltersCount}
                          </Badge>
                        )}
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="left">
                      <SheetHeader>
                        <SheetTitle>Filtros</SheetTitle>
                      </SheetHeader>
                      <div className="mt-6">
                        <FilterSidebar
                          filters={filters}
                          activeFiltersCount={activeFiltersCount}
                          onToggleCategory={toggleCategoryFilter}
                          onToggleSize={toggleSizeFilter}
                          onToggleDesign={toggleDesignFilter}
                          onClear={clearFilters}
                        />
                      </div>
                    </SheetContent>
                  </Sheet>

                  <span className="text-sm text-muted-foreground">
                    {isLoading ? 'Cargando...' : `${total} productos encontrados`}
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  {/* Orden */}
                  <Select value={sortBy} onValueChange={(v) => setSortBy(v as CatalogoSort)}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Ordenar por" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="relevance">Relevancia</SelectItem>
                      <SelectItem value="price-asc">Precio: Menor a Mayor</SelectItem>
                      <SelectItem value="price-desc">Precio: Mayor a Menor</SelectItem>
                      <SelectItem value="newest">Mas Recientes</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Toggle de vista */}
                  <div className="hidden items-center rounded-lg border border-border p-1 sm:flex">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={cn(
                        'rounded p-1.5 transition-colors',
                        viewMode === 'grid'
                          ? 'bg-accent text-accent-foreground'
                          : 'text-muted-foreground hover:text-foreground'
                      )}
                    >
                      <Grid3X3 className="h-4 w-4" />
                      <span className="sr-only">Vista cuadricula</span>
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={cn(
                        'rounded p-1.5 transition-colors',
                        viewMode === 'list'
                          ? 'bg-accent text-accent-foreground'
                          : 'text-muted-foreground hover:text-foreground'
                      )}
                    >
                      <LayoutList className="h-4 w-4" />
                      <span className="sr-only">Vista lista</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Productos */}
              <ProductGrid
                products={products}
                emptyMessage="No se encontraron productos con los filtros seleccionados"
                viewMode={viewMode}
              />
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
