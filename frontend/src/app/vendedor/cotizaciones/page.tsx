'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Calculator,
  Calendar,
  CheckCircle2,
  Clock,
  Eye,
  FileText,
  Package,
  Search,
  Send,
  User,
  XCircle,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { QuotationService } from '@/features/quotations/services/quotation.service';
import { formatPrice } from '@/lib/mock-data';
import type { Quotation, QuotationStatus } from '@/lib/types';

const statusConfig: Record<
  QuotationStatus,
  {
    label: string;
    variant: 'default' | 'secondary' | 'destructive' | 'outline';
    icon: typeof Clock;
  }
> = {
  pendiente: { label: 'Pendiente', variant: 'secondary', icon: Clock },
  cotizado: { label: 'Cotizado', variant: 'default', icon: CheckCircle2 },
  pagado: { label: 'Pagado', variant: 'default', icon: CheckCircle2 },
  rechazado: { label: 'Rechazado', variant: 'destructive', icon: XCircle },
  vencido: { label: 'Vencido', variant: 'outline', icon: XCircle },
};

export default function VendedorCotizacionesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<string>('pendiente');

  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const [quotationToRespond, setQuotationToRespond] = useState<Quotation | null>(null);
  const [quotedPrice, setQuotedPrice] = useState('');
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
        quotation.producto.nombre.toLowerCase().includes(normalizedSearch);

      const matchesTab = activeTab === 'todas' || quotation.estado === activeTab;

      return matchesSearch && matchesTab;
    });
  }, [quotations, searchTerm, activeTab]);

  const pendingCount = quotations.filter((q) => q.estado === 'pendiente').length;
  const quotedCount = quotations.filter((q) => q.estado === 'cotizado').length;
  const paidCount = quotations.filter((q) => q.estado === 'pagado').length;
  const totalCount = quotations.length;

  const formatDate = (value: string | Date) =>
    new Date(value).toLocaleDateString('es-PE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

  const openRespondDialog = (quotation: Quotation) => {
    const baseTotal = quotation.producto.precio * quotation.cantidad;
    const applicableDiscount = quotation.producto.descuentosVolumen.find(
      (discount) => quotation.cantidad >= discount.cantidadMinima,
    );

    const suggestedTotal = applicableDiscount
      ? baseTotal * (1 - applicableDiscount.porcentajeDescuento / 100)
      : baseTotal;

    setQuotationToRespond(quotation);
    setQuotedPrice(suggestedTotal.toFixed(2));
  };

  const handleSendQuote = async () => {
    if (!quotationToRespond) return;

    const parsedPrice = Number(quotedPrice);

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
      setQuotedPrice('');
    } catch (error: any) {
      alert(error.message || 'No se pudo cotizar.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openDetail = (quotation: Quotation) => {
    setSelectedQuotation(quotation);
    setIsDetailOpen(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold text-primary">
          Gestión de Cotizaciones
        </h1>
        <p className="text-muted-foreground">
          Responde a las solicitudes de cotización de los clientes.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card className="border-amber-200 bg-amber-50/50">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-amber-700">Pendientes</p>
                <p className="text-2xl font-bold text-amber-700">
                  {pendingCount}
                </p>
              </div>
              <Clock className="h-8 w-8 text-amber-300" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Cotizadas</p>
                <p className="text-2xl font-bold">{quotedCount}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-muted-foreground/30" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pagadas</p>
                <p className="text-2xl font-bold">{paidCount}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-300" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{totalCount}</p>
              </div>
              <FileText className="h-8 w-8 text-muted-foreground/30" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por código, cliente o producto..."
          className="pl-10"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="pendiente" className="gap-2">
            <Clock className="h-4 w-4" />
            Pendientes
            {pendingCount > 0 && (
              <Badge variant="secondary" className="ml-1">
                {pendingCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="cotizado">Cotizadas</TabsTrigger>
          <TabsTrigger value="pagado">Pagadas</TabsTrigger>
          <TabsTrigger value="todas">Todas</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Producto</TableHead>
                    <TableHead className="text-center">Cantidad</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {filteredQuotations.map((quotation) => {
                    const status = statusConfig[quotation.estado];
                    const StatusIcon = status.icon;

                    return (
                      <TableRow key={quotation.id}>
                        <TableCell className="font-mono font-medium">
                          {quotation.codigo}
                        </TableCell>

                        <TableCell>
                          <div>
                            <p className="font-medium">
                              {quotation.cliente.nombres}{' '}
                              {quotation.cliente.apellidos}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {quotation.cliente.correo}
                            </p>
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div
                              className="h-8 w-8 rounded-full border"
                              style={{
                                backgroundColor:
                                  quotation.colorSeleccionado.hexCode === '#FFFFFF'
                                    ? '#f5f5f5'
                                    : quotation.colorSeleccionado.hexCode,
                              }}
                            />
                            <div>
                              <p className="font-medium">
                                {quotation.producto.nombre}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {quotation.colorSeleccionado.nombre} - Talla{' '}
                                {quotation.tallaSeleccionada}
                              </p>
                            </div>
                          </div>
                        </TableCell>

                        <TableCell className="text-center">
                          <Badge variant="outline">
                            {quotation.cantidad} uds
                          </Badge>
                        </TableCell>

                        <TableCell>
                          <Badge variant={status.variant} className="gap-1">
                            <StatusIcon className="h-3 w-3" />
                            {status.label}
                          </Badge>
                        </TableCell>

                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(quotation.createdAt)}
                        </TableCell>

                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openDetail(quotation)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>

                            {quotation.estado === 'pendiente' && (
                              <Button
                                size="sm"
                                onClick={() => openRespondDialog(quotation)}
                              >
                                <Calculator className="mr-1 h-4 w-4" />
                                Cotizar
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              {isLoading && (
                <div className="py-12 text-center text-muted-foreground">
                  Cargando cotizaciones...
                </div>
              )}

              {!isLoading && filteredQuotations.length === 0 && (
                <div className="py-12 text-center">
                  <FileText className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
                  <p className="text-muted-foreground">
                    No hay cotizaciones en esta categoría.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog
        open={isDetailOpen}
        onOpenChange={(open) => {
          setIsDetailOpen(open);
          if (!open) setSelectedQuotation(null);
        }}
      >
        <DialogContent className="max-w-2xl">
          {selectedQuotation && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <span>Cotización {selectedQuotation.codigo}</span>
                  <Badge variant={statusConfig[selectedQuotation.estado].variant}>
                    {statusConfig[selectedQuotation.estado].label}
                  </Badge>
                </DialogTitle>
                <DialogDescription>
                  Solicitada el {formatDate(selectedQuotation.createdAt)}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 py-4">
                <div className="rounded-lg bg-muted/50 p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <h4 className="font-medium">Datos del cliente</h4>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
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
                  <div className="mb-3 flex items-center gap-2">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <h4 className="font-medium">Producto solicitado</h4>
                  </div>

                  <div className="flex items-center gap-4">
                    <div
                      className="h-16 w-16 rounded-lg border"
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
                        Cantidad:{' '}
                        <span className="font-medium">
                          {selectedQuotation.cantidad} unidades
                        </span>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">
                        Precio base
                      </p>
                      <p className="font-bold">
                        {formatPrice(selectedQuotation.producto.precio)} / unidad
                      </p>
                    </div>
                  </div>
                </div>

                {selectedQuotation.precioSugerido && (
                  <div className="rounded-lg border-2 border-accent/50 bg-accent/5 p-4">
                    <div className="mb-3 flex items-center gap-2">
                      <Calculator className="h-4 w-4 text-accent" />
                      <h4 className="font-medium">Precio final cotizado</h4>
                    </div>

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
                  onClick={() => {
                    setIsDetailOpen(false);
                    setSelectedQuotation(null);
                  }}
                >
                  Cerrar
                </Button>

                {selectedQuotation.estado === 'pendiente' && (
                  <Button
                    onClick={() => {
                      const quotation = selectedQuotation;
                      setIsDetailOpen(false);
                      setSelectedQuotation(null);
                      openRespondDialog(quotation);
                    }}
                  >
                    <Calculator className="mr-2 h-4 w-4" />
                    Enviar cotización
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
            setQuotedPrice('');
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
                  <Label htmlFor="quotedPrice">Precio propuesto final</Label>
                  <Input
                    id="quotedPrice"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={quotedPrice}
                    onChange={(event) => setQuotedPrice(event.target.value)}
                    placeholder="Ej: 850.00"
                  />
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  disabled={isSubmitting}
                  onClick={() => {
                    setQuotationToRespond(null);
                    setQuotedPrice('');
                  }}
                >
                  Cancelar
                </Button>
                <Button onClick={handleSendQuote} disabled={isSubmitting}>
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
