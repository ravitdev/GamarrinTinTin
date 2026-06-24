'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  FileText, 
  ArrowRight, 
  ChevronLeft, 
  AlertTriangle, 
  Sparkles, 
  Package,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { QuotationService } from '../services/quotation.service';
import { ProductService } from '@/features/product/services/product.service';
import type { Producto, ProductoVariante } from '@/lib/types';
import { formatPrice } from '@/lib/mock-data';

interface CustomizationSummary {
  producto: {
    idProducto: number;
    nombre: string;
  };
  color: {
    nombre: string;
    codigoHex: string;
  };
  talla: string | null;
  cantidad: number;
  designs: Array<{
    id: string;
    tipo: 'SUBIDO' | 'PREDEFINIDO';
    idDisenoPredefinido: number | null;
    nombre: string;
    preview: string | null;
    posicion: 'pecho' | 'espalda';
    x: number;
    y: number;
    scale: number;
    rotation: number;
  }>;
}

export function SolicitarCotizacionScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { isLoggedIn, isHydrating } = useAuth();
  // Query params
  const queryProductId = searchParams.get('producto') || '';
  const queryColor = searchParams.get('color') || 'Blanco';
  const queryTalla = searchParams.get('talla') || 'M';
  const queryCantidad = parseInt(searchParams.get('cantidad') || '1', 10);
  const queryPersonalizacion = searchParams.get('personalizacion') === 'true';
  const queryDisenos = parseInt(searchParams.get('disenos') || '0', 10);
  const queryCustomizationId = searchParams.get('customizationId') || '';

  const [product, setProduct] = useState<Producto | null>(null);
  const [isLoadingProduct, setIsLoadingProduct] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customizationSummary, setCustomizationSummary] =
  useState<CustomizationSummary | null>(null);

  // Form state
  const [razon, setRazon] = useState<'PERSONALIZACION' | 'STOCK_INSUFICIENTE'>(
    queryPersonalizacion ? 'PERSONALIZACION' : 'STOCK_INSUFICIENTE'
  );
  const [quantity, setQuantity] = useState(
    Number.isInteger(queryCantidad) && queryCantidad > 0 ? queryCantidad : 1,
  );

  // Enforce authentication
  useEffect(() => {
    if (!isHydrating && !isLoggedIn) {
      toast({
        title: 'Inicio de sesión requerido',
        description: 'Debes iniciar sesión para solicitar una cotización.',
        variant: 'destructive',
      });
      // Redirect to login with callback
      const callbackUrl = encodeURIComponent(
        window.location.pathname + window.location.search
      );
      router.push(`/login?callback=${callbackUrl}`);
    }
  }, [isLoggedIn, isHydrating, router, toast]);

  // Load product info
  useEffect(() => {
    const prodId = parseInt(queryProductId, 10);
    if (!isNaN(prodId)) {
      ProductService.getProductDetail(prodId)
        .then(setProduct)
        .catch(() => {
          toast({
            title: 'Error',
            description: 'No se pudo cargar la información del producto.',
            variant: 'destructive',
          });
        })
        .finally(() => setIsLoadingProduct(false));
    } else {
      setIsLoadingProduct(false);
    }
  }, [queryProductId, toast]);

  useEffect(() => {
    if (!queryCustomizationId || typeof window === 'undefined') return;

    const raw = window.sessionStorage.getItem(
      `gtt_customization_${queryCustomizationId}`,
    );

    if (!raw) return;

    try {
      setCustomizationSummary(JSON.parse(raw) as CustomizationSummary);
    } catch {
      setCustomizationSummary(null);
    }
  }, [queryCustomizationId]);

  if (isHydrating || !isLoggedIn) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-center text-muted-foreground">Verificando sesión...</div>
      </div>
    );
  }

  if (isLoadingProduct) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-center text-muted-foreground">Cargando detalles del producto...</div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="mx-auto max-w-md text-center py-12">
        <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
        <h2 className="text-2xl font-bold">Producto no encontrado</h2>
        <p className="text-muted-foreground mt-2">La solicitud de cotización no tiene un producto válido asociado.</p>
        <Link href="/catalogo" className="mt-4 inline-block">
          <Button>Volver al Catálogo</Button>
        </Link>
      </div>
    );
  }

  const colorHex = product.colores?.find(c => c.nombre.toLowerCase() === queryColor.toLowerCase())?.codigoHex || '#FFFFFF';

  const selectedVariant = (product.variantes ?? []).find(
    (variante: ProductoVariante) =>
      variante.colorNombre.toLowerCase() === queryColor.toLowerCase() &&
      variante.talla === queryTalla,
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedVariant?.idProductoVariante) {
      toast({
        title: 'Variante no disponible',
        description:
          'No se encontró la combinación de color y talla seleccionada para solicitar la cotización.',
        variant: 'destructive',
      });
      return;
    }

    if (!Number.isInteger(quantity) || quantity <= 0) {
      toast({
        title: 'Cantidad inválida',
        description: 'Debe ingresar una cantidad válida.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const personalizationDesigns = customizationSummary?.designs ?? [];

      const imagenesPersonalizacion = personalizationDesigns
        .filter((design) => Boolean(design.preview))
        .map((design, index) => ({
          idDisenoPredefinido: design.idDisenoPredefinido ?? null,
          urlImagen: design.preview as string,
          lado: design.posicion === 'pecho' ? 'FRONT' as const : 'BACK' as const,
          xPosicion: design.x,
          yPosicion: design.y,
          anchoPorcentaje: Math.min(Math.max(design.scale * 30, 1), 100),
          altoPorcentaje: Math.min(Math.max(design.scale * 30, 1), 100),
          displayOrder: index,
        }));

      await QuotationService.submitQuotationRequest({
        idProductoVariante: selectedVariant.idProductoVariante,
        cantidad: quantity,
        razon,
        ...(imagenesPersonalizacion.length > 0
          ? {
              personalizacion: {
                imagenes: imagenesPersonalizacion,
              },
            }
          : {}),
      });

      toast({
        title: 'Solicitud enviada correctamente',
        description:
          'Tu solicitud fue enviada correctamente y está pendiente de revisión por un vendedor.',
      });
      router.push('/mis-cotizaciones');
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'No se pudo enviar la solicitud de cotización.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Breadcrumb */}
      <Link 
        href={`/producto/${product.idProducto}`} 
        className="mb-6 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground w-fit"
      >
        <ChevronLeft className="h-4 w-4" />
        Volver al Producto
      </Link>

      <div className="mb-8">
        <h1 className="font-serif text-3xl font-semibold text-foreground">
          Solicitar Cotización
        </h1>
        <p className="mt-2 text-muted-foreground">
          Completa el formulario para obtener un precio adaptado a tu pedido de volumen o personalización.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left Form */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Reason and comments */}
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
              <h3 className="font-medium text-foreground flex items-center gap-2 border-b border-border pb-3">
                <FileText className="h-5 w-5 text-accent" />
                Detalles de la Solicitud
              </h3>

              <div className="space-y-2">
                <Label htmlFor="razon">Motivo de la Cotización</Label>
                <Select 
                  value={razon} 
                  onValueChange={(v) => setRazon(v as 'PERSONALIZACION' | 'STOCK_INSUFICIENTE')}
                >
                  <SelectTrigger id="razon">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PERSONALIZACION">Prenda Personalizada / Diseño Propio</SelectItem>
                    <SelectItem value="STOCK_INSUFICIENTE">Pedido por Mayor / Falta de Stock</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cantidad">Cantidad solicitada</Label>
                <Input
                  id="cantidad"
                  type="number"
                  min={1}
                  step={1}
                  value={quantity}
                  onChange={(e) => {
                    const value = Number(e.target.value);
                    setQuantity(Number.isNaN(value) ? 0 : value);
                  }}
                />
              </div>

            </div>

            {customizationSummary && customizationSummary.designs.length > 0 && (
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
              <h3 className="font-medium text-foreground flex items-center gap-2 border-b border-border pb-3">
                <Sparkles className="h-5 w-5 text-accent" />
                Resumen de Personalización
              </h3>

              <div className="grid gap-3 sm:grid-cols-2">
                {customizationSummary.designs.map((design) => (
                  <div
                    key={design.id}
                    className="rounded-lg border border-border bg-muted p-3"
                  >
                    <div className="flex items-center gap-3">
                      {design.preview ? (
                        <img
                          src={design.preview}
                          alt={design.nombre}
                          className="h-12 w-12 rounded object-contain bg-card"
                        />
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded bg-card">
                          <Sparkles className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}

                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {design.nombre}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {design.tipo === 'PREDEFINIDO'
                            ? 'Diseño predefinido'
                            : 'Imagen subida por cliente'}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                      <span>Lado: {design.posicion}</span>
                      <span>Tamaño: {Math.round(design.scale * 100)}%</span>
                      <span>X: {Math.round(design.x)}%</span>
                      <span>Y: {Math.round(design.y)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

            <Button
              type="submit"
              className="w-full gap-2 bg-accent text-accent-foreground hover:bg-accent/90 py-6 text-lg rounded-xl"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Enviando Solicitud...' : 'Enviar Solicitud de Cotización'}
              <ArrowRight className="h-5 w-5" />
            </Button>
          </form>
        </div>

        {/* Right Product Summary */}
        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-card p-6 sticky top-24 shadow-sm space-y-4">
            <h3 className="font-semibold text-lg border-b border-border pb-3 flex items-center gap-2">
              <Package className="h-5 w-5 text-accent" />
              Resumen del Item
            </h3>

            <div className="space-y-4">
              <div className="flex gap-4">
                <div 
                  className="h-16 w-16 shrink-0 rounded-lg border border-border flex items-center justify-center shadow-inner"
                  style={{ 
                    backgroundColor: colorHex === '#FFFFFF' ? '#f5f5f5' : colorHex 
                  }}
                >
                  <Package className="w-8 h-8 text-white/55" />
                </div>
                <div>
                  <h4 className="font-medium text-foreground">{product.nombre}</h4>
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">{product.descripcion}</p>
                </div>
              </div>

              <Separator />

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Color seleccionado:</span>
                  <span className="font-medium">{queryColor}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Talla:</span>
                  <span className="font-medium">{queryTalla}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cantidad:</span>
                  <Badge variant="secondary">{quantity} unidades</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Personalización:</span>
                  <span className="font-medium flex items-center gap-1">
                    {queryPersonalizacion ? (
                      <>
                        <Sparkles className="h-3.5 w-3.5 text-accent" />
                        Sí ({queryDisenos} diseños)
                      </>
                    ) : 'No'}
                  </span>
                </div>
                <div className="flex justify-between border-t border-dashed border-border pt-2 text-base font-semibold">
                  <span>Precio Base Total:</span>
                  <span>{formatPrice(product.precioBase * quantity)}</span>
                </div>
              </div>

              {queryPersonalizacion && (
                <div className="rounded-lg bg-accent/5 border border-accent/15 p-3 flex gap-2">
                  <AlertTriangle className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                  <p className="text-xs text-muted-foreground">
                    Los estampados y colores de personalización adjuntos serán enviados al diseñador para calcular el precio definitivo.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
