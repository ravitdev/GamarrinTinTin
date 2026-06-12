'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Heart, Eye, Sparkles, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Producto } from '@/lib/types';
import { cn } from '@/lib/utils';
import { formatPrice } from '@/lib/mock-data';

interface ProductListItemProps {
  product: Producto;
}

export function ProductListItem({ product }: ProductListItemProps) {
  const [selectedColorIndex, setSelectedColorIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);

  const selectedColor = product.colores?.[selectedColorIndex] || { nombre: 'Blanco', codigoHex: '#FFFFFF', urlImagen: '' };
  const hasDiscount = (product.descuentosVolumen || []).length > 0;
  const maxDiscount = hasDiscount 
    ? Math.max(...(product.descuentosVolumen || []).map(d => d.porcentajeDescuento))
    : 0;

  return (
    <div className="group flex gap-4 rounded-xl border border-border bg-card p-4 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 sm:gap-6">
      {/* Image Container */}
      <div className="relative aspect-square w-32 shrink-0 overflow-hidden rounded-lg bg-muted sm:w-40 md:w-48">
        <div className="flex h-full w-full flex-col items-center justify-center gap-2 p-4">
          <div 
            className="h-20 w-16 rounded-lg border-2 border-dashed border-border sm:h-24 sm:w-20"
            style={{ backgroundColor: selectedColor.codigoHex === '#FFFFFF' ? '#f5f5f5' : selectedColor.codigoHex }}
          />
          <span className="text-xs text-muted-foreground">{selectedColor.nombre}</span>
        </div>

        {/* Badges */}
        <div className="absolute left-2 top-2 flex flex-col gap-1">
          {product.esPersonalizable && (
            <Badge className="bg-accent text-accent-foreground text-xs px-1.5 py-0.5">
              <Sparkles className="mr-1 h-3 w-3" />
              Personalizable
            </Badge>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col">
        {/* Top Row */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            {/* Category */}
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Producto
            </span>

            {/* Name */}
            <Link href={`/producto/${product.idProducto}`}>
              <h3 className="mt-1 text-lg font-medium text-foreground transition-colors hover:text-accent">
                {product.nombre}
              </h3>
            </Link>

            {/* Description */}
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
              {product.descripcion}
            </p>
          </div>

          {/* Favorite Button */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={(e) => {
              e.preventDefault();
              setIsFavorite(!isFavorite);
            }}
          >
            <Heart 
              className={cn(
                "h-4 w-4 transition-colors",
                isFavorite ? "fill-accent text-accent" : "text-muted-foreground"
              )} 
            />
            <span className="sr-only">Agregar a favoritos</span>
          </Button>
        </div>

        {/* Middle Row - Colors and Sizes */}
        <div className="mt-3 flex flex-wrap items-center gap-4">
          {/* Colors */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Colores:</span>
            <div className="flex items-center gap-1">
              {(product.colores || []).slice(0, 6).map((color, index) => (
                <button
                  key={color.idColor}
                  className={cn(
                    "h-5 w-5 rounded-full border-2 transition-all",
                    selectedColorIndex === index 
                      ? "border-accent ring-2 ring-accent/30" 
                      : "border-border hover:border-muted-foreground"
                  )}
                  style={{ 
                    backgroundColor: color.codigoHex,
                    boxShadow: color.codigoHex === '#FFFFFF' ? 'inset 0 0 0 1px rgba(0,0,0,0.1)' : 'none'
                  }}
                  onClick={() => setSelectedColorIndex(index)}
                  title={color.nombre}
                >
                  <span className="sr-only">{color.nombre}</span>
                </button>
              ))}
              {(product.colores || []).length > 6 && (
                <span className="text-xs text-muted-foreground">+{(product.colores || []).length - 6}</span>
              )}
            </div>
          </div>

          {/* Sizes */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Tallas:</span>
            <div className="flex items-center gap-1">
              {(product.tallas || []).map((talla) => (
                <span 
                  key={talla} 
                  className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground"
                >
                  {talla}
                </span>
              ))}
            </div>
          </div>

          {/* Stock */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Stock:</span>
            <span className={cn(
              "text-xs font-medium",
              (product.stock || 0) > 20 ? "text-green-600" : (product.stock || 0) > 0 ? "text-amber-600" : "text-red-600"
            )}>
              {(product.stock || 0) > 0 ? `${product.stock} unidades` : 'Sin stock'}
            </span>
          </div>
        </div>

        {/* Bottom Row - Price and Actions */}
        <div className="mt-auto flex flex-wrap items-center justify-between gap-4 pt-4">
          {/* Price */}
          <div className="flex items-baseline gap-3">
            <span className="text-xl font-semibold text-foreground">
              {formatPrice(product.precioBase)}
            </span>
            {maxDiscount > 0 && (
              <Badge variant="secondary" className="bg-primary/10 text-primary">
                Hasta -{maxDiscount}% por volumen
              </Badge>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {product.esPersonalizable && (
              <Button variant="outline" size="sm" asChild>
                <Link href={`/personalizar/${product.idProducto}`}>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Personalizar
                </Link>
              </Button>
            )}
            <Button size="sm" asChild>
              <Link href={`/producto/${product.idProducto}`}>
                <Eye className="mr-2 h-4 w-4" />
                Ver Detalle
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
