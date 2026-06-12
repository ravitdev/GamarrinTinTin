'use client';

import { BarChart3, Users, Package, DollarSign, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function AdminDashboardScreen() {
  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8">
      <h1 className="font-serif text-3xl font-semibold mb-8">Panel de Administración</h1>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-4 mb-8">
        {[
          { icon: DollarSign, label: 'Ingresos totales', value: 'S/ 156,420', change: '+12.5%' },
          { icon: Package, label: 'Productos', value: '1,245', change: '+45' },
          { icon: Users, label: 'Clientes', value: '3,892', change: '+128' },
          { icon: TrendingUp, label: 'Órdenes', value: '892', change: '+23.8%' },
        ].map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <div key={i} className="rounded-lg border border-border bg-card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{kpi.label}</p>
                  <p className="mt-2 text-2xl font-bold text-foreground">{kpi.value}</p>
                  <p className="mt-1 text-xs text-green-600">{kpi.change}</p>
                </div>
                <Icon className="h-8 w-8 text-accent/50" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Admin Tabs */}
      <Tabs defaultValue="productos" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="productos">Productos</TabsTrigger>
          <TabsTrigger value="ordenes">Órdenes</TabsTrigger>
          <TabsTrigger value="usuarios">Usuarios</TabsTrigger>
          <TabsTrigger value="reportes">Reportes</TabsTrigger>
        </TabsList>

        {/* Productos Tab */}
        <TabsContent value="productos" className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Gestión de Productos</h2>
            <Link href="/admin/productos/nuevo">
              <Button className="gap-2 bg-accent text-accent-foreground hover:bg-accent/90">
                <Package className="h-4 w-4" />
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
                  <th className="px-4 py-3 text-left text-sm font-medium">Precio</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {[1, 2, 3, 4, 5].map((i) => (
                  <tr key={i} className="border-t border-border hover:bg-muted/50">
                    <td className="px-4 py-3 text-sm">POLO-00{i}</td>
                    <td className="px-4 py-3 text-sm">Polo Clásico {i}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={i % 2 === 0 ? 'text-green-600' : 'text-amber-600'}>
                        {250 - i * 20} unidades
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium">S/ {(42.75 + i).toFixed(2)}</td>
                    <td className="px-4 py-3 text-sm">
                      <Button variant="outline" size="sm">Editar</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* Órdenes Tab */}
        <TabsContent value="ordenes" className="space-y-4">
          <h2 className="text-xl font-semibold mb-4">Gestión de Órdenes</h2>
          <div className="rounded-lg border border-border overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium">#Orden</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Cliente</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Monto</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Estado</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {[1, 2, 3, 4, 5].map((i) => (
                  <tr key={i} className="border-t border-border hover:bg-muted/50">
                    <td className="px-4 py-3 text-sm font-medium">ORD-2024-{1000 + i}</td>
                    <td className="px-4 py-3 text-sm">Cliente {i}</td>
                    <td className="px-4 py-3 text-sm">S/ {(500 + i * 100).toFixed(2)}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        i % 3 === 0 ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {i % 3 === 0 ? 'Entregado' : 'En tránsito'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">2024-01-{10 + i}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* Usuarios Tab */}
        <TabsContent value="usuarios" className="space-y-4">
          <h2 className="text-xl font-semibold mb-4">Gestión de Usuarios</h2>
          <div className="rounded-lg border border-border overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium">Nombre</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Email</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Rol</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Órdenes</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {[1, 2, 3, 4, 5].map((i) => (
                  <tr key={i} className="border-t border-border hover:bg-muted/50">
                    <td className="px-4 py-3 text-sm">Usuario {i}</td>
                    <td className="px-4 py-3 text-sm">user{i}@example.com</td>
                    <td className="px-4 py-3 text-sm">
                      <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700">
                        Cliente
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">{5 + i}</td>
                    <td className="px-4 py-3 text-sm">
                      <Button variant="outline" size="sm">Ver</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* Reportes Tab */}
        <TabsContent value="reportes" className="space-y-4">
          <h2 className="text-xl font-semibold mb-4">Reportes</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Link href="/admin/reportes/ventas">
              <div className="rounded-lg border border-border bg-card p-6 hover:border-accent/50 transition cursor-pointer">
                <BarChart3 className="h-8 w-8 text-accent mb-3" />
                <h3 className="font-medium">Reporte de Ventas</h3>
                <p className="text-sm text-muted-foreground mt-2">Análisis de ventas por período</p>
              </div>
            </Link>
            <Link href="/admin/reportes/inventario">
              <div className="rounded-lg border border-border bg-card p-6 hover:border-accent/50 transition cursor-pointer">
                <Package className="h-8 w-8 text-accent mb-3" />
                <h3 className="font-medium">Reporte de Inventario</h3>
                <p className="text-sm text-muted-foreground mt-2">Estado del stock de productos</p>
              </div>
            </Link>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
