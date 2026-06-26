'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { formatPrice } from '@/lib/mock-data';
import type { Producto } from '@/lib/types';

interface ProductCardProps {
  product: Producto;
}

// La categoria puede llegar como string u objeto { nombre } segun el origen.
function getCategoryName(product: Producto): string {
  const cat = (product as any).categoria;
  if (!cat) return 'Prenda';
  if (typeof cat === 'string') return cat;
  return cat.nombre || 'Prenda';
}

export function ProductCard({ product }: ProductCardProps) {
  const [selectedColorIndex, setSelectedColorIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const colores = product.colores || [];
  const selectedColor = colores[selectedColorIndex] || { nombre: '', codigoHex: '', urlImagen: '' };
  const descuentosVolumen = product.descuentosVolumen || [];
  const hasDiscount = descuentosVolumen.length > 0;
  const maxDiscount = hasDiscount
    ? Math.max(...descuentosVolumen.map(d => d.porcentajeDescuento))
    : 0;
  const tallas = product.tallas || [];
  const categoria = getCategoryName(product);

  return (
    <div
      className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-all duration-300 hover:border-foreground/15 hover:shadow-[0_12px_40px_-20px] hover:shadow-primary/40"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image Container */}
      <div className="relative aspect-square overflow-hidden bg-secondary">
        {/* Print-area registration frame (signature), visible on hover */}
        <div
          className={cn(
            'reg-frame pointer-events-none absolute inset-5 z-10 rounded-sm transition-opacity duration-300',
            isHovered ? 'opacity-100' : 'opacity-0'
          )}
        />
        {/* Product Image */}
        <div
          className={cn(
            'absolute inset-0 flex items-center justify-center transition-transform duration-500',
            isHovered ? 'scale-[1.04]' : 'scale-100'
          )}
        >
          {selectedColor.urlImagen && selectedColor.urlImagen !== '/placeholder.svg' ? (
            <img
              src={selectedColor.urlImagen}
              alt={product.nombre}
              className="h-full w-full object-contain p-4"
              crossOrigin="anonymous"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-2 p-8">
              <div
                className="h-32 w-24 rounded-lg border border-border"
                style={{ backgroundColor: selectedColor.codigoHex === '#FFFFFF' ? '#f3f4f6' : selectedColor.codigoHex }}
              />
              <span className="font-mono text-xs text-muted-foreground">{selectedColor.nombre}</span>
            </div>
          )}
        </div>

        {/* Badges */}
        <div className="absolute left-3 top-3 z-20 flex flex-col gap-2">
          {product.esPersonalizable && (
            <Badge className="gap-1 bg-accent text-accent-foreground">
              <Sparkles className="h-3 w-3" />
              Personalizable
            </Badge>
          )}
          {maxDiscount > 0 && (
            <Badge variant="secondary" className="border border-border bg-card font-mono text-foreground">
              hasta −{maxDiscount}%
            </Badge>
          )}
        </div>

        {/* Quick Actions */}
        <div
          className={cn(
            'absolute inset-x-0 bottom-0 z-20 flex gap-2 p-3 transition-all duration-300',
            isHovered ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
          )}
        >
          <Button size="sm" className="flex-1" asChild>
            <Link href={`/producto/${product.idProducto}`}>
              Ver detalle
              <ArrowUpRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-4">
        {/* Category */}
        <span className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
          {categoria}
        </span>

        {/* Name */}
        <Link href={`/producto/${product.idProducto}`}>
          <h3 className="mt-1 line-clamp-2 font-medium text-foreground transition-colors group-hover:text-accent">
            {product.nombre}
          </h3>
        </Link>

        {/* Colors */}
        {colores.length > 0 && (
          <div className="mt-3 flex items-center gap-2">
            {colores.slice(0, 5).map((color, index) => (
              <button
                key={color.idColor}
                className={cn(
                  'h-5 w-5 rounded-full border-2 transition-all',
                  selectedColorIndex === index
                    ? 'border-accent ring-2 ring-accent/30'
                    : 'border-border hover:border-muted-foreground'
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
            {colores.length > 5 && (
              <span className="font-mono text-xs text-muted-foreground">+{colores.length - 5}</span>
            )}
          </div>
        )}

        {/* Sizes */}
        {tallas.length > 0 && (
          <div className="mt-2 flex flex-wrap items-center gap-1">
            {tallas.map((talla) => (
              <span
                key={talla}
                className="rounded border border-border px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground"
              >
                {talla}
              </span>
            ))}
          </div>
        )}

        {/* Price */}
        <div className="mt-auto flex items-baseline justify-between pt-4">
          <span className="font-mono text-lg font-semibold text-foreground">
            {formatPrice(product.precioBase)}
          </span>
          {hasDiscount && (
            <span className="text-xs text-accent">Descuentos por volumen</span>
          )}
        </div>
      </div>
    </div>
  );
}
