"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  ShoppingBag,
  FileText,
  DollarSign,
  Package,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Calendar,
} from "lucide-react"
import { OrderService } from "@/features/orders/services/order.service"
import { QuotationService } from "@/features/quotations/services/quotation.service"
import { AdminService } from "@/features/admin/services/admin.service"
import { formatPrice } from "@/lib/mock-data"
import type { Order, Quotation, Producto, OrderStatus } from "@/lib/types"

// Stock total de un producto (variantes o campo plano) y umbral de stock bajo.
function getTotalStock(product: Producto): number {
  const variantes = (product as any).variantes || []
  if (variantes.length > 0) {
    return variantes.reduce((t: number, v: any) => t + (Number(v.stock) || 0), 0)
  }
  return (product as any).stock || 0
}

const ORDER_STATUS_META: Record<OrderStatus, { label: string; dot: string }> = {
  registrado: { label: "Registrado", dot: "bg-yellow-500" },
  confirmado: { label: "Confirmado", dot: "bg-blue-500" },
  en_proceso: { label: "En proceso", dot: "bg-indigo-500" },
  enviado: { label: "Enviado", dot: "bg-purple-500" },
  entregado: { label: "Entregado", dot: "bg-green-500" },
  cancelado: { label: "Cancelado", dot: "bg-red-500" },
}

function timeAgo(date: string | Date): string {
  const d = new Date(date).getTime()
  if (Number.isNaN(d)) return ""
  const diff = Date.now() - d
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "hace un momento"
  if (mins < 60) return `hace ${mins} min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `hace ${hours} h`
  const days = Math.floor(hours / 24)
  return `hace ${days} d`
}

export default function AdminDashboard() {
  const [orders, setOrders] = useState<Order[]>([])
  const [quotations, setQuotations] = useState<Quotation[]>([])
  const [products, setProducts] = useState<Producto[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    const load = async () => {
      setLoading(true)
      // Cada fuente falla de forma independiente para no tumbar el dashboard.
      const [ord, quo, prod] = await Promise.all([
        OrderService.getAllOrders().catch(() => [] as Order[]),
        QuotationService.getAllQuotations().catch(() => [] as Quotation[]),
        AdminService.getProducts().catch(() => [] as Producto[]),
      ])
      if (!active) return
      setOrders(ord)
      setQuotations(quo)
      setProducts(prod)
      setLoading(false)
    }
    load()
    return () => { active = false }
  }, [])

  const metrics = useMemo(() => {
    const notCancelled = orders.filter((o) => o.estado !== "cancelado")
    const revenue = notCancelled.reduce((sum, o) => sum + (Number(o.total) || 0), 0)
    const activeOrders = orders.filter((o) =>
      ["registrado", "confirmado", "en_proceso", "enviado"].includes(o.estado)
    ).length
    const pendingQuotations = quotations.filter((q) => q.estado === "pendiente")
    const activeProducts = products.filter(
      (p) => (p as any).esActivo === true || (p as any).estado === "ACTIVO" || (p as any).estado === "activo"
    ).length
    const lowStock = products.filter((p) => {
      const total = getTotalStock(p)
      return total > 0 && total < 20
    })

    const byStatus = orders.reduce<Record<string, number>>((acc, o) => {
      acc[o.estado] = (acc[o.estado] || 0) + 1
      return acc
    }, {})

    const recentOrders = [...orders]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5)

    return { revenue, activeOrders, pendingQuotations, activeProducts, lowStock, byStatus, recentOrders }
  }, [orders, quotations, products])

  const stats = [
    {
      title: "Ingresos registrados",
      value: formatPrice(metrics.revenue),
      hint: `${orders.filter((o) => o.estado !== "cancelado").length} pedidos`,
      icon: DollarSign,
      color: "text-green-600",
      bg: "bg-green-100",
    },
    {
      title: "Pedidos activos",
      value: String(metrics.activeOrders),
      hint: "en curso",
      icon: ShoppingBag,
      color: "text-blue-600",
      bg: "bg-blue-100",
    },
    {
      title: "Cotizaciones pendientes",
      value: String(metrics.pendingQuotations.length),
      hint: "por responder",
      icon: FileText,
      color: "text-amber-600",
      bg: "bg-amber-100",
    },
    {
      title: "Productos activos",
      value: String(metrics.activeProducts),
      hint: `${products.length} en total`,
      icon: Package,
      color: "text-indigo-600",
      bg: "bg-indigo-100",
    },
  ]

  const statusOrder: OrderStatus[] = ["registrado", "confirmado", "en_proceso", "enviado", "entregado"]

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-primary md:text-3xl">Panel de control</h1>
          <p className="text-muted-foreground">Resumen en tiempo real de la operación</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          {new Date().toLocaleDateString("es-PE", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="mt-1 font-mono text-2xl font-bold">{loading ? "—" : stat.value}</p>
                  <p className="mt-2 text-xs text-muted-foreground">{stat.hint}</p>
                </div>
                <div className={`rounded-xl p-3 ${stat.bg}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent Orders */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-accent" />
                Pedidos recientes
              </CardTitle>
              <CardDescription>Últimos pedidos recibidos</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin/pedidos">Ver todos<ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="py-8 text-center text-sm text-muted-foreground">Cargando pedidos…</p>
            ) : metrics.recentOrders.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">Aún no hay pedidos registrados.</p>
            ) : (
              <div className="space-y-3">
                {metrics.recentOrders.map((order) => {
                  const meta = ORDER_STATUS_META[order.estado]
                  return (
                    <div key={order.id} className="flex items-center justify-between rounded-lg bg-muted/50 p-3 transition-colors hover:bg-muted">
                      <div className="flex items-center gap-3">
                        <span className={`h-2 w-2 rounded-full ${meta?.dot ?? "bg-muted-foreground"}`} />
                        <div>
                          <p className="font-mono text-sm font-medium">{order.codigo}</p>
                          <p className="text-sm text-muted-foreground">
                            {order.cliente.nombres} {order.cliente.apellidos}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-mono font-semibold">{formatPrice(order.total)}</p>
                        <p className="text-xs text-muted-foreground">{meta?.label} · {timeAgo(order.createdAt)}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending Quotations */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-accent" />
                Cotizaciones
              </CardTitle>
              <CardDescription>Pendientes de respuesta</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin/cotizaciones">Ver<ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="py-8 text-center text-sm text-muted-foreground">Cargando…</p>
            ) : metrics.pendingQuotations.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                <CheckCircle2 className="mx-auto mb-2 h-10 w-10 opacity-40" />
                <p className="text-sm">Sin cotizaciones pendientes.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {metrics.pendingQuotations.slice(0, 5).map((q) => (
                  <Link
                    key={q.id}
                    href={`/admin/cotizaciones?id=${q.id}`}
                    className="block rounded-lg border p-3 transition-colors hover:border-accent/50"
                  >
                    <div className="mb-1 flex items-start justify-between gap-2">
                      <p className="font-mono text-sm font-medium">{q.codigo}</p>
                      <Badge variant="secondary" className="text-xs">{q.cantidad} uds</Badge>
                    </div>
                    <p className="truncate text-sm text-muted-foreground">{q.producto.nombre}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {q.cliente.nombres} {q.cliente.apellidos} · {timeAgo(q.createdAt)}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Low stock (real) */}
        <Card className={metrics.lowStock.length > 0 ? "border-amber-200 bg-amber-50/40" : undefined}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-700">
              <AlertCircle className="h-5 w-5" />
              Stock bajo
            </CardTitle>
            <CardDescription>Productos con menos de 20 unidades</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="py-6 text-center text-sm text-muted-foreground">Cargando…</p>
            ) : metrics.lowStock.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">Todo el inventario está por encima del umbral.</p>
            ) : (
              <div className="space-y-3">
                {metrics.lowStock.slice(0, 5).map((p) => (
                  <div key={p.idProducto} className="flex items-center justify-between">
                    <p className="truncate pr-3 text-sm font-medium">{p.nombre}</p>
                    <span className="shrink-0 font-mono text-sm font-semibold text-amber-700">{getTotalStock(p)} uds</span>
                  </div>
                ))}
                <Button variant="outline" className="mt-2 w-full" asChild>
                  <Link href="/admin/productos"><Package className="mr-2 h-4 w-4" />Gestionar inventario</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Order status distribution (real) */}
        <Card>
          <CardHeader>
            <CardTitle>Estado de pedidos</CardTitle>
            <CardDescription>Distribución de todos los pedidos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {statusOrder.map((s) => (
                <div key={s} className="rounded-lg border bg-muted/30 p-4 text-center">
                  <p className="font-mono text-2xl font-bold">{loading ? "—" : metrics.byStatus[s] || 0}</p>
                  <p className="mt-1 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                    <span className={`h-1.5 w-1.5 rounded-full ${ORDER_STATUS_META[s].dot}`} />
                    {ORDER_STATUS_META[s].label}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
