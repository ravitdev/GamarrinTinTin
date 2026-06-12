'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  FileText, 
  Search,
  Filter,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  ShoppingCart,
  ArrowRight,
  AlertTriangle,
  Eye,
  Package,
  User,
  Mail,
  Phone,
  Building2,
  Palette,
  Ruler,
  MessageSquare,
  X,
  Download
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { formatPrice, getQuotationStatusColor } from '@/lib/mock-data';
import { QuotationService } from '@/features/quotations/services/quotation.service';
import type { Quotation, QuotationStatus } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useCart } from '@/features/cart/hooks/use-cart';
import { useToast } from '@/hooks/use-toast';

const statusIcons: Record<QuotationStatus, React.ReactNode> = {
  pendiente: <Clock className="h-4 w-4" />,
  cotizado: <CheckCircle className="h-4 w-4" />,
  pagado: <CheckCircle className="h-4 w-4" />,
  rechazado: <XCircle className="h-4 w-4" />,
  vencido: <AlertTriangle className="h-4 w-4" />,
};

const statusLabels: Record<QuotationStatus, string> = {
  pendiente: 'Pendiente',
  cotizado: 'Cotizado',
  pagado: 'Pagado',
  rechazado: 'Rechazado',
  vencido: 'Vencido',
};

const statusDescriptions: Record<QuotationStatus, string> = {
  pendiente: 'Tu solicitud esta siendo revisada por nuestro equipo de ventas.',
  cotizado: 'Ya tienes un precio especial. Puedes agregar al carrito antes de que venza.',
  pagado: 'Esta cotizacion ha sido pagada y convertida en pedido.',
  rechazado: 'Esta cotizacion fue rechazada o cancelada.',
  vencido: 'La cotizacion ha expirado. Solicita una nueva si aun la necesitas.',
};

export default function MisCotizacionesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<QuotationStatus | 'all'>('all');
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const { addToCart } = useCart();
  const { toast } = useToast();

  useEffect(() => {
    QuotationService.getMyQuotations()
      .then(setQuotations)
      .finally(() => setIsLoading(false));
  }, []);

  const filteredQuotations = quotations.filter((quotation) => {
    const matchesSearch = 
      quotation.codigo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      quotation.producto.nombre.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || quotation.estado === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getDaysRemaining = (fecha: string | Date | undefined) => {
    if (!fecha) return null;
    const dateObj = typeof fecha === 'string' ? new Date(fecha) : fecha;
    const now = new Date();
    const diff = dateObj.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days;
  };

  const handleAddToCart = async (quotation: Quotation) => {
    try {
      await addToCart({
        productId: String(quotation.producto.id),
        productName: `${quotation.producto.nombre} (Cotizado)`,
        colorId: quotation.colorSeleccionado.nombre,
        colorHex: quotation.colorSeleccionado.hexCode,
        size: quotation.tallaSeleccionada,
        quantity: quotation.cantidad,
        price: quotation.precioSugerido ?? quotation.producto.precio,
        idCotizacion: Number(quotation.id),
      });
      toast({
        title: "Cotización agregada",
        description: `La cotización ${quotation.codigo} fue agregada al carrito con su precio especial.`,
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "No se pudo agregar al carrito",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header cartItemCount={2} />

      <main className="flex-1 py-8">
        <div className="container mx-auto px-4">
          <div className="mb-8">
            <h1 className="font-serif text-3xl font-semibold text-foreground">
              Mis Cotizaciones
            </h1>
            <p className="mt-2 text-muted-foreground">
              Administra tus solicitudes de cotizacion y precios especiales
            </p>
          </div>

          {/* Filters */}
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por codigo o producto..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Select 
                value={statusFilter} 
                onValueChange={(v) => setStatusFilter(v as QuotationStatus | 'all')}
              >
                <SelectTrigger className="w-[180px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Filtrar por estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="pendiente">Pendiente</SelectItem>
                  <SelectItem value="cotizado">Cotizado</SelectItem>
                  <SelectItem value="pagado">Pagado</SelectItem>
                  <SelectItem value="rechazado">Rechazado</SelectItem>
                  <SelectItem value="vencido">Vencido</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Info Banner */}
          <div className="mb-6 rounded-xl border border-border bg-accent/5 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-accent shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium text-foreground">Importante sobre cotizaciones</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Las cotizaciones aprobadas tienen una validez limitada. Una vez cotizado, 
                  podras agregar el producto al carrito con el precio especial.
                </p>
              </div>
            </div>
          </div>

          {/* Quotations List */}
          {filteredQuotations.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-muted/30 py-16 text-center">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
              <h2 className="mt-4 text-lg font-medium text-foreground">No tienes cotizaciones</h2>
              <p className="mt-2 text-muted-foreground">
                {searchQuery || statusFilter !== 'all' 
                  ? 'No se encontraron cotizaciones con los filtros seleccionados'
                  : 'Solicita una cotizacion para pedidos grandes o personalizados'}
              </p>
              <Link href="/catalogo" className="mt-4 inline-block">
                <Button className="gap-2 bg-accent text-accent-foreground hover:bg-accent/90">
                  Explorar Catalogo
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredQuotations.map((quotation) => {
                const daysRemaining = getDaysRemaining(quotation.fechaVencimiento);
                const isExpiringSoon = daysRemaining !== null && daysRemaining <= 2 && daysRemaining > 0;

                return (
                  <div 
                    key={quotation.id}
                    className={cn(
                      'rounded-xl border bg-card p-6 transition-all hover:shadow-md',
                      isExpiringSoon && quotation.estado === 'cotizado' ? 'border-accent' : 'border-border'
                    )}
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      {/* Left side - Main info */}
                      <div className="flex items-start gap-4 flex-1">
                        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-muted">
                          <Package className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <h3 className="font-semibold text-lg text-foreground">{quotation.codigo}</h3>
                            <Badge className={cn('capitalize', getQuotationStatusColor(quotation.estado))}>
                              {statusIcons[quotation.estado]}
                              <span className="ml-1">{statusLabels[quotation.estado]}</span>
                            </Badge>
                            {isExpiringSoon && quotation.estado === 'cotizado' && (
                              <Badge variant="outline" className="border-accent text-accent">
                                <Clock className="mr-1 h-3 w-3" />
                                Vence pronto
                              </Badge>
                            )}
                          </div>
                          
                          <p className="text-sm text-muted-foreground mb-3">
                            <Calendar className="mr-1 inline h-3 w-3" />
                            Solicitado el {new Date(quotation.createdAt).toLocaleDateString('es-PE', { 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric',
                              timeZone: 'UTC'
                            })}
                          </p>

                          {/* Product info */}
                          <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
                            <div 
                              className="h-10 w-10 shrink-0 rounded-lg border border-border"
                              style={{ 
                                backgroundColor: quotation.colorSeleccionado.hexCode === '#FFFFFF' 
                                  ? '#f5f5f5' 
                                  : quotation.colorSeleccionado.hexCode 
                              }}
                            />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-foreground truncate">
                                {quotation.producto.nombre}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {quotation.colorSeleccionado.nombre} | Talla {quotation.tallaSeleccionada} | {quotation.cantidad} unidades
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Right side - Price and actions */}
                      <div className="flex flex-col gap-3 lg:items-end lg:min-w-[200px]">
                        {/* Price info */}
                        <div className="text-right">
                          {quotation.precioSugerido ? (
                            <>
                              <p className="text-sm text-muted-foreground">Precio cotizado</p>
                              <p className="text-2xl font-bold text-foreground">
                                {formatPrice(quotation.precioSugerido)}
                                <span className="text-sm font-normal text-muted-foreground">/und</span>
                              </p>
                              <p className="text-sm text-accent font-medium">
                                Total: {formatPrice(quotation.precioSugerido * quotation.cantidad)}
                              </p>
                            </>
                          ) : (
                            <>
                              <p className="text-sm text-muted-foreground">Precio base</p>
                              <p className="text-lg text-muted-foreground">
                                {formatPrice(quotation.producto.precio)}/und
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Esperando cotizacion
                              </p>
                            </>
                          )}
                        </div>

                        {/* Action buttons */}
                        <div className="flex gap-2 w-full lg:w-auto">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setSelectedQuotation(quotation)}
                            className="flex-1 lg:flex-none"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Ver Detalles
                          </Button>
                          
                          {quotation.estado === 'cotizado' && (
                            <Button 
                              size="sm" 
                              className="flex-1 lg:flex-none gap-2 bg-accent text-accent-foreground hover:bg-accent/90"
                              onClick={() => handleAddToCart(quotation)}
                            >
                              <ShoppingCart className="h-4 w-4" />
                              Agregar al Carrito
                            </Button>
                          )}
                        </div>

                        {/* Additional actions by status */}
                        {quotation.estado === 'pendiente' && (
                          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                            Cancelar Solicitud
                          </Button>
                        )}
                        
                        {quotation.estado === 'pagado' && (
                          <Link href="/mis-pedidos">
                            <Button variant="outline" size="sm" className="gap-2">
                              Ver Pedido
                              <ArrowRight className="h-4 w-4" />
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>

                    {/* Expiration Warning */}
                    {quotation.estado === 'cotizado' && quotation.fechaVencimiento && (
                      <div className={cn(
                        'mt-4 rounded-lg p-3',
                        isExpiringSoon ? 'bg-accent/10' : 'bg-muted'
                      )}>
                        <p className={cn(
                          'text-sm',
                          isExpiringSoon ? 'text-accent font-medium' : 'text-muted-foreground'
                        )}>
                          <Clock className="mr-1 inline h-4 w-4" />
                          {isExpiringSoon 
                            ? `Esta cotizacion vence en ${daysRemaining} ${daysRemaining === 1 ? 'dia' : 'dias'}. Agrega al carrito antes de que expire.`
                            : `Cotizacion valida hasta el ${new Date(quotation.fechaVencimiento).toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })}`
                          }
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Quotation Detail Modal */}
      <Dialog open={!!selectedQuotation} onOpenChange={() => setSelectedQuotation(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedQuotation && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <DialogTitle className="flex items-center gap-3 text-xl">
                      {selectedQuotation.codigo}
                      <Badge className={cn('capitalize', getQuotationStatusColor(selectedQuotation.estado))}>
                        {statusIcons[selectedQuotation.estado]}
                        <span className="ml-1">{statusLabels[selectedQuotation.estado]}</span>
                      </Badge>
                    </DialogTitle>
                    <DialogDescription className="mt-1">
                      {statusDescriptions[selectedQuotation.estado]}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-6 py-4">
                {/* Product Details */}
                <div className="p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-semibold mb-4 flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    Producto Cotizado
                  </h4>
                  <div className="flex gap-4">
                    <div 
                      className="h-20 w-20 shrink-0 rounded-lg border border-border flex items-center justify-center"
                      style={{ 
                        backgroundColor: selectedQuotation.colorSeleccionado.hexCode === '#FFFFFF' 
                          ? '#f5f5f5' 
                          : selectedQuotation.colorSeleccionado.hexCode 
                      }}
                    >
                      <Package className="w-8 h-8 text-white/70" />
                    </div>
                    <div className="flex-1">
                      <h5 className="font-semibold text-lg">{selectedQuotation.producto.nombre}</h5>
                      <p className="text-sm text-muted-foreground mb-2">
                        {selectedQuotation.producto.descripcion}
                      </p>
                      <Badge variant="secondary" className="capitalize">
                        {selectedQuotation.producto.categoria}
                      </Badge>
                    </div>
                  </div>

                  <Separator className="my-4" />

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mb-1">
                        <Palette className="w-3 h-3" />
                        Color
                      </div>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-4 h-4 rounded-full border"
                          style={{ backgroundColor: selectedQuotation.colorSeleccionado.hexCode }}
                        />
                        <span className="font-medium">{selectedQuotation.colorSeleccionado.nombre}</span>
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mb-1">
                        <Ruler className="w-3 h-3" />
                        Talla
                      </div>
                      <p className="font-medium">{selectedQuotation.tallaSeleccionada}</p>
                    </div>
                    <div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mb-1">
                        <Package className="w-3 h-3" />
                        Cantidad
                      </div>
                      <p className="font-medium">{selectedQuotation.cantidad} unidades</p>
                    </div>
                    <div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mb-1">
                        <FileText className="w-3 h-3" />
                        Personalizacion
                      </div>
                      <p className="font-medium">
                        {selectedQuotation.disenoPecho || selectedQuotation.disenoEspalda ? 'Si' : 'No'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Client Info */}
                <div className="p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-semibold mb-4 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Datos del Solicitante
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span>{selectedQuotation.cliente.nombres} {selectedQuotation.cliente.apellidos}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <span>{selectedQuotation.cliente.correo}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span>{selectedQuotation.cliente.celular}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-muted-foreground" />
                      <span>{selectedQuotation.cliente.tipoDocumento}: {selectedQuotation.cliente.documento}</span>
                    </div>
                  </div>
                </div>

                {/* Pricing */}
                <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                  <h4 className="font-semibold mb-4 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Informacion de Precios
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Precio base por unidad:</span>
                      <span className="font-medium">{formatPrice(selectedQuotation.producto.precio)}</span>
                    </div>
                    {selectedQuotation.precioSugerido && (
                      <>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Precio cotizado por unidad:</span>
                          <span className="font-semibold text-accent">{formatPrice(selectedQuotation.precioSugerido)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Descuento aplicado:</span>
                          <Badge className="bg-green-100 text-green-800">
                            {Math.round((1 - selectedQuotation.precioSugerido / selectedQuotation.producto.precio) * 100)}% descuento
                          </Badge>
                        </div>
                        <Separator />
                        <div className="flex justify-between items-center">
                          <span className="font-semibold">Total ({selectedQuotation.cantidad} und):</span>
                          <span className="text-2xl font-bold text-primary">
                            {formatPrice(selectedQuotation.precioSugerido * selectedQuotation.cantidad)}
                          </span>
                        </div>
                      </>
                    )}
                    {!selectedQuotation.precioSugerido && (
                      <div className="text-center py-4 text-muted-foreground">
                        <Clock className="w-8 h-8 mx-auto mb-2" />
                        <p>Precio pendiente de cotizacion</p>
                        <p className="text-sm">Recibiras una respuesta en 24-48 horas</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Timeline */}
                <div className="p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-semibold mb-4 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Historial
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">Solicitud creada</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(selectedQuotation.createdAt).toLocaleDateString('es-PE', { 
                            day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'UTC'
                          })}
                        </p>
                      </div>
                    </div>
                    {new Date(selectedQuotation.updatedAt).getTime() > new Date(selectedQuotation.createdAt).getTime() && (
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-accent" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">Ultima actualizacion</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(selectedQuotation.updatedAt).toLocaleDateString('es-PE', { 
                              day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'UTC'
                            })}
                          </p>
                        </div>
                      </div>
                    )}
                    {selectedQuotation.fechaVencimiento && (
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-muted-foreground" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">Fecha de vencimiento</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(selectedQuotation.fechaVencimiento).toLocaleDateString('es-PE', { 
                              day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC'
                            })}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="flex justify-between items-center pt-4 border-t">
                <Button variant="outline" onClick={() => setSelectedQuotation(null)}>
                  Cerrar
                </Button>
                <div className="flex gap-2">
                  {selectedQuotation.estado === 'cotizado' && (
                    <>
                      <Button 
                        variant="outline" 
                        className="text-destructive hover:text-destructive"
                      >
                        Rechazar
                      </Button>
                      <Button 
                        className="gap-2 bg-accent text-accent-foreground hover:bg-accent/90"
                        onClick={() => {
                          handleAddToCart(selectedQuotation);
                          setSelectedQuotation(null);
                        }}
                      >
                        <ShoppingCart className="h-4 w-4" />
                        Agregar al Carrito
                      </Button>
                    </>
                  )}
                  {selectedQuotation.estado === 'pendiente' && (
                    <Button variant="destructive">
                      Cancelar Solicitud
                    </Button>
                  )}
                  {selectedQuotation.estado === 'vencido' && (
                    <Button asChild>
                      <Link href={`/producto/${selectedQuotation.producto.id}`}>
                        Ver Producto
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
