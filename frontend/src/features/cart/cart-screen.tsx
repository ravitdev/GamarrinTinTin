'use client';

import { ShoppingCart, Plus, Minus, Trash2, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/features/cart/hooks/use-cart';

export function CartScreen() {
  const { cart, isLoading, removeItem, updateQuantity, toggleSelection } = useCart();

  // Grouped quantities of selected items for discount calculation
  const productQuantities: Record<string, number> = {};
  if (cart) {
    cart.items.forEach(item => {
      if (item.selected !== false && !item.idCotizacion) {
        productQuantities[item.productId] = (productQuantities[item.productId] || 0) + item.quantity;
      }
    });
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <ShoppingCart className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <p className="text-muted-foreground">Cargando carrito...</p>
        </div>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <ShoppingCart className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <h2 className="font-serif text-2xl font-semibold text-foreground mb-2">Carrito vacío</h2>
          <p className="text-muted-foreground mb-6">No tienes productos en tu carrito.</p>
          <Link href="/catalogo">
            <Button className="gap-2">
              Continuar comprando
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const selectedCount = cart.items.filter(item => item.selected !== false).length;

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8">
      <h1 className="font-serif text-3xl font-semibold mb-8">Mi Carrito</h1>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Items */}
        <div className="lg:col-span-2">
          <div className="space-y-4">
            {cart.items.map((item) => {
              // Calculate volume discount
              let pct = 0;
              if (!item.idCotizacion && item.descuentosVolumen && item.descuentosVolumen.length > 0) {
                const totalQty = productQuantities[item.productId] || 0;
                const aplicable = [...item.descuentosVolumen]
                  .filter((d) => totalQty >= d.cantidadMinima)
                  .sort((a, b) => b.cantidadMinima - a.cantidadMinima);
                pct = aplicable[0]?.porcentajeDescuento ?? 0;
              }
              const finalPrice = item.price * (1 - pct / 100);

              return (
                <div
                  key={item.id}
                  className="flex items-center gap-4 rounded-lg border border-border bg-card p-4 transition-colors"
                >
                  <Checkbox
                    id={`select-${item.id}`}
                    checked={item.selected !== false}
                    onCheckedChange={(checked) => toggleSelection(item.id, checked === true)}
                    className="h-5 w-5 border-2 border-muted-foreground/30 shrink-0"
                  />

                  <div className="h-24 w-24 rounded bg-muted overflow-hidden flex items-center justify-center shrink-0">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.productName} className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-xs text-muted-foreground">Prenda</span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-medium text-foreground truncate">{item.productName}</h3>
                      {item.idCotizacion && (
                        <Badge variant="secondary" className="bg-accent/10 text-accent border border-accent/20">
                          Cotización #{item.idCotizacion}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      Talla: {item.size} | Color: {item.colorId}
                    </p>
                    
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="font-semibold text-accent">
                        S/ {finalPrice.toFixed(2)} c/u
                      </span>
                      {pct > 0 && (
                        <>
                          <span className="text-xs text-muted-foreground line-through">
                            S/ {item.price.toFixed(2)}
                          </span>
                          <span className="text-[10px] bg-green-100 text-green-800 px-1.5 py-0.5 rounded font-medium">
                            -{pct}% vol
                          </span>
                        </>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 font-medium">
                      Subtotal: S/ {(finalPrice * item.quantity).toFixed(2)}
                    </p>
                  </div>

                  <div className="flex flex-col items-end justify-between h-24">
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-muted-foreground hover:text-destructive transition cursor-pointer p-1"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>

                    <div className="flex items-center gap-2 border border-border rounded bg-muted/20">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="p-1 hover:bg-muted"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="px-2 py-1 text-sm font-medium">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="p-1 hover:bg-muted"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Summary */}
        <div className="rounded-lg border border-border bg-card p-6 h-fit">
          <h2 className="font-semibold text-foreground mb-4">Resumen</h2>

          <div className="space-y-3 mb-6 pb-6 border-b border-border">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal ({selectedCount} seleccionados)</span>
              <span>S/ {cart.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Descuento</span>
              <span>-S/ {cart.discountTotal.toFixed(2)}</span>
            </div>
          </div>

          <div className="flex justify-between font-semibold mb-6">
            <span>Total</span>
            <span className="text-lg text-accent">S/ {cart.total.toFixed(2)}</span>
          </div>

          <Link href="/checkout" className="w-full">
            <Button 
              className="w-full gap-2 bg-accent text-accent-foreground hover:bg-accent/90"
              disabled={selectedCount === 0}
            >
              Proceder al Pago
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>

          <Link href="/catalogo">
            <Button variant="outline" className="w-full mt-3">
              Seguir comprando
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
