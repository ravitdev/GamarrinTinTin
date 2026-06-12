'use client';

// ============================================================================
// CAPA DE LOGICA / CUSTOM HOOK (Catalogo) - "La Logica Detras"
// ----------------------------------------------------------------------------
// Concentra TODA la logica de la pantalla:
//   - Estado de filtros, orden y modo de vista.
//   - Sincronizacion con los Query Params de la URL.
//   - Orquestacion del fetch de datos (via SWR) contra catalogo.service.
//   - Manejadores de eventos de UI.
// REGLA: NO contiene JSX/HTML. Solo retorna datos y callbacks a la pantalla.
// ============================================================================

import { useState, useCallback, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import useSWR from 'swr';
import {
  fetchCatalogo,
  type CatalogoQuery,
  type CatalogoSort,
} from '../services/catalogo.service';
import type { ProductCategory, ProductSize, DesignType } from '@/lib/types';

export interface CatalogoFilters {
  categorias: ProductCategory[];
  tallas: ProductSize[];
  tipoDiseno: DesignType[];
  precioMin: number | null;
  precioMax: number | null;
}

const EMPTY_FILTERS: CatalogoFilters = {
  categorias: [],
  tallas: [],
  tipoDiseno: [],
  precioMin: null,
  precioMax: null,
};

export function useCatalogo() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get('categoria') as ProductCategory | null;
  const initialTipo = searchParams.get('tipo') as DesignType | null;

  const [filters, setFilters] = useState<CatalogoFilters>({
    ...EMPTY_FILTERS,
    categorias: initialCategory ? [initialCategory] : [],
    tipoDiseno: initialTipo ? [initialTipo] : [],
  });
  const [sortBy, setSortBy] = useState<CatalogoSort>('relevance');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Construye los Query Params que se envian al servicio HTTP.
  const query: CatalogoQuery = useMemo(
    () => ({
      categorias: filters.categorias,
      tallas: filters.tallas,
      tipoDiseno: filters.tipoDiseno,
      precioMin: filters.precioMin,
      precioMax: filters.precioMax,
      sort: sortBy,
    }),
    [filters, sortBy]
  );

  // SWR maneja caching, revalidacion y estados de carga/error.
  // La key incluye los filtros para refetchear cuando cambian.
  const { data, error, isLoading } = useSWR(
    ['catalogo', query],
    () => fetchCatalogo(query),
    { keepPreviousData: true }
  );

  const products = data?.data ?? [];

  const activeFiltersCount =
    filters.categorias.length +
    filters.tallas.length +
    filters.tipoDiseno.length +
    (filters.precioMin ? 1 : 0) +
    (filters.precioMax ? 1 : 0);

  const toggleCategoryFilter = useCallback((cat: ProductCategory) => {
    setFilters((prev) => ({
      ...prev,
      categorias: prev.categorias.includes(cat)
        ? prev.categorias.filter((c) => c !== cat)
        : [...prev.categorias, cat],
    }));
  }, []);

  const toggleSizeFilter = useCallback((size: ProductSize) => {
    setFilters((prev) => ({
      ...prev,
      tallas: prev.tallas.includes(size)
        ? prev.tallas.filter((t) => t !== size)
        : [...prev.tallas, size],
    }));
  }, []);

  const toggleDesignFilter = useCallback((tipo: DesignType) => {
    setFilters((prev) => ({
      ...prev,
      tipoDiseno: prev.tipoDiseno.includes(tipo)
        ? prev.tipoDiseno.filter((t) => t !== tipo)
        : [...prev.tipoDiseno, tipo],
    }));
  }, []);

  const clearFilters = useCallback(() => setFilters(EMPTY_FILTERS), []);

  return {
    // Estado de datos
    products,
    total: data?.total ?? products.length,
    isLoading,
    error,
    // Estado de UI
    filters,
    sortBy,
    viewMode,
    activeFiltersCount,
    // Manejadores
    setSortBy,
    setViewMode,
    toggleCategoryFilter,
    toggleSizeFilter,
    toggleDesignFilter,
    clearFilters,
  };
}

export type UseCatalogoReturn = ReturnType<typeof useCatalogo>;
