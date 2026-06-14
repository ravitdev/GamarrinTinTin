'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Heart, ShoppingCart, Eye, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { formatPrice } from '@/lib/mock-data';
import type { Producto } from '@/lib/types';

interface ProductCardProps {
  product: Producto;
}

export function ProductCard({ product }: ProductCardProps) {
  const [selectedColorIndex, setSelectedColorIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  const colores = product.colores || [];
  const selectedColor = colores[selectedColorIndex] || { nombre: '', codigoHex: '', urlImagen: '' };
  const descuentosVolumen = product.descuentosVolumen || [];
  const hasDiscount = descuentosVolumen.length > 0;
  const maxDiscount = hasDiscount 
    ? Math.max(...descuentosVolumen.map(d => d.porcentajeDescuento))
    : 0;
  const tallas = product.tallas || [];

  return (
    <div 
      className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-all duration-300 hover:shadow-lg hover:shadow-primary/5"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image Container */}
      <div className="relative aspect-square overflow-hidden bg-muted">
        {/* Product Image */}
        <div 
          className={cn(
            "absolute inset-0 flex items-center justify-center bg-secondary transition-transform duration-500",
            isHovered ? "scale-105" : "scale-100"
          )}
        >
          {/* Placeholder for product image */}
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 p-8">
            <div 
              className="h-32 w-24 rounded-lg border-2 border-dashed border-border"
              style={{ backgroundColor: selectedColor.codigoHex === '#FFFFFF' ? '#f5f5f5' : selectedColor.codigoHex }}
            />
            <span className="text-xs text-muted-foreground">{selectedColor.nombre}</span>
          </div>
        </div>

        {/* Badges */}
        <div className="absolute left-3 top-3 flex flex-col gap-2">
          {product.esPersonalizable && (
            <Badge className="bg-accent text-accent-foreground">
              <Sparkles className="mr-1 h-3 w-3" />
              Personalizable
            </Badge>
          )}
          {maxDiscount > 0 && (
            <Badge variant="secondary" className="bg-primary text-primary-foreground">
              Hasta -{maxDiscount}%
            </Badge>
          )}
        </div>

        {/* Quick Actions */}
        <div 
          className={cn(
            "absolute bottom-0 left-0 right-0 flex gap-2 p-3 transition-all duration-300",
            isHovered ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"
          )}
        >
          <Button
            size="sm"
            className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
            asChild
          >
            <Link href={`/producto/${product.idProducto}`}>
              <Eye className="mr-2 h-4 w-4" />
              Ver Detalle
            </Link>
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-4">
        {/* Category */}
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {/* categoria es ahora un objeto, mostrar nombre */}
          Producto
        </span>

        {/* Name */}
        <Link href={`/producto/${product.idProducto}`}>
          <h3 className="mt-1 line-clamp-2 font-medium text-foreground transition-colors hover:text-accent">
            {product.nombre}
          </h3>
        </Link>

        {/* Colors */}
        <div className="mt-3 flex items-center gap-2">
          {colores.map((color, index) => (
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
          {colores.length > 4 && (
            <span className="text-xs text-muted-foreground">+{colores.length - 4}</span>
          )}
        </div>

        {/* Sizes */}
        <div className="mt-2 flex items-center gap-1">
          {tallas.map((talla) => (
            <span 
              key={talla} 
              className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground"
            >
              {talla}
            </span>
          ))}
        </div>

        {/* Price */}
        <div className="mt-auto pt-4">
          <div className="flex items-baseline justify-between">
            <span className="text-lg font-semibold text-foreground">
              {formatPrice(product.precioBase)}
            </span>
            {hasDiscount && (
              <span className="text-xs text-accent">
                Descuentos por volumen
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
