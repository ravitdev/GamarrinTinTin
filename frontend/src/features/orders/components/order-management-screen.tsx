'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  Clock,
  Eye,
  MapPin,
  Package,
  Search,
  Truck,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { OrderService } from '@/features/orders/services/order.service';
import { useToast } from '@/hooks/use-toast';
import { formatPrice } from '@/lib/mock-data';
import type { Order, OrderStatus } from '@/lib/types';

const statusConfig: Record<
  OrderStatus,
  {
    label: string;
    variant: 'default' | 'secondary' | 'destructive' | 'outline';
    icon: typeof Clock;
  }
> = {
  registrado: { label: 'Registrado', variant: 'secondary', icon: Clock },
  confirmado: { label: 'Confirmado', variant: 'default', icon: CheckCircle2 },
  en_proceso: { label: 'Procesando', variant: 'default', icon: Package },
  enviado: { label: 'Enviado', variant: 'outline', icon: Truck },
  entregado: { label: 'Entregado', variant: 'default', icon: CheckCircle2 },
  cancelado: { label: 'Cancelado', variant: 'destructive', icon: XCircle },
};

const orderStatuses: Array<{
  value: OrderStatus;
  label: string;
}> = [
  { value: 'registrado', label: 'Registrado' },
  { value: 'confirmado', label: 'Confirmado' },
  { value: 'en_proceso', label: 'Procesando' },
  { value: 'enviado', label: 'Enviado' },
  { value: 'entregado', label: 'Entregado' },
  { value: 'cancelado', label: 'Cancelado' },
];

interface OrderManagementScreenProps {
  title: string;
  description: string;
}

export function OrderManagementScreen({
  title,
  description,
}: OrderManagementScreenProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | null>(null);
  const [isSavingStatus, setIsSavingStatus] = useState(false);

  const { toast } = useToast();

  const loadOrders = async () => {
    setIsLoading(true);

    try {
      const data = await OrderService.getAllOrders({
        estado: statusFilter,
      });

      setOrders(data);
    } catch (error: any) {
      toast({
        title: 'Error',
        description:
          error.message || 'No se pudo cargar el listado de pedidos.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadOrders();
  }, [statusFilter]);

  const filteredOrders = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return orders.filter((order) => {
      return (
        !normalizedSearch ||
        order.codigo.toLowerCase().includes(normalizedSearch) ||
        order.cliente.nombres.toLowerCase().includes(normalizedSearch) ||
        order.cliente.apellidos.toLowerCase().includes(normalizedSearch) ||
        order.cliente.correo.toLowerCase().includes(normalizedSearch)
      );
    });
  }, [orders, searchTerm]);

  const counts = {
    total: orders.length,
    confirmados: orders.filter((order) => order.estado === 'confirmado').length,
    procesando: orders.filter((order) => order.estado === 'en_proceso').length,
    enviados: orders.filter((order) => order.estado === 'enviado').length,
  };

  const formatDate = (value: string | Date) =>
    new Date(value).toLocaleDateString('es-PE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

  const openDetail = async (order: Order) => {
    try {
      const detail = await OrderService.getManagementOrderDetail(order.id);
      setSelectedOrder(detail);
      setSelectedStatus(detail.estado);
    } catch (error: any) {
      toast({
        title: 'Pedido no disponible',
        description:
          error.message || 'No fue posible obtener el detalle del pedido.',
        variant: 'destructive',
      });
    }
  };

  const handleSaveStatus = async () => {
    if (!selectedOrder || !selectedStatus) return;

    setIsSavingStatus(true);

    try {
      const updated = await OrderService.updateOrderStatus(
        selectedOrder.id,
        selectedStatus,
      );

      setOrders((prev) =>
        prev.map((order) => (order.id === updated.id ? updated : order)),
      );

      setSelectedOrder(updated);
      setSelectedStatus(updated.estado);

      toast({
        title: 'Estado actualizado',
        description: 'El estado del pedido fue actualizado correctamente.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description:
          error.message || 'No se pudo actualizar el estado del pedido.',
        variant: 'destructive',
      });
    } finally {
      setIsSavingStatus(false);
    }
  };

  const emptyMessage =
    statusFilter === 'confirmado'
      ? 'No existen pedidos con estado confirmado.'
      : 'No se encontraron pedidos para el filtro seleccionado.';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold text-primary">
          {title}
        </h1>
        <p className="text-muted-foreground">{description}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Pedidos cargados</p>
            <p className="text-2xl font-bold">{counts.total}</p>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50/50">
          <CardContent className="pt-4">
            <p className="text-sm text-blue-700">Confirmados</p>
            <p className="text-2xl font-bold text-blue-700">
              {counts.confirmados}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Procesando</p>
            <p className="text-2xl font-bold">{counts.procesando}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Enviados</p>
            <p className="text-2xl font-bold">{counts.enviados}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por código, cliente o correo..."
                className="pl-10"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </div>

            <Select
              value={statusFilter}
              onValueChange={(value) =>
                setStatusFilter(value as OrderStatus | 'all')
              }
            >
              <SelectTrigger className="w-full sm:w-[210px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="confirmado">Confirmado</SelectItem>
                <SelectItem value="registrado">Registrado</SelectItem>
                <SelectItem value="en_proceso">Procesando</SelectItem>
                <SelectItem value="enviado">Enviado</SelectItem>
                <SelectItem value="entregado">Entregado</SelectItem>
                <SelectItem value="cancelado">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="border-2">
        <CardContent className="pt-6">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {filteredOrders.map((order) => {
                  const status = statusConfig[order.estado];
                  const StatusIcon = status.icon;

                  return (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono font-medium">
                        {order.codigo}
                      </TableCell>

                      <TableCell>
                        <Badge variant={status.variant} className="gap-1">
                          <StatusIcon className="h-3 w-3" />
                          {status.label}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {order.cliente.nombres} {order.cliente.apellidos}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {order.cliente.correo}
                          </p>
                        </div>
                      </TableCell>

                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(order.createdAt)}
                      </TableCell>

                      <TableCell className="text-right font-semibold">
                        {formatPrice(order.total)}
                      </TableCell>

                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => void openDetail(order)}
                        >
                          <Eye className="mr-1 h-4 w-4" />
                          Ver detalle
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {isLoading && (
            <div className="py-12 text-center">
              <Package className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
              <p className="text-muted-foreground">Cargando pedidos...</p>
            </div>
          )}

          {!isLoading && filteredOrders.length === 0 && (
            <div className="py-12 text-center">
              <Package className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
              <p className="text-muted-foreground">{emptyMessage}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={selectedOrder !== null}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedOrder(null);
            setSelectedStatus(null);
          }
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
          {selectedOrder && selectedStatus && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  Pedido {selectedOrder.codigo}
                  <Badge variant={statusConfig[selectedOrder.estado].variant}>
                    {statusConfig[selectedOrder.estado].label}
                  </Badge>
                </DialogTitle>
                <DialogDescription>
                  Registrado el {formatDate(selectedOrder.createdAt)}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 py-4">
                <div className="rounded-lg bg-muted/50 p-4">
                  <h4 className="mb-3 flex items-center gap-2 font-medium">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    Flujo de estados del pedido
                  </h4>

                  <div className="flex flex-wrap gap-2">
                    {orderStatuses.map((status) => {
                      const isCurrent = status.value === selectedOrder.estado;

                      return (
                        <Badge
                          key={status.value}
                          variant={isCurrent ? 'default' : 'outline'}
                        >
                          {status.label}
                        </Badge>
                      );
                    })}
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-lg bg-muted/50 p-4">
                    <h4 className="mb-3 flex items-center gap-2 font-medium">
                      <User className="h-4 w-4 text-muted-foreground" />
                      Cliente asociado
                    </h4>

                    <div className="space-y-2 text-sm">
                      <p>
                        <span className="text-muted-foreground">Nombre: </span>
                        {selectedOrder.cliente.nombres}{' '}
                        {selectedOrder.cliente.apellidos}
                      </p>
                      <p>
                        <span className="text-muted-foreground">Correo: </span>
                        {selectedOrder.cliente.correo}
                      </p>
                      <p>
                        <span className="text-muted-foreground">Documento: </span>
                        {selectedOrder.cliente.tipoDocumento}:{' '}
                        {selectedOrder.cliente.documento}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-lg bg-muted/50 p-4">
                    <h4 className="mb-3 flex items-center gap-2 font-medium">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      Dirección asociada
                    </h4>
                    <p className="text-sm">{selectedOrder.direccionEnvio}</p>
                  </div>
                </div>

                <div>
                  <h4 className="mb-3 font-medium">
                    Productos registrados ({selectedOrder.items.length})
                  </h4>

                  <div className="divide-y rounded-lg border">
                    {selectedOrder.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-4 p-4"
                      >
                        <div
                          className="h-12 w-12 rounded-lg border"
                          style={{
                            backgroundColor:
                              item.colorSeleccionado.hexCode === '#FFFFFF'
                                ? '#f5f5f5'
                                : item.colorSeleccionado.hexCode,
                          }}
                        />

                        <div className="flex-1">
                          <p className="font-medium">{item.producto.nombre}</p>
                          <p className="text-sm text-muted-foreground">
                            {item.colorSeleccionado.nombre} | Talla{' '}
                            {item.tallaSeleccionada} | x{item.cantidad}
                          </p>
                        </div>

                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">
                            Precio unitario
                          </p>
                          <p className="font-medium">
                            {formatPrice(item.precioUnitario)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-lg border-2 border-primary/20 p-4">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>{formatPrice(selectedOrder.subtotal)}</span>
                  </div>

                  {selectedOrder.descuento > 0 && (
                    <div className="mt-2 flex justify-between text-sm text-green-600">
                      <span>Descuento</span>
                      <span>-{formatPrice(selectedOrder.descuento)}</span>
                    </div>
                  )}

                  <div className="mt-3 flex justify-between border-t pt-3 text-lg font-bold">
                    <span>Monto total</span>
                    <span>{formatPrice(selectedOrder.total)}</span>
                  </div>
                </div>

                <div className="rounded-lg border border-accent/30 bg-accent/10 p-4">
                  <h4 className="mb-3 font-medium">Actualizar estado</h4>

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <Select
                      value={selectedStatus}
                      onValueChange={(value) =>
                        setSelectedStatus(value as OrderStatus)
                      }
                    >
                      <SelectTrigger className="w-full sm:w-[220px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {orderStatuses.map((status) => (
                          <SelectItem key={status.value} value={status.value}>
                            {status.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Button
                      onClick={handleSaveStatus}
                      disabled={
                        isSavingStatus || selectedStatus === selectedOrder.estado
                      }
                    >
                      {isSavingStatus ? 'Guardando...' : 'Guardar cambios'}
                    </Button>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedOrder(null);
                    setSelectedStatus(null);
                  }}
                >
                  Cerrar
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}