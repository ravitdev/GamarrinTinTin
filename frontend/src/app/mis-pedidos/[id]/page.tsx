'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  Calendar,
  CheckCircle,
  Clock,
  MapPin,
  Package,
  Truck,
  XCircle,
} from 'lucide-react';

import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { OrderService } from '@/features/orders/services/order.service';
import { formatPrice, getOrderStatusColor } from '@/lib/mock-data';
import type { Order, OrderStatus } from '@/lib/types';
import { cn } from '@/lib/utils';

const statusIcons: Record<OrderStatus, React.ReactNode> = {
  registrado: <Clock className="h-4 w-4" />,
  confirmado: <CheckCircle className="h-4 w-4" />,
  en_proceso: <Package className="h-4 w-4" />,
  enviado: <Truck className="h-4 w-4" />,
  entregado: <CheckCircle className="h-4 w-4" />,
  cancelado: <XCircle className="h-4 w-4" />,
};

const statusLabels: Record<OrderStatus, string> = {
  registrado: 'Registrado',
  confirmado: 'Confirmado',
  en_proceso: 'En Proceso',
  enviado: 'Enviado',
  entregado: 'Entregado',
  cancelado: 'Cancelado',
};

const orderFlowSteps: Array<{
  status: Exclude<OrderStatus, 'cancelado'>;
  label: string;
  description: string;
  icon: React.ReactNode;
}> = [
  {
    status: 'registrado',
    label: 'Registrado',
    description: 'Pedido recibido',
    icon: <Clock className="h-4 w-4" />,
  },
  {
    status: 'confirmado',
    label: 'Confirmado',
    description: 'Pedido aprobado',
    icon: <CheckCircle className="h-4 w-4" />,
  },
  {
    status: 'en_proceso',
    label: 'Procesando',
    description: 'En preparación',
    icon: <Package className="h-4 w-4" />,
  },
  {
    status: 'enviado',
    label: 'Enviado',
    description: 'Pedido en camino',
    icon: <Truck className="h-4 w-4" />,
  },
  {
    status: 'entregado',
    label: 'Entregado',
    description: 'Pedido finalizado',
    icon: <CheckCircle className="h-4 w-4" />,
  },
];

const getOrderStepIndex = (estado: OrderStatus): number => {
  if (estado === 'cancelado') return -1;

  return orderFlowSteps.findIndex((step) => step.status === estado);
};

function OrderStatusTimeline({ estado }: { estado: OrderStatus }) {
  const currentStepIndex = getOrderStepIndex(estado);
  const isCancelled = estado === 'cancelado';

  if (isCancelled) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Estado del pedido</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-destructive">
            <XCircle className="mt-0.5 h-5 w-5" />
            <div>
              <p className="font-medium">Pedido cancelado</p>
              <p className="text-sm">
                Este pedido fue cancelado y ya no continuará con el flujo de atención.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Estado del pedido</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-5">
          {orderFlowSteps.map((step, index) => {
            const isCompleted = index < currentStepIndex;
            const isCurrent = index === currentStepIndex;
            const isPending = index > currentStepIndex;

            return (
              <div key={step.status} className="relative">
                {index < orderFlowSteps.length - 1 && (
                  <div
                    className={cn(
                      'absolute left-6 top-5 hidden h-0.5 w-full md:block',
                      isCompleted ? 'bg-primary' : 'bg-border',
                    )}
                  />
                )}

                <div className="relative z-10 flex gap-3 md:flex-col md:items-center md:text-center">
                  <div
                    className={cn(
                      'flex h-10 w-10 shrink-0 items-center justify-center rounded-full border bg-background',
                      isCompleted && 'border-primary bg-primary text-primary-foreground',
                      isCurrent && 'border-primary text-primary',
                      isPending && 'border-border text-muted-foreground',
                    )}
                  >
                    {isCompleted ? <CheckCircle className="h-4 w-4" /> : step.icon}
                  </div>

                  <div>
                    <p
                      className={cn(
                        'font-medium',
                        isPending && 'text-muted-foreground',
                        isCurrent && 'text-primary',
                      )}
                    >
                      {step.label}
                    </p>
                    <p className="text-xs text-muted-foreground">{step.description}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export default function PedidoDetallePage() {
  const params = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    async function loadOrder() {
      try {
        setIsLoading(true);
        setHasError(false);

        const data = await OrderService.getOrderDetail(params.id);
        setOrder(data);
      } catch (error) {
        console.error('Error al cargar detalle de pedido:', error);
        setHasError(true);
      } finally {
        setIsLoading(false);
      }
    }

    if (params.id) {
      loadOrder();
    }
  }, [params.id]);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 py-8">
        <div className="container mx-auto px-4">
          <div className="mb-6">
            <Link href="/mis-pedidos">
              <Button variant="ghost" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Volver a mis pedidos
              </Button>
            </Link>
          </div>

          {isLoading ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                Cargando detalle del pedido...
              </CardContent>
            </Card>
          ) : hasError || !order ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Package className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                <h1 className="text-xl font-semibold">Pedido no encontrado</h1>
                <p className="mt-2 text-muted-foreground">
                  No pudimos cargar el detalle de este pedido.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h1 className="font-serif text-3xl font-semibold text-foreground">
                    Pedido {order.codigo}
                  </h1>
                  <p className="mt-2 text-muted-foreground">
                    Detalle del pedido realizado
                  </p>
                </div>

                <Badge className={cn('w-fit capitalize', getOrderStatusColor(order.estado))}>
                  {statusIcons[order.estado]}
                  <span className="ml-1">{statusLabels[order.estado]}</span>
                </Badge>
              </div>

              <OrderStatusTimeline estado={order.estado} />

              <Card>
                <CardHeader>
                  <CardTitle>Información del pedido</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-lg bg-muted/40 p-4">
                    <p className="text-sm text-muted-foreground">Fecha</p>
                    <p className="mt-1 font-medium">
                      <Calendar className="mr-1 inline h-4 w-4" />
                      {new Date(order.createdAt).toLocaleDateString('es-PE', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>

                  <div className="rounded-lg bg-muted/40 p-4">
                    <p className="text-sm text-muted-foreground">Dirección de envío</p>
                    <p className="mt-1 font-medium">
                      <MapPin className="mr-1 inline h-4 w-4" />
                      {order.direccionEnvio}
                    </p>
                  </div>

                  <div className="rounded-lg bg-muted/40 p-4">
                    <p className="text-sm text-muted-foreground">Método de pago</p>
                    <p className="mt-1 font-medium">{order.metodoPago}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Productos del pedido</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {order.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex flex-col gap-4 rounded-lg border border-border p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <h3 className="font-medium">{item.producto.nombre}</h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Color: {item.colorSeleccionado.nombre} · Talla: {item.tallaSeleccionada}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Cantidad: {item.cantidad} × {formatPrice(item.precioUnitario)}
                        </p>
                      </div>

                      <p className="text-right font-semibold">
                        {formatPrice(item.cantidad * item.precioUnitario)}
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Resumen de pago</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{formatPrice(order.subtotal)}</span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Descuento</span>
                    <span>{formatPrice(order.descuento)}</span>
                  </div>

                  <div className="border-t border-border pt-3">
                    <div className="flex justify-between text-lg font-semibold">
                      <span>Total</span>
                      <span>{formatPrice(order.total)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}