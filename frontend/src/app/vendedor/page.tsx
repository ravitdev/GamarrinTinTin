"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  FileText,
  ShoppingBag,
  Clock,
  CheckCircle2,
  ArrowRight,
} from "lucide-react"
import { OrderService } from "@/features/orders/services/order.service"
import { QuotationService } from "@/features/quotations/services/quotation.service"
import { useAuth } from "@/features/auth/hooks/use-auth"
import { formatPrice } from "@/lib/mock-data"
import type { Order, Quotation, OrderStatus } from "@/lib/types"

const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  registrado: "Registrado",
  confirmado: "Confirmado",
  en_proceso: "En proceso",
  enviado: "Enviado",
  entregado: "Entregado",
  cancelado: "Cancelado",
}

function greeting(): string {
  const h = new Date().getHours()
  if (h < 12) return "Buenos días"
  if (h < 19) return "Buenas tardes"
  return "Buenas noches"
}

export default function VendedorDashboardPage() {
  const { user } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [quotations, setQuotations] = useState<Quotation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    const load = async () => {
      setLoading(true)
      const [ord, quo] = await Promise.all([
        OrderService.getAllOrders().catch(() => [] as Order[]),
        QuotationService.getAllQuotations().catch(() => [] as Quotation[]),
      ])
      if (!active) return
      setOrders(ord)
      setQuotations(quo)
      setLoading(false)
    }
    load()
    return () => { active = false }
  }, [])

  const metrics = useMemo(() => {
    const pending = quotations.filter((q) => q.estado === "pendiente")
    const quoted = quotations.filter((q) => q.estado === "cotizado")
    const toAttend = orders.filter((o) => o.estado === "registrado" || o.estado === "confirmado")
    const recentOrders = [...orders]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5)
    return { pending, quoted, toAttend, recentOrders }
  }, [orders, quotations])

  const firstName = user?.nombres?.split(" ")[0] ?? ""

  const stats = [
    { label: "Cotizaciones pendientes", value: metrics.pending.length, icon: Clock, tone: "amber" },
    { label: "Cotizaciones respondidas", value: metrics.quoted.length, icon: FileText, tone: "muted" },
    { label: "Pedidos por atender", value: metrics.toAttend.length, icon: ShoppingBag, tone: "muted" },
  ] as const

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="font-display text-2xl font-bold text-primary">
          {greeting()}{firstName ? `, ${firstName}` : ""}
        </h1>
        <p className="text-muted-foreground">Tus solicitudes y pedidos pendientes de un vistazo</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <Card key={s.label} className={s.tone === "amber" ? "border-amber-200 bg-amber-50/50" : undefined}>
            <CardContent className="pt-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className={`text-sm ${s.tone === "amber" ? "text-amber-700" : "text-muted-foreground"}`}>{s.label}</p>
                  <p className={`font-mono text-3xl font-bold ${s.tone === "amber" ? "text-amber-700" : ""}`}>
                    {loading ? "—" : s.value}
                  </p>
                </div>
                <div className={`rounded-lg p-2 ${s.tone === "amber" ? "bg-amber-100" : "bg-muted"}`}>
                  <s.icon className={`h-5 w-5 ${s.tone === "amber" ? "text-amber-600" : "text-muted-foreground"}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Pending Quotations */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Cotizaciones pendientes</CardTitle>
              <CardDescription>Solicitudes que requieren tu atención</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/vendedor/cotizaciones">Ver todas<ArrowRight className="ml-1 h-4 w-4" /></Link>
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="py-6 text-center text-sm text-muted-foreground">Cargando…</p>
            ) : metrics.pending.length === 0 ? (
              <div className="py-6 text-center text-muted-foreground">
                <CheckCircle2 className="mx-auto mb-2 h-10 w-10 opacity-40" />
                <p>No hay cotizaciones pendientes</p>
              </div>
            ) : (
              <div className="space-y-3">
                {metrics.pending.slice(0, 4).map((q) => (
                  <div key={q.id} className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{q.producto.nombre}</p>
                      <p className="text-sm text-muted-foreground">
                        {q.cliente.nombres} {q.cliente.apellidos} · {q.cantidad} uds
                      </p>
                    </div>
                    <Button size="sm" variant="outline" asChild>
                      <Link href={`/vendedor/cotizaciones?id=${q.id}`}>Cotizar</Link>
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Orders */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Pedidos recientes</CardTitle>
              <CardDescription>Últimos pedidos recibidos</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/vendedor/pedidos">Ver todos<ArrowRight className="ml-1 h-4 w-4" /></Link>
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="py-6 text-center text-sm text-muted-foreground">Cargando…</p>
            ) : metrics.recentOrders.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">Aún no hay pedidos.</p>
            ) : (
              <div className="space-y-3">
                {metrics.recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-mono font-medium">{order.codigo}</p>
                        <Badge variant="secondary" className="text-xs">{ORDER_STATUS_LABEL[order.estado]}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {order.cliente.nombres} · {formatPrice(order.total)}
                      </p>
                    </div>
                    <Button size="sm" variant="ghost" asChild>
                      <Link href={`/vendedor/pedidos?id=${order.id}`}><ArrowRight className="h-4 w-4" /></Link>
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
