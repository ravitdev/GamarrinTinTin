"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Search,
  Eye,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  XCircle,
  User,
  MapPin,
  CreditCard
} from "lucide-react"
import { mockOrders, formatPrice } from "@/lib/mock-data"
import type { Order, OrderStatus } from "@/lib/types"

const statusConfig: Record<OrderStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: typeof Clock; nextStatus?: OrderStatus }> = {
  registrado: { label: "Registrado", variant: "secondary", icon: Clock, nextStatus: 'confirmado' },
  confirmado: { label: "Confirmado", variant: "default", icon: CheckCircle2, nextStatus: 'en_proceso' },
  en_proceso: { label: "En Proceso", variant: "default", icon: Package, nextStatus: 'enviado' },
  enviado: { label: "Enviado", variant: "outline", icon: Truck, nextStatus: 'entregado' },
  entregado: { label: "Entregado", variant: "default", icon: CheckCircle2 },
  cancelado: { label: "Cancelado", variant: "destructive", icon: XCircle },
}

export default function VendedorPedidosPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState<string>("todos")
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  const filteredOrders = mockOrders.filter(order => {
    const matchesSearch = 
      order.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.cliente.nombres.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesTab = activeTab === "todos" || order.estado === activeTab

    return matchesSearch && matchesTab
  })

  const pendingCount = mockOrders.filter(o => o.estado === 'registrado' || o.estado === 'confirmado').length

  const handleUpdateStatus = (order: Order, newStatus: OrderStatus) => {
    const index = mockOrders.findIndex(o => o.id === order.id)
    if (index !== -1) {
      mockOrders[index] = {
        ...mockOrders[index],
        estado: newStatus,
        updatedAt: new Date()
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-serif text-2xl font-bold text-primary">Gestion de Pedidos</h1>
        <p className="text-muted-foreground">Visualiza y gestiona los pedidos de los clientes</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Registrados</p>
            <p className="text-2xl font-bold">{mockOrders.filter(o => o.estado === 'registrado').length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Confirmados</p>
            <p className="text-2xl font-bold">{mockOrders.filter(o => o.estado === 'confirmado').length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">En Proceso</p>
            <p className="text-2xl font-bold">{mockOrders.filter(o => o.estado === 'en_proceso').length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Enviados</p>
            <p className="text-2xl font-bold">{mockOrders.filter(o => o.estado === 'enviado').length}</p>
          </CardContent>
        </Card>
        <Card className="bg-green-50/50 border-green-200">
          <CardContent className="pt-4">
            <p className="text-sm text-green-700">Entregados</p>
            <p className="text-2xl font-bold text-green-700">{mockOrders.filter(o => o.estado === 'entregado').length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por codigo o cliente..."
          className="pl-10"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex-wrap">
          <TabsTrigger value="todos">Todos</TabsTrigger>
          <TabsTrigger value="registrado" className="gap-2">
            Registrados
            {mockOrders.filter(o => o.estado === 'registrado').length > 0 && (
              <Badge variant="secondary" className="ml-1">{mockOrders.filter(o => o.estado === 'registrado').length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="confirmado">Confirmados</TabsTrigger>
          <TabsTrigger value="en_proceso">En Proceso</TabsTrigger>
          <TabsTrigger value="enviado">Enviados</TabsTrigger>
          <TabsTrigger value="entregado">Entregados</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Codigo</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => {
                    const status = statusConfig[order.estado]
                    const StatusIcon = status.icon

                    return (
                      <TableRow key={order.id}>
                        <TableCell className="font-mono font-medium">
                          {order.codigo}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{order.cliente.nombres} {order.cliente.apellidos}</p>
                            <p className="text-xs text-muted-foreground">{order.cliente.celular}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{order.items.length} productos</Badge>
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatPrice(order.total)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={status.variant} className="gap-1">
                            <StatusIcon className="w-3 h-3" />
                            {status.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(order.createdAt).toLocaleDateString('es-PE', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            timeZone: 'UTC'
                          })}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedOrder(order)
                              setIsDetailOpen(true)
                            }}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Ver
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>

              {filteredOrders.length === 0 && (
                <div className="text-center py-12">
                  <Package className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                  <p className="text-muted-foreground">No hay pedidos en esta categoria</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedOrder && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <span>Pedido {selectedOrder.codigo}</span>
                  <Badge variant={statusConfig[selectedOrder.estado].variant}>
                    {statusConfig[selectedOrder.estado].label}
                  </Badge>
                </DialogTitle>
                <DialogDescription>
                  Creado el {new Date(selectedOrder.createdAt).toLocaleDateString('es-PE', {
                    day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC'
                  })}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 py-4">
                {/* Client Info */}
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <h4 className="font-medium">Datos del Cliente</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Nombre</p>
                      <p className="font-medium">{selectedOrder.cliente.nombres} {selectedOrder.cliente.apellidos}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Telefono</p>
                      <p className="font-medium">{selectedOrder.cliente.celular}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Email</p>
                      <p className="font-medium">{selectedOrder.cliente.correo}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Documento</p>
                      <p className="font-medium">{selectedOrder.cliente.tipoDocumento}: {selectedOrder.cliente.documento}</p>
                    </div>
                  </div>
                </div>

                {/* Shipping */}
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <h4 className="font-medium">Direccion de Envio</h4>
                  </div>
                  <p className="text-sm">{selectedOrder.direccionEnvio}</p>
                </div>

                {/* Payment */}
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <CreditCard className="w-4 h-4 text-muted-foreground" />
                    <h4 className="font-medium">Metodo de Pago</h4>
                  </div>
                  <Badge variant="outline" className="capitalize">{selectedOrder.metodoPago}</Badge>
                </div>

                {/* Items */}
                <div>
                  <h4 className="font-medium mb-3">Productos ({selectedOrder.items.length})</h4>
                  <div className="border rounded-lg divide-y">
                    {selectedOrder.items.map((item) => (
                      <div key={item.id} className="flex items-center gap-4 p-4">
                        <div
                          className="w-12 h-12 rounded-lg border"
                          style={{ backgroundColor: item.colorSeleccionado.hexCode }}
                        />
                        <div className="flex-1">
                          <p className="font-medium">{item.producto.nombre}</p>
                          <p className="text-sm text-muted-foreground">
                            {item.colorSeleccionado.nombre} - Talla {item.tallaSeleccionada} - x{item.cantidad}
                          </p>
                        </div>
                        <p className="font-semibold">{formatPrice(item.precioUnitario * item.cantidad)}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Totals */}
                <div className="p-4 border-2 border-primary/20 rounded-lg space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>{formatPrice(selectedOrder.subtotal)}</span>
                  </div>
                  {selectedOrder.descuento > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Descuento</span>
                      <span>-{formatPrice(selectedOrder.descuento)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-lg pt-2 border-t">
                    <span>Total</span>
                    <span>{formatPrice(selectedOrder.total)}</span>
                  </div>
                </div>

                {/* Status Update */}
                {selectedOrder.estado !== 'entregado' && selectedOrder.estado !== 'cancelado' && (
                  <div className="p-4 bg-accent/10 border border-accent/30 rounded-lg">
                    <h4 className="font-medium mb-3">Actualizar Estado</h4>
                    <div className="flex items-center gap-3">
                      <Select
                        defaultValue={selectedOrder.estado}
                        onValueChange={(value) => {
                          handleUpdateStatus(selectedOrder, value as OrderStatus)
                          setSelectedOrder({ ...selectedOrder, estado: value as OrderStatus })
                        }}
                      >
                        <SelectTrigger className="w-[200px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="registrado">Registrado</SelectItem>
                          <SelectItem value="confirmado">Confirmado</SelectItem>
                          <SelectItem value="en_proceso">En Proceso</SelectItem>
                          <SelectItem value="enviado">Enviado</SelectItem>
                          <SelectItem value="entregado">Entregado</SelectItem>
                          <SelectItem value="cancelado">Cancelado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDetailOpen(false)}>
                  Cerrar
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
