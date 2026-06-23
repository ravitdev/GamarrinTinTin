'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowRight,
  Calendar,
  CheckCircle,
  Clock,
  Eye,
  FileText,
  Filter,
  Package,
  Palette,
  Ruler,
  Search,
  ShoppingCart,
  XCircle,
} from 'lucide-react';

import { Footer } from '@/components/layout/footer';
import { Header } from '@/components/layout/header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { QuotationService } from '@/features/quotations/services/quotation.service';
import { useToast } from '@/hooks/use-toast';
import { formatPrice, getQuotationStatusColor } from '@/lib/mock-data';
import type { Quotation, QuotationStatus } from '@/lib/types';
import { cn } from '@/lib/utils';

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
  pendiente: 'Tu solicitud está siendo revisada por nuestro equipo.',
  cotizado:
    'Tu cotización ya cuenta con un precio final propuesto por el negocio.',
  pagado: 'Esta cotización ya fue pagada y convertida en pedido.',
  rechazado: 'Esta cotización fue rechazada o cancelada.',
  vencido:
    'Esta cotización ha vencido porque superó el plazo de respuesta establecido.',
};

export default function MisCotizacionesPage() {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<QuotationStatus | 'all'>(
    'all',
  );
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(
    null,
  );

  const { toast } = useToast();

  useEffect(() => {
    QuotationService.getMyQuotations()
      .then(setQuotations)
      .finally(() => setIsLoading(false));
  }, []);

  const filteredQuotations = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();

    return quotations.filter((quotation) => {
      const matchesSearch =
        !normalizedSearch ||
        quotation.codigo.toLowerCase().includes(normalizedSearch) ||
        quotation.producto.nombre.toLowerCase().includes(normalizedSearch);

      const matchesStatus =
        statusFilter === 'all' || quotation.estado === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [quotations, searchQuery, statusFilter]);

  const formatDate = (value: string | Date) =>
    new Date(value).toLocaleDateString('es-PE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

  const getHoursRemaining = (fecha: string | Date | undefined) => {
    if (!fecha) return null;

    const expiresAt = typeof fecha === 'string' ? new Date(fecha) : fecha;
    const now = new Date();
    const diff = expiresAt.getTime() - now.getTime();

    if (diff <= 0) return 0;

    return Math.ceil(diff / (1000 * 60 * 60));
  };

  const handleAddToCart = (quotation: Quotation) => {
    toast({
      title: 'Funcionalidad pendiente',
      description: `La cotización ${quotation.codigo} ya está cotizada. La integración real con carrito se implementará en el caso de uso de agregar cotización al carrito.`,
    });
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
              Consulta el estado de tus solicitudes de cotización.
            </p>
          </div>

          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative max-w-md flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por código o producto..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="pl-10"
              />
            </div>

            <Select
              value={statusFilter}
              onValueChange={(value) =>
                setStatusFilter(value as QuotationStatus | 'all')
              }
            >
              <SelectTrigger className="w-[190px]">
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

          <div className="mb-6 rounded-xl border border-border bg-accent/5 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
              <div>
                <h3 className="font-medium text-foreground">
                  Importante sobre cotizaciones
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Cuando una cotización sea respondida, verás el precio final
                  propuesto por el negocio. Las cotizaciones respondidas vencen
                  según el plazo definido por el sistema.
                </p>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="rounded-xl border border-border bg-muted/30 py-16 text-center">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
              <h2 className="mt-4 text-lg font-medium text-foreground">
                Cargando cotizaciones...
              </h2>
            </div>
          ) : filteredQuotations.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-muted/30 py-16 text-center">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
              <h2 className="mt-4 text-lg font-medium text-foreground">
                No tienes solicitudes de cotización registradas.
              </h2>
              <p className="mt-2 text-muted-foreground">
                {searchQuery || statusFilter !== 'all'
                  ? 'No se encontraron cotizaciones con los filtros seleccionados.'
                  : 'Solicita una cotización para productos personalizados o pedidos especiales.'}
              </p>
              <Link href="/catalogo" className="mt-4 inline-block">
                <Button className="gap-2 bg-accent text-accent-foreground hover:bg-accent/90">
                  Explorar catálogo
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredQuotations.map((quotation) => {
                const hoursRemaining = getHoursRemaining(
                  quotation.fechaVencimiento,
                );
                const isExpiringSoon =
                  quotation.estado === 'cotizado' &&
                  hoursRemaining !== null &&
                  hoursRemaining > 0 &&
                  hoursRemaining <= 24;

                return (
                  <div
                    key={quotation.id}
                    className={cn(
                      'rounded-xl border bg-card p-6 transition-all hover:shadow-md',
                      isExpiringSoon ? 'border-accent' : 'border-border',
                    )}
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="flex flex-1 items-start gap-4">
                        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-muted">
                          <Package className="h-8 w-8 text-muted-foreground" />
                        </div>

                        <div className="flex-1">
                          <div className="mb-1 flex flex-wrap items-center gap-2">
                            <h3 className="text-lg font-semibold text-foreground">
                              {quotation.codigo}
                            </h3>
                            <Badge
                              className={cn(
                                'capitalize',
                                getQuotationStatusColor(quotation.estado),
                              )}
                            >
                              {statusIcons[quotation.estado]}
                              <span className="ml-1">
                                {statusLabels[quotation.estado]}
                              </span>
                            </Badge>

                            {isExpiringSoon && (
                              <Badge
                                variant="outline"
                                className="border-accent text-accent"
                              >
                                <Clock className="mr-1 h-3 w-3" />
                                Vence pronto
                              </Badge>
                            )}
                          </div>

                          <p className="mb-3 text-sm text-muted-foreground">
                            <Calendar className="mr-1 inline h-3 w-3" />
                            Solicitado el {formatDate(quotation.createdAt)}
                          </p>

                          <div className="flex items-center gap-4 rounded-lg bg-muted/50 p-3">
                            <div
                              className="h-10 w-10 shrink-0 rounded-lg border border-border"
                              style={{
                                backgroundColor:
                                  quotation.colorSeleccionado.hexCode ===
                                  '#FFFFFF'
                                    ? '#f5f5f5'
                                    : quotation.colorSeleccionado.hexCode,
                              }}
                            />
                            <div className="min-w-0 flex-1">
                              <p className="truncate font-medium text-foreground">
                                {quotation.producto.nombre}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {quotation.colorSeleccionado.nombre} | Talla{' '}
                                {quotation.tallaSeleccionada} |{' '}
                                {quotation.cantidad} unidades
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-3 lg:min-w-[220px] lg:items-end">
                        <div className="text-right">
                          {quotation.precioSugerido ? (
                            <>
                              <p className="text-sm text-muted-foreground">
                                Precio final cotizado
                              </p>
                              <p className="text-2xl font-bold text-foreground">
                                {formatPrice(quotation.precioSugerido)}
                              </p>
                              {quotation.fechaVencimiento && (
                                <p className="text-sm text-muted-foreground">
                                  Válido hasta{' '}
                                  {formatDate(quotation.fechaVencimiento)}
                                </p>
                              )}
                            </>
                          ) : (
                            <>
                              <p className="text-sm text-muted-foreground">
                                Precio base referencial
                              </p>
                              <p className="text-lg text-muted-foreground">
                                {formatPrice(quotation.producto.precio)} / unidad
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Esperando cotización
                              </p>
                            </>
                          )}
                        </div>

                        <div className="flex w-full gap-2 lg:w-auto">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedQuotation(quotation)}
                            className="flex-1 lg:flex-none"
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            Ver detalles
                          </Button>

                          {quotation.estado === 'cotizado' && (
                            <Button
                              size="sm"
                              className="flex-1 gap-2 bg-accent text-accent-foreground hover:bg-accent/90 lg:flex-none"
                              onClick={() => handleAddToCart(quotation)}
                            >
                              <ShoppingCart className="h-4 w-4" />
                              Agregar al carrito
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>

                    {quotation.estado === 'cotizado' &&
                      quotation.fechaVencimiento && (
                        <div
                          className={cn(
                            'mt-4 rounded-lg p-3',
                            isExpiringSoon ? 'bg-accent/10' : 'bg-muted',
                          )}
                        >
                          <p
                            className={cn(
                              'text-sm',
                              isExpiringSoon
                                ? 'font-medium text-accent'
                                : 'text-muted-foreground',
                            )}
                          >
                            {isExpiringSoon
                              ? `Esta cotización vence en aproximadamente ${hoursRemaining} horas.`
                              : `Esta cotización estará disponible hasta el ${formatDate(
                                  quotation.fechaVencimiento,
                                )}.`}
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

      <Dialog
        open={selectedQuotation !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedQuotation(null);
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          {selectedQuotation && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  Cotización {selectedQuotation.codigo}
                  <Badge
                    className={cn(
                      'capitalize',
                      getQuotationStatusColor(selectedQuotation.estado),
                    )}
                  >
                    {statusLabels[selectedQuotation.estado]}
                  </Badge>
                </DialogTitle>
                <DialogDescription>
                  {statusDescriptions[selectedQuotation.estado]}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 py-4">
                <div className="rounded-lg bg-muted/50 p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <h4 className="font-medium">Producto solicitado</h4>
                  </div>

                  <div className="flex items-center gap-4">
                    <div
                      className="h-16 w-16 rounded-lg border"
                      style={{
                        backgroundColor:
                          selectedQuotation.colorSeleccionado.hexCode ===
                          '#FFFFFF'
                            ? '#f5f5f5'
                            : selectedQuotation.colorSeleccionado.hexCode,
                      }}
                    />
                    <div className="flex-1">
                      <p className="font-medium">
                        {selectedQuotation.producto.nombre}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Color: {selectedQuotation.colorSeleccionado.nombre}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Talla: {selectedQuotation.tallaSeleccionada}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Cantidad: {selectedQuotation.cantidad} unidades
                      </p>
                    </div>
                  </div>
                </div>

                {(selectedQuotation.disenoPecho ||
                  selectedQuotation.disenoEspalda) && (
                  <div className="rounded-lg bg-muted/50 p-4">
                    <div className="mb-3 flex items-center gap-2">
                      <Palette className="h-4 w-4 text-muted-foreground" />
                      <h4 className="font-medium">Diseño adjunto</h4>
                    </div>

                    <div className="space-y-3 text-sm">
                      {selectedQuotation.disenoPecho && (
                        <div className="flex items-start gap-2">
                          <Ruler className="mt-0.5 h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium">Pecho</p>
                            <p className="text-muted-foreground">
                              {selectedQuotation.disenoPecho}
                            </p>
                          </div>
                        </div>
                      )}

                      {selectedQuotation.disenoEspalda && (
                        <div className="flex items-start gap-2">
                          <Ruler className="mt-0.5 h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium">Espalda</p>
                            <p className="text-muted-foreground">
                              {selectedQuotation.disenoEspalda}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {selectedQuotation.precioSugerido ? (
                  <div className="rounded-lg border-2 border-accent/50 bg-accent/5 p-4">
                    <h4 className="mb-2 font-medium">Precio final cotizado</h4>
                    <p className="text-3xl font-bold text-accent">
                      {formatPrice(selectedQuotation.precioSugerido)}
                    </p>
                    {selectedQuotation.fechaVencimiento && (
                      <p className="mt-2 text-sm text-muted-foreground">
                        Válido hasta{' '}
                        {formatDate(selectedQuotation.fechaVencimiento)}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="rounded-lg border border-border bg-muted/30 p-4">
                    <h4 className="font-medium">Pendiente de revisión</h4>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Un vendedor revisará la solicitud y asignará un precio
                      propuesto.
                    </p>
                  </div>
                )}
              </div>

              <div className="flex justify-end">
                <Button
                  variant="outline"
                  onClick={() => setSelectedQuotation(null)}
                >
                  Cerrar
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
