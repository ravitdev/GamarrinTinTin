'use client';

// ============================================================================
// SUB-COMPONENTE INTERNO (Catalogo) - No reutilizable fuera de esta feature.
// Recibe estado y callbacks por props desde la pantalla; sin logica de fetch.
// ============================================================================

import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import type { ProductCategory, ProductSize, DesignType } from '@/lib/types';
import type { CatalogoFilters } from '../hooks/use-catalogo';

interface FilterSidebarProps {
  filters: CatalogoFilters;
  activeFiltersCount: number;
  onToggleCategory: (cat: ProductCategory) => void;
  onToggleSize: (size: ProductSize) => void;
  onToggleDesign: (tipo: DesignType) => void;
  onClear: () => void;
}

export function FilterSidebar({
  filters,
  activeFiltersCount,
  onToggleCategory,
  onToggleSize,
  onToggleDesign,
  onClear,
}: FilterSidebarProps) {
  return (
    <div className="space-y-6">
      {/* Categorias */}
      <div>
        <h3 className="mb-3 font-medium text-foreground">Categoria</h3>
        <div className="space-y-2">
          <label className="flex cursor-pointer items-center gap-2">
            <Checkbox
              checked={filters.categorias.includes('polo')}
              onCheckedChange={() => onToggleCategory('polo')}
            />
            <span className="text-sm">Polos</span>
          </label>
          <label className="flex cursor-pointer items-center gap-2">
            <Checkbox
              checked={filters.categorias.includes('polera')}
              onCheckedChange={() => onToggleCategory('polera')}
            />
            <span className="text-sm">Poleras</span>
          </label>
        </div>
      </div>

      {/* Tallas */}
      <div>
        <h3 className="mb-3 font-medium text-foreground">Talla</h3>
        <div className="flex flex-wrap gap-2">
          {(['S', 'M', 'L', 'XL'] as ProductSize[]).map((size) => (
            <button
              key={size}
              onClick={() => onToggleSize(size)}
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-lg border text-sm font-medium transition-colors',
                filters.tallas.includes(size)
                  ? 'border-accent bg-accent text-accent-foreground'
                  : 'border-border bg-card hover:border-accent/50'
              )}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      {/* Tipo de Diseno */}
      <div>
        <h3 className="mb-3 font-medium text-foreground">Tipo de Diseno</h3>
        <div className="space-y-2">
          <label className="flex cursor-pointer items-center gap-2">
            <Checkbox
              checked={filters.tipoDiseno.includes('predefinido')}
              onCheckedChange={() => onToggleDesign('predefinido')}
            />
            <span className="text-sm">Disenos Predefinidos</span>
          </label>
          <label className="flex cursor-pointer items-center gap-2">
            <Checkbox
              checked={filters.tipoDiseno.includes('personalizable')}
              onCheckedChange={() => onToggleDesign('personalizable')}
            />
            <span className="text-sm">Personalizables</span>
          </label>
        </div>
      </div>

      {/* Limpiar Filtros */}
      {activeFiltersCount > 0 && (
        <Button variant="outline" className="w-full" onClick={onClear}>
          <X className="mr-2 h-4 w-4" />
          Limpiar Filtros
        </Button>
      )}
    </div>
  );
}
