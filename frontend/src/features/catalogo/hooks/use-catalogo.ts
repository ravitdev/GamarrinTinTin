'use client';

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
  buscar: string;
  categorias: ProductCategory[];
  tallas: ProductSize[];
  tipoDiseno: DesignType[];
}

const EMPTY_FILTERS: CatalogoFilters = {
  buscar: '',
  categorias: [],
  tallas: [],
  tipoDiseno: [],
};

export function useCatalogo() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get('categoria') as ProductCategory | null;
  const initialTipo = searchParams.get('tipo') as DesignType | null;
  const initialBuscar = searchParams.get('buscar') ?? '';

  const [filters, setFilters] = useState<CatalogoFilters>({
    ...EMPTY_FILTERS,
    buscar: initialBuscar,
    categorias: initialCategory ? [initialCategory] : [],
    tipoDiseno: initialTipo ? [initialTipo] : [],
  });

  const [sortBy, setSortBy] = useState<CatalogoSort>('relevance');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const query: CatalogoQuery = useMemo(
    () => ({
      buscar: filters.buscar,
      categorias: filters.categorias,
      tallas: filters.tallas,
      tipoDiseno: filters.tipoDiseno,
      sort: sortBy,
    }),
    [filters, sortBy],
  );

  const { data, error, isLoading } = useSWR(
    ['catalogo', query],
    () => fetchCatalogo(query),
    { keepPreviousData: true },
  );

  const products = data?.data ?? [];

  const activeFiltersCount =
    (filters.buscar.trim() ? 1 : 0) +
    filters.categorias.length +
    filters.tallas.length +
    filters.tipoDiseno.length;

  const setSearchText = useCallback((buscar: string) => {
    setFilters((prev) => ({
      ...prev,
      buscar,
    }));
  }, []);

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
    products,
    total: data?.total ?? products.length,
    isLoading,
    error,
    filters,
    sortBy,
    viewMode,
    activeFiltersCount,
    setSearchText,
    setSortBy,
    setViewMode,
    toggleCategoryFilter,
    toggleSizeFilter,
    toggleDesignFilter,
    clearFilters,
  };
}

export type UseCatalogoReturn = ReturnType<typeof useCatalogo>;