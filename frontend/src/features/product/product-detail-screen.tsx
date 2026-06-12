'use client';

import { useState } from 'react';
import { Heart, ShoppingCart, Share2, ChevronDown, Plus, Minus } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ProductDetailScreenProps {
  productId: string;
}

export function ProductDetailScreen({ productId }: ProductDetailScreenProps) {
  const [quantity, setQuantity] = useState(1);
  const [selectedColor, setSelectedColor] = useState('blanco');
  const [selectedSize, setSelectedSize] = useState('M');

  // Mock product data - en producción vendría del service
  const product = {
    id: productId,
    name: 'Polo Clásico Algodón Premium',
    sku: 'POLO-001-ALG',
    price: 42.75,
    originalPrice: 55.00,
    rating: 4.5,
    reviews: 128,
    stock: 250,
    description: 'Polo clásico confeccionado en 100% algodón de alta calidad. Perfecto para uso casual y profesional.',
    colors: ['blanco', 'negro', 'azul', 'rojo', 'gris'],
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    images: ['/placeholder.svg?height=500&width=500'],
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="mb-6 text-sm text-muted-foreground">
        <Link href="/catalogo" className="hover:text-foreground">Catálogo</Link>
        <span className="mx-2">/</span>
        <span>{product.name}</span>
      </nav>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Images */}
        <div>
          <div className="rounded-lg border border-border bg-muted aspect-square mb-4 flex items-center justify-center">
            <img
              src={product.images[0]}
              alt={product.name}
              className="h-full w-full object-cover"
            />
          </div>
          <div className="grid grid-cols-4 gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="rounded border border-border bg-muted aspect-square flex items-center justify-center cursor-pointer hover:border-accent"
              >
                <img
                  src={`/placeholder.svg?height=100&width=100`}
                  alt={`View ${i}`}
                  className="h-full w-full object-cover"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Details */}
        <div>
          <div className="mb-4">
            <h1 className="font-serif text-3xl font-semibold mb-2">{product.name}</h1>
            <p className="text-sm text-muted-foreground">SKU: {product.sku}</p>
          </div>

          {/* Rating */}
          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-border">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <span key={i} className={`text-lg ${i < 4 ? 'text-amber-400' : 'text-muted-foreground'}`}>
                  ★
                </span>
              ))}
            </div>
            <span className="text-sm text-muted-foreground">({product.reviews} opiniones)</span>
          </div>

          {/* Price */}
          <div className="mb-6">
            <div className="flex items-baseline gap-3 mb-2">
              <span className="text-3xl font-bold text-accent">S/ {product.price.toFixed(2)}</span>
              <span className="text-lg text-muted-foreground line-through">S/ {product.originalPrice.toFixed(2)}</span>
              <Badge className="bg-red-500">-22%</Badge>
            </div>
            <p className="text-sm text-green-600">En stock: {product.stock} unidades</p>
          </div>

          {/* Options */}
          <div className="space-y-6 mb-6">
            {/* Color */}
            <div>
              <label className="block text-sm font-medium mb-3">Color:</label>
              <div className="flex gap-3">
                {product.colors.map((color) => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`h-10 w-10 rounded-full border-2 transition capitalize ${
                      selectedColor === color
                        ? 'border-accent'
                        : 'border-border hover:border-accent/50'
                    } bg-${color === 'blanco' ? 'white' : color === 'negro' ? 'black' : 'gray-400'}`}
                    title={color}
                  />
                ))}
              </div>
            </div>

            {/* Size */}
            <div>
              <label className="block text-sm font-medium mb-3">Talla:</label>
              <div className="grid grid-cols-3 gap-2">
                {product.sizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`py-2 px-3 rounded border transition text-sm font-medium ${
                      selectedSize === size
                        ? 'bg-accent text-accent-foreground border-accent'
                        : 'border-border hover:border-accent/50'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-sm font-medium mb-3">Cantidad:</label>
              <div className="flex items-center gap-3 border border-border rounded w-fit">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-2 hover:bg-muted"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-8 text-center font-medium">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="p-2 hover:bg-muted"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mb-6">
            <Button className="flex-1 gap-2 bg-accent text-accent-foreground hover:bg-accent/90">
              <ShoppingCart className="h-4 w-4" />
              Agregar al carrito
            </Button>
            <Button variant="outline" size="icon">
              <Heart className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon">
              <Share2 className="h-4 w-4" />
            </Button>
          </div>

          {/* Description */}
          <div className="rounded-lg border border-border bg-muted/50 p-4">
            <h3 className="font-medium mb-2">Descripción</h3>
            <p className="text-sm text-muted-foreground">{product.description}</p>
          </div>
        </div>
      </div>

      {/* Related Products */}
      <div className="mt-16">
        <h2 className="font-serif text-2xl font-semibold mb-6">Productos relacionados</h2>
        <div className="grid gap-6 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Link key={i} href={`/producto/${i}`}>
              <div className="rounded-lg border border-border bg-card overflow-hidden hover:border-accent/50 transition">
                <div className="aspect-square bg-muted" />
                <div className="p-4">
                  <p className="font-medium text-foreground mb-1">Producto relacionado</p>
                  <p className="text-sm text-muted-foreground mb-3">SKU-00{i}</p>
                  <p className="font-semibold text-accent">S/ {(42.75 + i * 5).toFixed(2)}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
