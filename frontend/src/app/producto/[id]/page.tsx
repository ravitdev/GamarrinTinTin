'use client';

import { useState, useMemo, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  ChevronLeft, 
  Minus, 
  Plus, 
  ShoppingCart, 
  FileText,
  Sparkles,
  Truck,
  RotateCcw,
  Check,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { formatPrice } from '@/lib/mock-data';
import { ProductService } from '@/features/product/services/product.service';
import type { ProductSize, PredefinedDesign } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useCart } from '@/features/cart/hooks/use-cart';
import { toast } from '@/hooks/use-toast';
import { DisenoPredefinidoService } from '@/features/disenos/services/diseno-predefinido.service';


export default function ProductDetailPage() {
  const params = useParams();
  const productId = parseInt(params.id as string, 10);
  
  const { cart, addToCart } = useCart();
  const [isAdding, setIsAdding] = useState(false);
  const [product, setProduct] = useState<any | null>(null);
  const [predefinedDesigns, setPredefinedDesigns] = useState<PredefinedDesign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    async function cargarDetalle() {
      try {
        setIsLoading(true);

        const [productoDetalle, disenos] = await Promise.all([
          ProductService.getProductDetail(productId),
          DisenoPredefinidoService.listarActivos(),
        ]);

        setProduct(productoDetalle);

        setPredefinedDesigns(
          disenos.map((diseno) => ({
            id: diseno.idDisenoPredefinido ?? diseno.idDiseno ?? 0,
            idDisenoPredefinido: diseno.idDisenoPredefinido,
            nombre: diseno.nombre,
            imagen: diseno.urlImagen ?? diseno.imagen ?? '',
            urlImagen: diseno.urlImagen,
          })) as PredefinedDesign[],
        );
      } catch (err: any) {
        setError(err.message || 'No se pudo cargar el producto.');
      } finally {
        setIsLoading(false);
      }
    }

    cargarDetalle();
  }, [productId]);
  
  const [selectedColorIndex, setSelectedColorIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState<ProductSize | null>(null);
  const [selectedPechoDesign, setSelectedPechoDesign] = useState<PredefinedDesign | null>(null);
  const [selectedEspaldaDesign, setSelectedEspaldaDesign] = useState<PredefinedDesign | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [viewingSide, setViewingSide] = useState<'frente' | 'espalda'>('frente');

  const discountPercentage = useMemo(() => {
    if (!product || !product.descuentosVolumen) return 0;
    const aplicable = product.descuentosVolumen
      .filter((d: any) => quantity >= d.cantidadMinima)
      .sort((a: any, b: any) => b.cantidadMinima - a.cantidadMinima);
    return aplicable[0]?.porcentajeDescuento ?? 0;
  }, [quantity, product]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex flex-1 items-center justify-center">
          <div className="text-center text-muted-foreground">Cargando producto...</div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!product || error) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-semibold text-foreground">Producto no encontrado</h1>
            <Link href="/catalogo" className="mt-4 text-accent hover:underline">
              Volver al catalogo
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const selectedColor = product.colores?.[selectedColorIndex] ?? {nombre: 'Blanco', codigoHex: '#FFFFFF', hexCode: '#FFFFFF', urlImagen: '/placeholder.svg',};
  const selectedVariant = product.variantes?.find(
    (v: any) =>
      v.colorHex.toUpperCase() === selectedColor.codigoHex.toUpperCase() &&
      v.talla === selectedSize
  );
  const currentStock = selectedVariant ? selectedVariant.stock : 0;
  const isOutOfStock = selectedSize && currentStock < quantity;
  const canAddToCart =
    !product.esPersonalizable &&
    selectedSize &&
    currentStock >= quantity &&
    quantity > 0;
  const shouldQuote = isOutOfStock || product.esPersonalizable;

  const isPersonalizable = Boolean(product.esPersonalizable);
  const hasPredefinedDesigns = predefinedDesigns.length > 0;
  const canCustomize = isPersonalizable;

  // discountPercentage calculated above

  const unitPrice = product.precio * (1 - discountPercentage / 100);
  const totalPrice = unitPrice * quantity;

  const pechoDesigns = predefinedDesigns;
  const espaldaDesigns = predefinedDesigns;

  const handleAddToCart = async () => {
    if (!selectedSize || !selectedColor || !selectedVariant) return;
    setIsAdding(true);
    try {
      await addToCart({
        productId: String(product.idProducto),
        productName: product.nombre,
        colorId: selectedColor.nombre,
        colorHex: selectedColor.codigoHex,
        size: selectedSize,
        quantity,
        price: product.precioBase,
        imageUrl: selectedColor.urlImagen,
        idProductoVariante: selectedVariant.idProductoVariante,
        descuentosVolumen: product.descuentosVolumen || [],
      });
      toast({
        title: "¡Agregado!",
        description: `${product.nombre} se agregó al carrito.`,
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "No se pudo agregar al carrito",
        variant: "destructive",
      });
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header cartItemCount={cart?.items?.length || 0} />

      <main className="flex-1 py-8">
        <div className="container mx-auto px-4">
          {/* Breadcrumb */}
          <nav className="mb-6 flex items-center gap-2 text-sm">
            <Link href="/catalogo" className="flex items-center gap-1 text-muted-foreground hover:text-foreground">
              <ChevronLeft className="h-4 w-4" />
              Catalogo
            </Link>
            <span className="text-muted-foreground">/</span>
            <span className="text-foreground">{product.nombre}</span>
          </nav>

          <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
            {/* Product Images */}
            <div className="space-y-4">
              {/* Main Image */}
              <div className="relative aspect-square overflow-hidden rounded-2xl border border-border bg-secondary">
                <div className="flex h-full w-full flex-col items-center justify-center p-8">
                  <div 
                    className="h-64 w-48 rounded-xl border-2 border-dashed border-border transition-colors"
                    style={{ 
                      backgroundColor: selectedColor.hexCode === '#FFFFFF' ? '#f5f5f5' : selectedColor.hexCode 
                    }}
                  >
                    <div className="flex h-full flex-col items-center justify-center p-4">
                      <span className="text-xs text-muted-foreground uppercase">
                        Vista {viewingSide}
                      </span>
                      {viewingSide === 'frente' && selectedPechoDesign && (
                        <div className="mt-2 rounded bg-card/80 px-2 py-1 text-xs">
                          {selectedPechoDesign.nombre}
                        </div>
                      )}
                      {viewingSide === 'espalda' && selectedEspaldaDesign && (
                        <div className="mt-2 rounded bg-card/80 px-2 py-1 text-xs">
                          {selectedEspaldaDesign.nombre}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Badges */}
                <div className="absolute left-4 top-4 flex flex-col gap-2">
                  {isPersonalizable ? (
                    <Badge className="bg-accent text-accent-foreground">
                      <Sparkles className="mr-1 h-3 w-3" />
                      Personalizable
                    </Badge>
                  ) : (
                    <Badge variant="secondary">
                      Diseño predefinido
                    </Badge>
                  )}
                </div>
              </div>

              {/* View Toggle */}
              <div className="flex gap-2">
                <button
                  onClick={() => setViewingSide('frente')}
                  className={cn(
                    'flex-1 rounded-lg border p-3 text-center transition-colors',
                    viewingSide === 'frente'
                      ? 'border-accent bg-accent/10 text-foreground'
                      : 'border-border bg-card text-muted-foreground hover:border-accent/50'
                  )}
                >
                  <span className="text-sm font-medium">Vista Frontal</span>
                </button>
                <button
                  onClick={() => setViewingSide('espalda')}
                  className={cn(
                    'flex-1 rounded-lg border p-3 text-center transition-colors',
                    viewingSide === 'espalda'
                      ? 'border-accent bg-accent/10 text-foreground'
                      : 'border-border bg-card text-muted-foreground hover:border-accent/50'
                  )}
                >
                  <span className="text-sm font-medium">Vista Posterior</span>
                </button>
              </div>

              {/* Color Thumbnails */}
              <div className="flex gap-3">
                {product.colores.map((color: any, index: number) => (
                  <button
                    key={color.idColor || color.id || index}
                    onClick={() => {
                      setSelectedColorIndex(index);
                      setSelectedSize(null);
                      setQuantity(1);
                    }}
                    className={cn(
                      'h-16 w-16 rounded-lg border-2 transition-all',
                      selectedColorIndex === index
                        ? 'border-accent ring-2 ring-accent/30'
                        : 'border-border hover:border-muted-foreground'
                    )}
                    style={{ 
                      backgroundColor: color.hexCode,
                      boxShadow: color.hexCode === '#FFFFFF' ? 'inset 0 0 0 1px rgba(0,0,0,0.1)' : 'none'
                    }}
                    title={color.nombre}
                  >
                    <span className="sr-only">{color.nombre}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Product Info */}
            <div className="space-y-6">
              {/* Header */}
              <div>
                <span className="text-sm font-medium uppercase tracking-wider text-accent">
                  {product.codigo}
                </span>
                <h1 className="mt-1 font-serif text-3xl font-semibold text-foreground">
                  {product.nombre}
                </h1>
                <p className="mt-3 text-muted-foreground leading-relaxed">
                  {product.descripcion}
                </p>
                <div className="mt-4 rounded-xl border border-border bg-muted/30 p-4">
                  <div className="flex items-start gap-3">
                    {isPersonalizable ? (
                      <Sparkles className="mt-0.5 h-5 w-5 text-accent" />
                    ) : (
                      <Check className="mt-0.5 h-5 w-5 text-accent" />
                    )}

                    <div>
                      <p className="font-medium text-foreground">
                        {isPersonalizable ? "Producto personalizable" : "Producto con diseño predefinido"}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {isPersonalizable
                          ? "Puedes iniciar una personalización o solicitar una cotización según tu diseño."
                          : "Puedes elegir color, talla y cantidad para agregarlo directamente al carrito si hay stock disponible."}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Price */}
              <div className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl font-semibold text-foreground">
                    {formatPrice(unitPrice)}
                  </span>
                  {discountPercentage > 0 && (
                    <>
                      <span className="text-lg text-muted-foreground line-through">
                        {formatPrice(product.precio)}
                      </span>
                      <Badge className="bg-accent text-accent-foreground">
                        -{discountPercentage}%
                      </Badge>
                    </>
                  )}
                </div>
                {product.descuentosVolumen.length > 0 && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    Descuentos por volumen disponibles desde 10 unidades
                  </p>
                )}
              </div>

              {/* Color Selection */}
              <div>
                <label className="mb-3 block text-sm font-medium text-foreground">
                  Color: <span className="font-normal text-muted-foreground">{selectedColor.nombre}</span>
                </label>
                <div className="flex gap-3">
                  {product.colores.map((color: any, index: number) => (
                    <button
                      key={color.idColor || color.id || index}
                      onClick={() => {
                        setSelectedColorIndex(index);
                        setSelectedSize(null);
                        setQuantity(1);
                      }}
                      className={cn(
                        'h-10 w-10 rounded-full border-2 transition-all',
                        selectedColorIndex === index
                          ? 'border-accent ring-2 ring-accent/30'
                          : 'border-border hover:border-muted-foreground'
                      )}
                      style={{ 
                        backgroundColor: color.hexCode,
                        boxShadow: color.hexCode === '#FFFFFF' ? 'inset 0 0 0 1px rgba(0,0,0,0.1)' : 'none'
                      }}
                      title={color.nombre}
                    >
                      <span className="sr-only">{color.nombre}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Size Selection */}
              <div>
                <label className="mb-3 block text-sm font-medium text-foreground">
                  Talla {selectedSize && <span className="font-normal text-muted-foreground">({selectedSize} seleccionada)</span>}
                </label>
                <div className="flex gap-3">
                  {product.tallas.map((size: any) => {
                    const sizeStock = product.variantes?.find(
                                                              (v: any) =>
                                                                v.colorHex.toUpperCase() === selectedColor.codigoHex.toUpperCase() &&
                                                                v.talla === size,
                                                            )?.stock ?? 0;
                    return (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        disabled={sizeStock === 0}
                        className={cn(
                          'flex h-12 w-12 items-center justify-center rounded-lg border text-sm font-medium transition-colors',
                          selectedSize === size
                            ? 'border-accent bg-accent text-accent-foreground'
                            : sizeStock === 0
                              ? 'cursor-not-allowed border-border bg-muted text-muted-foreground opacity-50'
                              : 'border-border bg-card hover:border-accent/50'
                        )}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
                {selectedSize && currentStock > 0 && currentStock <= 10 && (
                  <p className="mt-2 flex items-center gap-1 text-sm text-accent">
                    <AlertCircle className="h-4 w-4" />
                    Solo quedan {currentStock} unidades disponibles
                  </p>
                )}
              </div>

              {/* Design Selection (if available) */}
              {hasPredefinedDesigns && (
                <div className="space-y-4">
                  {pechoDesigns.length > 0 && (
                    <div>
                      <label className="mb-3 block text-sm font-medium text-foreground">
                        Diseno para Pecho
                      </label>
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => setSelectedPechoDesign(null)}
                          className={cn(
                            'rounded-lg border px-3 py-2 text-sm transition-colors',
                            !selectedPechoDesign
                              ? 'border-accent bg-accent/10 text-foreground'
                              : 'border-border bg-card text-muted-foreground hover:border-accent/50'
                          )}
                        >
                          Sin diseno
                        </button>
                        {pechoDesigns.map((design: any) => (
                          <button
                            key={design.idDisenoPredefinido ?? design.id}
                            onClick={() => setSelectedPechoDesign(design)}
                            className={cn(
                              'rounded-lg border px-3 py-2 text-sm transition-colors',
                              (selectedPechoDesign as any)?.id === (design as any).id
                                ? 'border-accent bg-accent/10 text-foreground'
                                : 'border-border bg-card text-muted-foreground hover:border-accent/50'
                            )}
                          >
                            {design.nombre}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {espaldaDesigns.length > 0 && (
                    <div>
                      <label className="mb-3 block text-sm font-medium text-foreground">
                        Diseno para Espalda
                      </label>
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => setSelectedEspaldaDesign(null)}
                          className={cn(
                            'rounded-lg border px-3 py-2 text-sm transition-colors',
                            !selectedEspaldaDesign
                              ? 'border-accent bg-accent/10 text-foreground'
                              : 'border-border bg-card text-muted-foreground hover:border-accent/50'
                          )}
                        >
                          Sin diseno
                        </button>
                        {espaldaDesigns.map((design: any) => (
                          <button
                            key={design.id}
                            onClick={() => setSelectedEspaldaDesign(design)}
                            className={cn(
                              'rounded-lg border px-3 py-2 text-sm transition-colors',
                              selectedEspaldaDesign?.id === design.id
                                ? 'border-accent bg-accent/10 text-foreground'
                                : 'border-border bg-card text-muted-foreground hover:border-accent/50'
                            )}
                          >
                            {design.nombre}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {canCustomize && (
                    <Link href={`/personalizar/${product.idProducto}`}>
                      <Button variant="outline" className="w-full gap-2">
                        <Sparkles className="h-4 w-4" />
                        Subir Mi Propio Diseno
                      </Button>
                    </Link>
                  )}
                </div>
              )}

              {/* Quantity */}
              <div>
                <label className="mb-3 block text-sm font-medium text-foreground">
                  Cantidad
                </label>
                <div className="flex items-center gap-4">
                  <div className="flex items-center rounded-lg border border-border">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="flex h-10 w-10 items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <input
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="h-10 w-16 border-x border-border bg-transparent text-center text-sm focus:outline-none"
                    />
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="flex h-10 w-10 items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    Total: <span className="font-semibold text-foreground">{formatPrice(totalPrice)}</span>
                  </span>
                </div>
              </div>

              {/* Volume Discounts Info */}
              {product.descuentosVolumen.length > 0 && (
                <div className="rounded-xl border border-border bg-muted/30 p-4">
                  <h3 className="text-sm font-medium text-foreground mb-3">Descuentos por Volumen</h3>
                  <div className="space-y-2">
                    {product.descuentosVolumen.map((descuento: any, index: number) => (
                      <div 
                        key={descuento.idDescuentoVolumen || descuento.idDescuento || index}
                        className={cn(
                          'flex items-center justify-between text-sm',
                          quantity >= descuento.cantidadMinima && 'text-accent font-medium'
                        )}
                      >
                        <span>Desde {descuento.cantidadMinima} unidades</span>
                        <span className="flex items-center gap-1">
                          -{descuento.porcentajeDescuento}%
                          {quantity >= descuento.cantidadMinima && <Check className="h-4 w-4" />}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col gap-3 pt-2">
                {canCustomize && (
                  <Link href={`/personalizar/${product.idProducto}`}>
                    <Button size="lg" className="w-full gap-2 bg-accent text-accent-foreground hover:bg-accent/90">
                      <Sparkles className="h-5 w-5" />
                      Personalizar Producto
                    </Button>
                  </Link>
                )}

                {!canCustomize && (
                  canAddToCart ? (
                    <Button
                      size="lg"
                      className="w-full gap-2 bg-accent text-accent-foreground hover:bg-accent/90 cursor-pointer"
                      onClick={handleAddToCart}
                      disabled={isAdding}
                    >
                      <ShoppingCart className="h-5 w-5" />
                      {isAdding ? 'Agregando...' : 'Agregar al Carrito'}
                    </Button>
                  ) : !selectedSize ? (
                    <Button size="lg" className="w-full" disabled>
                      Selecciona una talla
                    </Button>
                  ) : (
                    <Button size="lg" className="w-full" disabled>
                      Stock Insuficiente
                    </Button>
                  )
                )}

                {(shouldQuote || (!canAddToCart && selectedSize)) && (
                  <Link
                    href={`/solicitar-cotizacion?producto=${product.idProducto}&color=${encodeURIComponent(selectedColor.nombre)}&talla=${selectedSize}&cantidad=${quantity}`}
                  >
                    <Button size="lg" variant="outline" className="w-full gap-2">
                      <FileText className="h-5 w-5" />
                      Solicitar Cotización
                    </Button>
                  </Link>
                )}
                {selectedSize && currentStock > 0 && currentStock <= quantity && (
                  <p className="mt-2 flex items-center gap-1 text-sm text-accent">
                    <AlertCircle className="h-4 w-4" />
                    Solo quedan {currentStock} unidades disponibles
                  </p>
                )}
                {isOutOfStock && selectedSize && (
                  <p className="text-center text-sm text-muted-foreground">
                    Stock insuficiente. Puedes solicitar una cotizacion para esta cantidad.
                  </p>
                )}
              </div>

              {/* Benefits */}
              <div className="grid grid-cols-2 gap-4 border-t border-border pt-6">
                <div className="flex items-start gap-3">
                  <Truck className="h-5 w-5 text-accent shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Envio a Lima</p>
                    <p className="text-xs text-muted-foreground">3-5 dias habiles</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <RotateCcw className="h-5 w-5 text-accent shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Cambios y Devoluciones</p>
                    <p className="text-xs text-muted-foreground">Hasta 7 dias</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Info */}
          <div className="mt-12">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="description">
                <AccordionTrigger>Descripcion del Producto</AccordionTrigger>
                <AccordionContent>
                  <p className="text-muted-foreground leading-relaxed">
                    {product.descripcion}
                  </p>
                  <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                    <li>Material: Algodon pima peruano de alta calidad</li>
                    <li>Acabado: Costuras reforzadas</li>
                    <li>Cuidados: Lavar a maquina con agua fria</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="shipping">
                <AccordionTrigger>Informacion de Envio</AccordionTrigger>
                <AccordionContent>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>Envios a Lima Metropolitana: 3-5 dias habiles</li>
                    <li>Recojo en tienda disponible</li>
                    <li>Envios a provincia bajo consulta</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="returns">
                <AccordionTrigger>Politica de Cambios</AccordionTrigger>
                <AccordionContent>
                  <p className="text-muted-foreground leading-relaxed">
                    Aceptamos cambios hasta 7 dias despues de la entrega. Los productos 
                    personalizados no aplican para devolucion, solo para cambio por defectos 
                    de fabricacion.
                  </p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
