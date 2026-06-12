'use client';

import { Store, TrendingUp, ShoppingCart, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function VendedorDashboardScreen() {
  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8">
      <h1 className="font-serif text-3xl font-semibold mb-8">Mi Tienda</h1>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-4 mb-8">
        {[
          { icon: TrendingUp, label: 'Ventas este mes', value: 'S/ 24,560', change: '+8.2%' },
          { icon: ShoppingCart, label: 'Órdenes pendientes', value: '12', change: '2 urgentes' },
          { icon: Store, label: 'Productos activos', value: '156', change: '+5 nuevos' },
          { icon: AlertCircle, label: 'Stock bajo', value: '8', change: 'Revisar' },
        ].map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <div key={i} className="rounded-lg border border-border bg-card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{kpi.label}</p>
                  <p className="mt-2 text-2xl font-bold text-foreground">{kpi.value}</p>
                  <p className={`mt-1 text-xs ${i === 3 ? 'text-amber-600' : 'text-green-600'}`}>
                    {kpi.change}
                  </p>
                </div>
                <Icon className={`h-8 w-8 ${i === 3 ? 'text-amber-500/50' : 'text-accent/50'}`} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Vendedor Tabs */}
      <Tabs defaultValue="ordenes" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="ordenes">Órdenes</TabsTrigger>
          <TabsTrigger value="productos">Mis Productos</TabsTrigger>
          <TabsTrigger value="cotizaciones">Cotizaciones</TabsTrigger>
          <TabsTrigger value="ventas">Ventas</TabsTrigger>
        </TabsList>

        {/* Órdenes Tab */}
        <TabsContent value="ordenes" className="space-y-4">
          <h2 className="text-xl font-semibold mb-4">Órdenes para procesar</h2>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-lg border border-border bg-card p-4 hover:border-accent/50 transition">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-medium text-foreground">Orden #ORD-2024-{5000 + i}</p>
                    <p className="text-sm text-muted-foreground">2024-01-{15 + i}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-accent">S/ {(800 + i * 150).toFixed(2)}</p>
                    <span className={`text-xs font-medium px-2 py-1 rounded ${
                      i === 1 ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {i === 1 ? 'Urgente' : 'Por procesar'}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  {25 * i}x Polo Clásico - {['Blanco', 'Azul', 'Rojo'][i - 1]} (M)
                </p>
                <div className="flex gap-2">
                  <Link href={`/vendedor/ordenes/${i}`}>
                    <Button size="sm" variant="outline">Ver detalles</Button>
                  </Link>
                  <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90">
                    Procesar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* Productos Tab */}
        <TabsContent value="productos" className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Mis productos</h2>
            <Link href="/vendedor/productos/nuevo">
              <Button className="gap-2 bg-accent text-accent-foreground hover:bg-accent/90">
                Nuevo producto
              </Button>
            </Link>
          </div>

          <div className="rounded-lg border border-border overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium">SKU</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Nombre</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Stock</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Vendidas</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Precio</th>
                </tr>
              </thead>
              <tbody>
                {[1, 2, 3, 4].map((i) => (
                  <tr key={i} className="border-t border-border hover:bg-muted/50">
                    <td className="px-4 py-3 text-sm">VPOLO-{i.toString().padStart(3, '0')}</td>
                    <td className="px-4 py-3 text-sm">Polo personalizado {i}</td>
                    <td className="px-4 py-3 text-sm">{100 - i * 10}</td>
                    <td className="px-4 py-3 text-sm">{25 * i}</td>
                    <td className="px-4 py-3 text-sm font-medium">S/ {(38.5 + i).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* Cotizaciones Tab */}
        <TabsContent value="cotizaciones" className="space-y-4">
          <h2 className="text-xl font-semibold mb-4">Cotizaciones solicitadas</h2>
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="rounded-lg border border-border bg-card p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-medium text-foreground">Cotización #COT-2024-{3000 + i}</p>
                    <p className="text-sm text-muted-foreground">Solicitada hace 2 días</p>
                  </div>
                  <span className={`text-xs font-medium px-2 py-1 rounded ${
                    i === 1 ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {i === 1 ? 'En revisión' : 'Pendiente de respuesta'}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  {150 * i}x Poleras corporativas + logo bordado
                </p>
                <Button size="sm" variant="outline">Responder cotización</Button>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* Ventas Tab */}
        <TabsContent value="ventas" className="space-y-4">
          <h2 className="text-xl font-semibold mb-4">Resumen de ventas</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-border bg-card p-6">
              <p className="text-sm text-muted-foreground mb-2">Ventas totales (este mes)</p>
              <p className="text-3xl font-bold text-foreground mb-2">S/ 24,560</p>
              <p className="text-xs text-green-600">↑ 8.2% respecto al mes anterior</p>
            </div>
            <div className="rounded-lg border border-border bg-card p-6">
              <p className="text-sm text-muted-foreground mb-2">Órdenes completadas</p>
              <p className="text-3xl font-bold text-foreground mb-2">47</p>
              <p className="text-xs text-muted-foreground">Tasa de entrega: 98.5%</p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
