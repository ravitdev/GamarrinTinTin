'use client';

import { Settings, LogOut, Heart, Package, FileText } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function UserAccountScreen() {
  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-serif text-3xl font-semibold">Mi Cuenta</h1>
        <Button variant="ghost" className="gap-2 text-muted-foreground hover:text-foreground">
          <LogOut className="h-4 w-4" />
          Cerrar Sesión
        </Button>
      </div>

      {/* User Profile Header */}
      <div className="rounded-lg border border-border bg-card p-6 mb-8">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-accent/10 flex items-center justify-center">
            <span className="text-2xl font-semibold text-accent">JR</span>
          </div>
          <div className="flex-1">
            <h2 className="font-semibold text-foreground">Juan Rodriguez Mendoza</h2>
            <p className="text-sm text-muted-foreground">juan.rodriguez@example.com</p>
            <p className="text-sm text-muted-foreground">Cliente Premium</p>
          </div>
          <Link href="/mi-cuenta/editar">
            <Button variant="outline" className="gap-2">
              <Settings className="h-4 w-4" />
              Editar perfil
            </Button>
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="pedidos" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pedidos" className="gap-2">
            <Package className="h-4 w-4" />
            <span className="hidden sm:inline">Mis Pedidos</span>
          </TabsTrigger>
          <TabsTrigger value="cotizaciones" className="gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Cotizaciones</span>
          </TabsTrigger>
          <TabsTrigger value="favoritos" className="gap-2">
            <Heart className="h-4 w-4" />
            <span className="hidden sm:inline">Favoritos</span>
          </TabsTrigger>
        </TabsList>

        {/* Orders */}
        <TabsContent value="pedidos" className="space-y-4">
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="font-medium text-foreground">Pedido #ORD-2024-0015</p>
                <p className="text-sm text-muted-foreground">15 Enero, 2024</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-accent">S/ 850.00</p>
                <p className="text-sm text-green-600">Entregado</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-4">15x Polo Clásico Algodón - Blanco (M)</p>
            <Button variant="outline" size="sm">Ver Detalles</Button>
          </div>

          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="font-medium text-foreground">Pedido #ORD-2024-0014</p>
                <p className="text-sm text-muted-foreground">10 Enero, 2024</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-accent">S/ 320.00</p>
                <p className="text-sm text-blue-600">En tránsito</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-4">3x Polo Sport Dry-Fit - Rojo (L)</p>
            <Button variant="outline" size="sm">Ver Detalles</Button>
          </div>
        </TabsContent>

        {/* Quotations */}
        <TabsContent value="cotizaciones" className="space-y-4">
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="font-medium text-foreground">Cotización #COT-2024-0008</p>
                <p className="text-sm text-muted-foreground">12 Enero, 2024</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-accent">S/ 5,200.00</p>
                <p className="text-sm text-amber-600">En revisión</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-4">100x Poleras personalizadas - Borrador</p>
            <Button variant="outline" size="sm">Ver Detalles</Button>
          </div>

          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="font-medium text-foreground">Cotización #COT-2024-0007</p>
                <p className="text-sm text-muted-foreground">05 Enero, 2024</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-accent">S/ 3,500.00</p>
                <p className="text-sm text-green-600">Aprobada</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-4">50x Camisetas corporativas - Confirmada</p>
            <Button variant="outline" size="sm">Convertir a pedido</Button>
          </div>
        </TabsContent>

        {/* Favorites */}
        <TabsContent value="favoritos" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="rounded-lg border border-border bg-card overflow-hidden hover:border-accent/50 transition">
                <div className="aspect-square bg-muted" />
                <div className="p-4">
                  <p className="font-medium text-foreground">Polo Clásico Algodón</p>
                  <p className="text-sm text-muted-foreground mb-3">10+ colores disponibles</p>
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-accent">S/ 42.75</p>
                    <Button size="sm" variant="outline">
                      <Heart className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
