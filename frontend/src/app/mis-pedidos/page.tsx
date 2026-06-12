'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Package, 
  ChevronRight, 
  Search,
  Filter,
  Calendar,
  Truck,
  CheckCircle,
  Clock,
  XCircle,
  ArrowRight
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
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { formatPrice, getOrderStatusColor } from '@/lib/mock-data';
import { OrderService } from '@/features/orders/services/order.service';
import type { OrderStatus, Order } from '@/lib/types';
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

export default function MisPedidosPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    OrderService.getMyOrders()
      .then(setOrders)
      .finally(() => setIsLoading(false));
  }, []);

  const filteredOrders = orders.filter((order) => {
    const matchesSearch = 
      order.codigo.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.estado === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 py-8">
        <div className="container mx-auto px-4">
          <div className="mb-8">
            <h1 className="font-serif text-3xl font-semibold text-foreground">
              Mis Pedidos
            </h1>
            <p className="mt-2 text-muted-foreground">
              Revisa el estado de tus pedidos y su historial
            </p>
          </div>

          {/* Filters */}
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por codigo de pedido..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select 
              value={statusFilter} 
              onValueChange={(v) => setStatusFilter(v as OrderStatus | 'all')}
            >
              <SelectTrigger className="w-[180px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="registrado">Registrado</SelectItem>
                <SelectItem value="confirmado">Confirmado</SelectItem>
                <SelectItem value="en_proceso">En Proceso</SelectItem>
                <SelectItem value="enviado">Enviado</SelectItem>
                <SelectItem value="entregado">Entregado</SelectItem>
                <SelectItem value="cancelado">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Orders List */}
          {filteredOrders.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-muted/30 py-16 text-center">
              <Package className="mx-auto h-12 w-12 text-muted-foreground" />
              <h2 className="mt-4 text-lg font-medium text-foreground">No tienes pedidos</h2>
              <p className="mt-2 text-muted-foreground">
                {searchQuery || statusFilter !== 'all' 
                  ? 'No se encontraron pedidos con los filtros seleccionados'
                  : 'Cuando realices una compra, podras ver tus pedidos aqui'}
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
              {filteredOrders.map((order) => (
                <Link 
                  key={order.id} 
                  href={`/mis-pedidos/${order.id}`}
                  className="block"
                >
                  <div className="rounded-xl border border-border bg-card p-6 transition-all hover:border-accent/50 hover:shadow-md">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent/10">
                          <Package className="h-6 w-6 text-accent" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-foreground">{order.codigo}</h3>
                            <Badge className={cn('capitalize', getOrderStatusColor(order.estado))}>
                              {statusIcons[order.estado]}
                              <span className="ml-1">{statusLabels[order.estado]}</span>
                            </Badge>
                          </div>
                          <p className="mt-1 text-sm text-muted-foreground">
                            <Calendar className="mr-1 inline h-3 w-3" />
                            {new Date(order.createdAt).toLocaleDateString('es-PE', { 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            })}
                          </p>
                          <p className="mt-1 text-sm text-muted-foreground truncate max-w-xs">
                            {order.direccionEnvio}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between sm:flex-col sm:items-end sm:justify-center gap-2">
                        <div className="text-right">
                          <p className="text-lg font-semibold text-foreground">
                            {formatPrice(order.total)}
                          </p>
                          {order.descuento > 0 && (
                            <p className="text-xs text-accent">
                              Ahorraste {formatPrice(order.descuento)}
                            </p>
                          )}
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </div>

                    {/* Progress bar for active orders */}
                    {['registrado', 'confirmado', 'en_proceso', 'enviado'].includes(order.estado) && (
                      <div className="mt-4 pt-4 border-t border-border">
                        <div className="flex justify-between mb-2">
                          {['registrado', 'confirmado', 'en_proceso', 'enviado', 'entregado'].map((status, index) => {
                            const statuses: OrderStatus[] = ['registrado', 'confirmado', 'en_proceso', 'enviado', 'entregado'];
                            const currentIndex = statuses.indexOf(order.estado);
                            const isCompleted = index <= currentIndex;
                            const isCurrent = index === currentIndex;
                            
                            return (
                              <div key={status} className="flex flex-col items-center">
                                <div className={cn(
                                  'flex h-6 w-6 items-center justify-center rounded-full text-xs',
                                  isCompleted 
                                    ? 'bg-accent text-accent-foreground' 
                                    : 'bg-muted text-muted-foreground'
                                )}>
                                  {isCompleted ? <CheckCircle className="h-4 w-4" /> : index + 1}
                                </div>
                                <span className={cn(
                                  'mt-1 text-[10px] hidden sm:block',
                                  isCurrent ? 'text-accent font-medium' : 'text-muted-foreground'
                                )}>
                                  {statusLabels[status as OrderStatus]}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                        <div className="relative h-1 rounded-full bg-muted">
                          <div 
                            className="absolute left-0 top-0 h-full rounded-full bg-accent transition-all"
                            style={{ 
                              width: `${(['registrado', 'confirmado', 'en_proceso', 'enviado', 'entregado'].indexOf(order.estado) / 4) * 100}%` 
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
