"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  ShoppingBag,
  FileText,
  DollarSign,
  Users,
  TrendingUp,
  TrendingDown,
  Package,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Calendar
} from "lucide-react"
import Link from "next/link"

const stats = [
  {
    title: "Ventas del Mes",
    value: "S/ 45,231",
    change: "+12.5%",
    trend: "up",
    icon: DollarSign,
    color: "text-green-600",
    bgColor: "bg-green-100"
  },
  {
    title: "Pedidos Activos",
    value: "28",
    change: "+3",
    trend: "up",
    icon: ShoppingBag,
    color: "text-blue-600",
    bgColor: "bg-blue-100"
  },
  {
    title: "Cotizaciones Pendientes",
    value: "5",
    change: "-2",
    trend: "down",
    icon: FileText,
    color: "text-amber-600",
    bgColor: "bg-amber-100"
  },
  {
    title: "Clientes Nuevos",
    value: "12",
    change: "+8.2%",
    trend: "up",
    icon: Users,
    color: "text-purple-600",
    bgColor: "bg-purple-100"
  }
]

const recentOrders = [
  { id: "PED-2024-0127", customer: "Carlos Lopez", total: 1200, items: 10, status: "pendiente", date: "Hace 4 horas" },
  { id: "PED-2024-0126", customer: "Tech Solutions SAC", total: 3500, items: 50, status: "enviado", date: "Ayer" },
  { id: "PED-2024-0125", customer: "Ana Martinez", total: 180, items: 2, status: "entregado", date: "Ayer" },
  { id: "PED-2024-0124", customer: "Pedro Ramirez", total: 890, items: 8, status: "en_produccion", date: "Hace 2 dias" },
]

const pendingQuotations = [
  { id: "COT-2024-0045", customer: "Eventos Corp", items: 100, date: "Hace 1 hora", priority: "high" },
  { id: "COT-2024-0044", customer: "Restaurant Lima", items: 30, date: "Hace 3 horas", priority: "medium" },
  { id: "COT-2024-0043", customer: "Colegio San Martin", items: 200, date: "Ayer", priority: "high" },
  { id: "COT-2024-0042", customer: "Startup Tech", items: 25, date: "Hace 2 dias", priority: "low" },
]

const lowStockProducts = [
  { name: "Polo Clasico Blanco - M", stock: 3, minStock: 10 },
  { name: "Polera Basica Negra - L", stock: 5, minStock: 15 },
  { name: "Polo Premium Azul - XL", stock: 2, minStock: 8 },
]

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive"; color: string }> = {
  pendiente: { label: "Pendiente", variant: "secondary", color: "bg-yellow-500" },
  en_produccion: { label: "En Produccion", variant: "default", color: "bg-blue-500" },
  enviado: { label: "Enviado", variant: "outline", color: "bg-purple-500" },
  entregado: { label: "Entregado", variant: "secondary", color: "bg-green-500" },
}

const priorityConfig: Record<string, { label: string; color: string }> = {
  high: { label: "Alta", color: "text-red-600 bg-red-100" },
  medium: { label: "Media", color: "text-amber-600 bg-amber-100" },
  low: { label: "Baja", color: "text-green-600 bg-green-100" },
}

export default function AdminDashboard() {
  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl md:text-3xl font-bold text-primary">
            Bienvenido de vuelta
          </h1>
          <p className="text-muted-foreground">
            Aqui tienes un resumen de la actividad de hoy
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="w-4 h-4" />
          {new Date().toLocaleDateString("es-PE", { 
            weekday: "long", 
            year: "numeric", 
            month: "long", 
            day: "numeric" 
          })}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="border-2">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold mt-1">{stat.value}</p>
                  <div className="flex items-center gap-1 mt-2">
                    {stat.trend === "up" ? (
                      <TrendingUp className="w-4 h-4 text-green-600" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-600" />
                    )}
                    <span className={`text-sm font-medium ${
                      stat.trend === "up" ? "text-green-600" : "text-red-600"
                    }`}>
                      {stat.change}
                    </span>
                    <span className="text-xs text-muted-foreground">vs mes anterior</span>
                  </div>
                </div>
                <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <Card className="lg:col-span-2 border-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-accent" />
                Pedidos Recientes
              </CardTitle>
              <CardDescription>Ultimos pedidos recibidos</CardDescription>
            </div>
            <Button variant="ghost" asChild>
              <Link href="/admin/pedidos">
                Ver todos
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentOrders.map((order) => (
                <div 
                  key={order.id} 
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-2 h-2 rounded-full ${statusConfig[order.status].color}`} />
                    <div>
                      <p className="font-medium">{order.id}</p>
                      <p className="text-sm text-muted-foreground">{order.customer}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">S/ {order.total}</p>
                    <p className="text-xs text-muted-foreground">{order.items} items - {order.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Pending Quotations */}
        <Card className="border-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-accent" />
                Cotizaciones
              </CardTitle>
              <CardDescription>Pendientes de respuesta</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin/cotizaciones">
                Ver todas
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingQuotations.map((quote) => (
                <div 
                  key={quote.id} 
                  className="p-3 border rounded-lg hover:border-accent/50 transition-colors cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-2">
                    <p className="font-medium text-sm">{quote.id}</p>
                    <Badge className={`text-xs ${priorityConfig[quote.priority].color}`}>
                      {priorityConfig[quote.priority].label}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{quote.customer}</p>
                  <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                    <span>{quote.items} unidades</span>
                    <span>{quote.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Alert */}
        <Card className="border-2 border-amber-200 bg-amber-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-700">
              <AlertCircle className="w-5 h-5" />
              Alertas de Stock Bajo
            </CardTitle>
            <CardDescription>Productos que necesitan reabastecimiento</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {lowStockProducts.map((product, index) => (
                <div key={index}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium">{product.name}</p>
                    <span className="text-sm text-amber-700 font-semibold">
                      {product.stock} / {product.minStock}
                    </span>
                  </div>
                  <Progress 
                    value={(product.stock / product.minStock) * 100} 
                    className="h-2"
                  />
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-4">
              <Package className="w-4 h-4 mr-2" />
              Gestionar Inventario
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Order Status Summary */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle>Resumen de Estado de Pedidos</CardTitle>
          <CardDescription>Distribucion de pedidos activos por estado</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <Clock className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-yellow-700">8</p>
              <p className="text-sm text-yellow-600">Pendientes</p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <Package className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-blue-700">12</p>
              <p className="text-sm text-blue-600">En Produccion</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <ShoppingBag className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-purple-700">5</p>
              <p className="text-sm text-purple-600">Enviados</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <CheckCircle2 className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-green-700">156</p>
              <p className="text-sm text-green-600">Entregados (mes)</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
