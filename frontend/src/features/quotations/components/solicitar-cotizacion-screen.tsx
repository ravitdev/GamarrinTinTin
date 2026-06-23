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
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Building2,
  Clock
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
import type { Producto } from '@/lib/types';
import { formatPrice } from '@/lib/mock-data';

export function SolicitarCotizacionScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { user, isLoggedIn, isHydrating } = useAuth();

  // Query params
  const queryProductId = searchParams.get('producto') || '';
  const queryColor = searchParams.get('color') || 'Blanco';
  const queryTalla = searchParams.get('talla') || 'M';
  const queryCantidad = parseInt(searchParams.get('cantidad') || '1', 10);
  const queryPersonalizacion = searchParams.get('personalizacion') === 'true';
  const queryDisenos = parseInt(searchParams.get('disenos') || '0', 10);

  const [product, setProduct] = useState<Producto | null>(null);
  const [isLoadingProduct, setIsLoadingProduct] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [razon, setRazon] = useState<'PERSONALIZACION' | 'STOCK_INSUFICIENTE'>(
    queryPersonalizacion ? 'PERSONALIZACION' : 'STOCK_INSUFICIENTE'
  );

  // Client info state (pre-filled if logged in)
  const [clientInfo, setClientInfo] = useState({
    nombres: '',
    apellidos: '',
    correo: '',
    celular: '',
    tipoDocumento: 'DNI',
    documento: '',
    direccion: '',
  });

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

  // Pre-fill client info when user is loaded
  useEffect(() => {
    if (user) {
      setClientInfo({
        nombres: user.nombres || '',
        apellidos: user.apellidos || '',
        correo: user.email || '',
        celular: user.telefono || '',
        tipoDocumento: user.tipoDocumento || 'DNI',
        documento: user.numeroDocumento || '',
        direccion: user.direccion || '',
      });
    }
  }, [user]);

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

  const varianteSeleccionada = product.variantes?.find(
    (variante) =>
      variante.colorNombre.toLowerCase() === queryColor.toLowerCase() &&
      variante.talla === queryTalla,
  );
  const colorHex = varianteSeleccionada?.colorHex ?? '#FFFFFF';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientInfo.nombres.trim() || !clientInfo.apellidos.trim() || !clientInfo.correo.trim() || !clientInfo.celular.trim() || !clientInfo.documento.trim()) {
      toast({
        title: 'Campos obligatorios',
        description: 'Por favor completa toda la información personal y de contacto.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      if (!varianteSeleccionada) {
        throw new Error(
          'La combinación de color y talla seleccionada no está disponible.',
        );
      }

      await QuotationService.submitQuotationRequest({
        idProductoVariante: varianteSeleccionada.idProductoVariante,
        cantidad: queryCantidad,
        razon,
      });

      toast({
        title: 'Solicitud enviada',
        description: 'Tu cotización ha sido registrada. Nuestro equipo te responderá pronto.',
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
          Solicitar Cotización Especial
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

            </div>

            {/* Client information */}
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
              <h3 className="font-medium text-foreground flex items-center gap-2 border-b border-border pb-3">
                <User className="h-5 w-5 text-accent" />
                Información del Solicitante
              </h3>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="nombres">Nombres *</Label>
                  <Input
                    id="nombres"
                    value={clientInfo.nombres}
                    readOnly
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="apellidos">Apellidos *</Label>
                  <Input
                    id="apellidos"
                    value={clientInfo.apellidos}
                    readOnly
                    required
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="correo">Correo Electrónico *</Label>
                  <Input
                    id="correo"
                    type="email"
                    value={clientInfo.correo}
                    readOnly
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="celular">Número Celular *</Label>
                  <Input
                    id="celular"
                    value={clientInfo.celular}
                    readOnly
                    required
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="tipoDocumento">Tipo Documento</Label>
                  <Select 
                    value={clientInfo.tipoDocumento} 
                    disabled
                  >
                    <SelectTrigger id="tipoDocumento">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DNI">DNI</SelectItem>
                      <SelectItem value="RUC">RUC</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="documento">Número Documento *</Label>
                  <Input
                    id="documento"
                    value={clientInfo.documento}
                    readOnly
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="direccion">Dirección de Envío / Tienda de Recojo</Label>
                <Input
                  id="direccion"
                  placeholder="Ej. Calle Los Lirios 123, Lince (O indicar 'Recojo en tienda')"
                  value={clientInfo.direccion}
                  readOnly
                />
              </div>
            </div>

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
                  <Badge variant="secondary">{queryCantidad} unidades</Badge>
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
                  <span>{formatPrice(product.precioBase * queryCantidad)}</span>
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
