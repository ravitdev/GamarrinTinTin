"use client"

import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  FileText,
  ShoppingBag,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  TrendingUp
} from "lucide-react"
import { mockQuotations, mockOrders, formatPrice } from "@/lib/mock-data"

export default function VendedorDashboardPage() {
  // Stats
  const pendingQuotations = mockQuotations.filter(q => q.estado === 'pendiente').length
  const quotedQuotations = mockQuotations.filter(q => q.estado === 'cotizado').length
  const recentOrders = mockOrders.filter(o => o.estado === 'registrado' || o.estado === 'confirmado').length
  
  // Calculate today's sales (mock)
  const todaySales = mockOrders
    .filter(o => o.estado !== 'cancelado')
    .slice(0, 3)
    .reduce((sum, o) => sum + o.total, 0)

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="font-serif text-2xl font-bold text-primary">Buenos dias, Maria</h1>
        <p className="text-muted-foreground">Aqui tienes un resumen de tus actividades pendientes</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-amber-200 bg-amber-50/50">
          <CardContent className="pt-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-amber-700">Cotizaciones Pendientes</p>
                <p className="text-3xl font-bold text-amber-700">{pendingQuotations}</p>
              </div>
              <div className="p-2 bg-amber-100 rounded-lg">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Cotizaciones Enviadas</p>
                <p className="text-3xl font-bold">{quotedQuotations}</p>
              </div>
              <div className="p-2 bg-muted rounded-lg">
                <FileText className="w-5 h-5 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pedidos por Atender</p>
                <p className="text-3xl font-bold">{recentOrders}</p>
              </div>
              <div className="p-2 bg-muted rounded-lg">
                <ShoppingBag className="w-5 h-5 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-green-50/50 border-green-200">
          <CardContent className="pt-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-green-700">Ventas del Dia</p>
                <p className="text-3xl font-bold text-green-700">{formatPrice(todaySales)}</p>
              </div>
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Pending Quotations */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Cotizaciones Pendientes</CardTitle>
              <CardDescription>Solicitudes que requieren tu atencion</CardDescription>
            </div>
            <Link href="/vendedor/cotizaciones">
              <Button variant="ghost" size="sm">
                Ver Todas <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mockQuotations.filter(q => q.estado === 'pendiente').slice(0, 4).map((quotation) => (
                <div 
                  key={quotation.id} 
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{quotation.producto.nombre}</p>
                    <p className="text-sm text-muted-foreground">
                      {quotation.cliente.nombres} {quotation.cliente.apellidos} - {quotation.cantidad} uds
                    </p>
                  </div>
                  <Link href={`/vendedor/cotizaciones?id=${quotation.id}`}>
                    <Button size="sm" variant="outline">
                      Cotizar
                    </Button>
                  </Link>
                </div>
              ))}

              {pendingQuotations === 0 && (
                <div className="text-center py-6 text-muted-foreground">
                  <CheckCircle2 className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p>No hay cotizaciones pendientes</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Orders */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Pedidos Recientes</CardTitle>
              <CardDescription>Ultimos pedidos recibidos</CardDescription>
            </div>
            <Button variant="ghost" asChild>
              <Link href="/vendedor/pedidos">
                Ver todos
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mockOrders.slice(0, 4).map((order) => (
                <div 
                  key={order.id} 
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{order.codigo}</p>
                      <Badge variant={
                        order.estado === 'registrado' ? 'secondary' :
                        order.estado === 'confirmado' ? 'default' :
                        order.estado === 'enviado' ? 'outline' : 'secondary'
                      } className="text-xs">
                        {order.estado}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {order.cliente.nombres} - {formatPrice(order.total)}
                    </p>
                  </div>
                  <Link href={`/vendedor/pedidos?id=${order.id}`}>
                    <Button size="sm" variant="ghost">
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      
    </div>
  )
}
