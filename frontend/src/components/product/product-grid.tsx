import type { Producto } from '@/lib/types';
import { ProductCard } from './product-card';
import { ProductListItem } from './product-list-item';

interface ProductGridProps {
  products: Producto[];
  emptyMessage?: string;
  emptySubMessage?: string;
  onEmptyAction?: () => void;
  emptyActionLabel?: string;
  viewMode?: 'grid' | 'list';
}

export function ProductGrid({ 
  products, 
  emptyMessage = 'No se encontraron productos',
  emptySubMessage,
  onEmptyAction,
  emptyActionLabel,
  viewMode = 'grid'
}: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/30 py-16 gap-3">
        <p className="text-muted-foreground text-center">{emptyMessage}</p>
        {emptySubMessage && (
          <p className="text-sm text-muted-foreground/70 text-center">{emptySubMessage}</p>
        )}
        {onEmptyAction && emptyActionLabel && (
          <button
            onClick={onEmptyAction}
            className="mt-2 text-sm font-medium text-accent underline underline-offset-4 hover:text-accent/80 transition-colors"
          >
            {emptyActionLabel}
          </button>
        )}
      </div>
    );
  }

  if (viewMode === 'list') {
    return (
      <div className="flex flex-col gap-4">
        {products.map((product) => (
          <ProductListItem key={product.idProducto} product={product} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.idProducto} product={product} />
      ))}
    </div>
  );
}
