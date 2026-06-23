'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  Eye,
  FileText,
  Filter,
  Loader2,
  Mail,
  Package,
  Search,
  Send,
  User,
  XCircle,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { QuotationService } from '@/features/quotations/services/quotation.service';
import { formatPrice, getQuotationStatusColor } from '@/lib/mock-data';
import type { Quotation, QuotationStatus } from '@/lib/types';
import { cn } from '@/lib/utils';

const statusLabels: Record<QuotationStatus, string> = {
  pendiente: 'Pendiente',
  cotizado: 'Cotizado',
  pagado: 'Pagado',
  rechazado: 'Rechazado',
  vencido: 'Vencido',
};

const statusIcons: Record<QuotationStatus, React.ReactNode> = {
  pendiente: <Clock className="h-4 w-4" />,
  cotizado: <Send className="h-4 w-4" />,
  pagado: <CheckCircle2 className="h-4 w-4" />,
  rechazado: <XCircle className="h-4 w-4" />,
  vencido: <AlertTriangle className="h-4 w-4" />,
};

export default function AdminQuotationsPage() {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<QuotationStatus | 'all'>('all');

  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);
  const [quotationToRespond, setQuotationToRespond] = useState<Quotation | null>(null);
  const [quotationPrice, setQuotationPrice] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadQuotations = async () => {
    setIsLoading(true);
    try {
      const data = await QuotationService.getAllQuotations();
      setQuotations(data);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadQuotations();
  }, []);

  const filteredQuotations = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return quotations.filter((quotation) => {
      const matchesSearch =
        !normalizedSearch ||
        quotation.codigo.toLowerCase().includes(normalizedSearch) ||
        quotation.cliente.nombres.toLowerCase().includes(normalizedSearch) ||
        quotation.cliente.apellidos.toLowerCase().includes(normalizedSearch) ||
        quotation.cliente.correo.toLowerCase().includes(normalizedSearch) ||
        quotation.producto.nombre.toLowerCase().includes(normalizedSearch);

      const matchesStatus =
        statusFilter === 'all' || quotation.estado === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [quotations, searchTerm, statusFilter]);

  const counts = {
    total: quotations.length,
    pendiente: quotations.filter((q) => q.estado === 'pendiente').length,
    cotizado: quotations.filter((q) => q.estado === 'cotizado').length,
    pagado: quotations.filter((q) => q.estado === 'pagado').length,
  };

  const openRespondDialog = (quotation: Quotation) => {
    const suggestedPrice = quotation.producto.precio * quotation.cantidad;

    setQuotationToRespond(quotation);
    setQuotationPrice(suggestedPrice.toFixed(2));
  };

  const handleRespondQuotation = async () => {
    if (!quotationToRespond) return;

    const parsedPrice = Number(quotationPrice);

    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      alert('El precio ingresado no es válido. Debe ser mayor a 0.');
      return;
    }

    setIsSubmitting(true);

    try {
      const updated = await QuotationService.updateQuotation(
        quotationToRespond.id,
        {
          estado: 'cotizado',
          precioSugerido: parsedPrice,
        },
      );

      setQuotations((prev) =>
        prev.map((quotation) =>
          quotation.id === updated.id ? updated : quotation,
        ),
      );

      setQuotationToRespond(null);
      setQuotationPrice('');
    } catch (error: any) {
      alert(error.message || 'No se pudo responder la cotización.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (value: string | Date) =>
    new Date(value).toLocaleDateString('es-PE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold text-primary">
          Gestión de Cotizaciones
        </h1>
        <p className="text-muted-foreground">
          Revisa y responde las solicitudes de cotización enviadas por los clientes.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-muted p-2">
                <FileText className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{counts.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-yellow-200 bg-yellow-50/50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-yellow-100 p-2">
                <Clock className="h-5 w-5 text-yellow-700" />
              </div>
              <div>
                <p className="text-sm text-yellow-700">Pendientes</p>
                <p className="text-2xl font-bold text-yellow-700">
                  {counts.pendiente}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50/50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-100 p-2">
                <Send className="h-5 w-5 text-blue-700" />
              </div>
              <div>
                <p className="text-sm text-blue-700">Cotizadas</p>
                <p className="text-2xl font-bold text-blue-700">
                  {counts.cotizado}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50/50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-green-100 p-2">
                <CheckCircle2 className="h-5 w-5 text-green-700" />
              </div>
              <div>
                <p className="text-sm text-green-700">Pagadas</p>
                <p className="text-2xl font-bold text-green-700">
                  {counts.pagado}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por código, cliente, correo o producto..."
                className="pl-10"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </div>

            <Select
              value={statusFilter}
              onValueChange={(value) =>
                setStatusFilter(value as QuotationStatus | 'all')
              }
            >
              <SelectTrigger className="w-full sm:w-[190px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pendiente">Pendiente</SelectItem>
                <SelectItem value="cotizado">Cotizado</SelectItem>
                <SelectItem value="pagado">Pagado</SelectItem>
                <SelectItem value="rechazado">Rechazado</SelectItem>
                <SelectItem value="vencido">Vencido</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {filteredQuotations.map((quotation) => (
          <Card
            key={quotation.id}
            className="border-2 transition-colors hover:border-accent/50"
          >
            <CardContent className="pt-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex-1 space-y-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="font-semibold text-lg">{quotation.codigo}</h3>
                    <Badge
                      className={cn(
                        'capitalize',
                        getQuotationStatusColor(quotation.estado),
                      )}
                    >
                      <span className="flex items-center gap-1">
                        {statusIcons[quotation.estado]}
                        {statusLabels[quotation.estado]}
                      </span>
                    </Badge>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {formatDate(quotation.createdAt)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Package className="h-4 w-4" />
                      {quotation.cantidad} unidades
                    </span>
                    <span className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      {quotation.cliente.nombres} {quotation.cliente.apellidos}
                    </span>
                    <span className="flex items-center gap-1">
                      <Mail className="h-4 w-4" />
                      {quotation.cliente.correo}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 rounded-lg border p-3">
                    <div
                      className="h-12 w-12 rounded-lg border"
                      style={{
                        backgroundColor:
                          quotation.colorSeleccionado.hexCode === '#FFFFFF'
                            ? '#f5f5f5'
                            : quotation.colorSeleccionado.hexCode,
                      }}
                    />
                    <div className="flex-1">
                      <p className="font-medium">{quotation.producto.nombre}</p>
                      <p className="text-sm text-muted-foreground">
                        {quotation.colorSeleccionado.nombre} | Talla{' '}
                        {quotation.tallaSeleccionada}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Precio base</p>
                      <p className="font-semibold">
                        {formatPrice(quotation.producto.precio)} / unidad
                      </p>
                    </div>
                  </div>

                  {(quotation.disenoPecho || quotation.disenoEspalda) && (
                    <div className="rounded-lg bg-muted/50 p-3 text-sm">
                      <p className="font-medium">Diseño personalizado</p>
                      {quotation.disenoPecho && (
                        <p className="text-muted-foreground">
                          Pecho: {quotation.disenoPecho}
                        </p>
                      )}
                      {quotation.disenoEspalda && (
                        <p className="text-muted-foreground">
                          Espalda: {quotation.disenoEspalda}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-3 lg:w-64">
                  {quotation.precioSugerido ? (
                    <div className="rounded-lg bg-primary/5 p-4 text-center">
                      <p className="text-sm text-muted-foreground">
                        Precio final cotizado
                      </p>
                      <p className="text-2xl font-bold text-primary">
                        {formatPrice(quotation.precioSugerido)}
                      </p>
                      {quotation.fechaVencimiento && (
                        <p className="mt-2 text-xs text-muted-foreground">
                          Válido hasta{' '}
                          {formatDate(quotation.fechaVencimiento)}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="rounded-lg bg-muted/50 p-4 text-center">
                      <p className="text-sm text-muted-foreground">
                        Pendiente de respuesta
                      </p>
                    </div>
                  )}

                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={() => setSelectedQuotation(quotation)}
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    Ver detalles
                  </Button>

                  {quotation.estado === 'pendiente' && (
                    <Button
                      className="w-full"
                      onClick={() => openRespondDialog(quotation)}
                    >
                      <Send className="mr-2 h-4 w-4" />
                      Responder cotización
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredQuotations.length === 0 && (
          <Card className="border-2">
            <CardContent className="py-12 text-center">
              <FileText className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
              <p className="text-muted-foreground">
                No se encontraron cotizaciones.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

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
                  {selectedQuotation.codigo}
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
                  Solicitud recibida el {formatDate(selectedQuotation.createdAt)}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-5 py-4">
                <div className="rounded-lg bg-muted/50 p-4">
                  <h4 className="mb-3 font-medium">Cliente</h4>
                  <div className="grid gap-3 text-sm sm:grid-cols-2">
                    <div>
                      <p className="text-muted-foreground">Nombre</p>
                      <p className="font-medium">
                        {selectedQuotation.cliente.nombres}{' '}
                        {selectedQuotation.cliente.apellidos}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Correo</p>
                      <p className="font-medium">
                        {selectedQuotation.cliente.correo}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Documento</p>
                      <p className="font-medium">
                        {selectedQuotation.cliente.tipoDocumento}:{' '}
                        {selectedQuotation.cliente.documento}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Celular</p>
                      <p className="font-medium">
                        {selectedQuotation.cliente.celular}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg bg-muted/50 p-4">
                  <h4 className="mb-3 font-medium">Producto solicitado</h4>
                  <div className="flex items-center gap-4">
                    <div
                      className="h-14 w-14 rounded-lg border"
                      style={{
                        backgroundColor:
                          selectedQuotation.colorSeleccionado.hexCode === '#FFFFFF'
                            ? '#f5f5f5'
                            : selectedQuotation.colorSeleccionado.hexCode,
                      }}
                    />
                    <div className="flex-1">
                      <p className="font-medium">
                        {selectedQuotation.producto.nombre}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Color: {selectedQuotation.colorSeleccionado.nombre} |
                        Talla: {selectedQuotation.tallaSeleccionada}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Cantidad: {selectedQuotation.cantidad} unidades
                      </p>
                    </div>
                  </div>
                </div>

                {selectedQuotation.precioSugerido && (
                  <div className="rounded-lg border-2 border-accent/50 bg-accent/5 p-4">
                    <h4 className="mb-2 font-medium">Precio final cotizado</h4>
                    <p className="text-2xl font-bold text-accent">
                      {formatPrice(selectedQuotation.precioSugerido)}
                    </p>
                    {selectedQuotation.fechaVencimiento && (
                      <p className="mt-1 text-sm text-muted-foreground">
                        Válido hasta{' '}
                        {formatDate(selectedQuotation.fechaVencimiento)}
                      </p>
                    )}
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setSelectedQuotation(null)}
                >
                  Cerrar
                </Button>
                {selectedQuotation.estado === 'pendiente' && (
                  <Button
                    onClick={() => {
                      const quotation = selectedQuotation;
                      setSelectedQuotation(null);
                      openRespondDialog(quotation);
                    }}
                  >
                    <Send className="mr-2 h-4 w-4" />
                    Responder cotización
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={quotationToRespond !== null}
        onOpenChange={(open) => {
          if (!open) {
            setQuotationToRespond(null);
            setQuotationPrice('');
          }
        }}
      >
        <DialogContent>
          {quotationToRespond && (
            <>
              <DialogHeader>
                <DialogTitle>
                  Responder cotización {quotationToRespond.codigo}
                </DialogTitle>
                <DialogDescription>
                  Ingresa el precio final propuesto para toda la solicitud.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="rounded-lg bg-muted/50 p-4 text-sm">
                  <p className="font-medium">
                    {quotationToRespond.producto.nombre}
                  </p>
                  <p className="text-muted-foreground">
                    {quotationToRespond.colorSeleccionado.nombre} | Talla{' '}
                    {quotationToRespond.tallaSeleccionada} |{' '}
                    {quotationToRespond.cantidad} unidades
                  </p>
                  <p className="mt-2 text-muted-foreground">
                    Precio base estimado:{' '}
                    {formatPrice(
                      quotationToRespond.producto.precio *
                        quotationToRespond.cantidad,
                    )}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quotationPrice">
                    Precio propuesto final
                  </Label>
                  <Input
                    id="quotationPrice"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={quotationPrice}
                    onChange={(event) =>
                      setQuotationPrice(event.target.value)
                    }
                    placeholder="Ej: 850.00"
                  />
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setQuotationToRespond(null);
                    setQuotationPrice('');
                  }}
                  disabled={isSubmitting}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleRespondQuotation}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Enviando...' : 'Enviar respuesta'}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
