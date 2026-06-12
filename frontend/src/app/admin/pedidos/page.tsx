"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Printer,
  Truck,
  CheckCircle,
  Package,
  Calendar,
  Download
} from "lucide-react"

const orders = [
  { 
    id: "PED-2024-0128", 
    customer: "Maria Garcia", 
    email: "maria@email.com",
    total: 450, 
    items: 3, 
    status: "en_produccion", 
    date: "2024-01-15",
    paymentStatus: "pagado",
    products: ["Polo Clasico x2", "Polera Premium x1"]
  },
  { 
    id: "PED-2024-0127", 
    customer: "Carlos Lopez", 
    email: "carlos@email.com",
    total: 1200, 
    items: 10, 
    status: "pendiente", 
    date: "2024-01-15",
    paymentStatus: "pendiente",
    products: ["Polo Premium x5", "Polo Clasico x5"]
  },
  { 
    id: "PED-2024-0126", 
    customer: "Tech Solutions SAC", 
    email: "compras@techsolutions.pe",
    total: 3500, 
    items: 50, 
    status: "enviado", 
    date: "2024-01-14",
    paymentStatus: "pagado",
    products: ["Polo Corporativo x50"]
  },
  { 
    id: "PED-2024-0125", 
    customer: "Ana Martinez", 
    email: "ana@email.com",
    total: 180, 
    items: 2, 
    status: "entregado", 
    date: "2024-01-14",
    paymentStatus: "pagado",
    products: ["Polera Basica x2"]
  },
  { 
    id: "PED-2024-0124", 
    customer: "Pedro Ramirez", 
    email: "pedro@email.com",
    total: 890, 
    items: 8, 
    status: "en_produccion", 
    date: "2024-01-13",
    paymentStatus: "pagado",
    products: ["Polo Premium x4", "Polera Basica x4"]
  },
  { 
    id: "PED-2024-0123", 
    customer: "Restaurant Lima SAC", 
    email: "admin@restaurantlima.pe",
    total: 2100, 
    items: 30, 
    status: "pendiente", 
    date: "2024-01-13",
    paymentStatus: "parcial",
    products: ["Polo Clasico x30"]
  },
  { 
    id: "PED-2024-0122", 
    customer: "Laura Fernandez", 
    email: "laura@email.com",
    total: 320, 
    items: 4, 
    status: "entregado", 
    date: "2024-01-12",
    paymentStatus: "pagado",
    products: ["Polo Clasico x2", "Polera Premium x2"]
  },
]

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive"; color: string }> = {
  pendiente: { label: "Pendiente", variant: "secondary", color: "bg-yellow-500" },
  en_produccion: { label: "En Produccion", variant: "default", color: "bg-blue-500" },
  enviado: { label: "Enviado", variant: "outline", color: "bg-purple-500" },
  entregado: { label: "Entregado", variant: "secondary", color: "bg-green-500" },
}

const paymentStatusConfig: Record<string, { label: string; color: string }> = {
  pagado: { label: "Pagado", color: "text-green-600 bg-green-100" },
  pendiente: { label: "Pendiente", color: "text-red-600 bg-red-100" },
  parcial: { label: "Parcial", color: "text-amber-600 bg-amber-100" },
}

export default function AdminOrdersPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedOrder, setSelectedOrder] = useState<typeof orders[0] | null>(null)

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.email.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === "all" || order.status === statusFilter

    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-primary">Gestion de Pedidos</h1>
          <p className="text-muted-foreground">Administra y da seguimiento a los pedidos</p>
        </div>
        <Button>
          <Download className="w-4 h-4 mr-2" />
          Exportar
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Total Pedidos</p>
            <p className="text-2xl font-bold">{orders.length}</p>
          </CardContent>
        </Card>
        <Card className="border-yellow-200 bg-yellow-50/50">
          <CardContent className="pt-4">
            <p className="text-sm text-yellow-700">Pendientes</p>
            <p className="text-2xl font-bold text-yellow-700">
              {orders.filter(o => o.status === "pendiente").length}
            </p>
          </CardContent>
        </Card>
        <Card className="border-blue-200 bg-blue-50/50">
          <CardContent className="pt-4">
            <p className="text-sm text-blue-700">En Produccion</p>
            <p className="text-2xl font-bold text-blue-700">
              {orders.filter(o => o.status === "en_produccion").length}
            </p>
          </CardContent>
        </Card>
        <Card className="border-green-200 bg-green-50/50">
          <CardContent className="pt-4">
            <p className="text-sm text-green-700">Entregados</p>
            <p className="text-2xl font-bold text-green-700">
              {orders.filter(o => o.status === "entregado").length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por ID, cliente o email..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pendiente">Pendiente</SelectItem>
                <SelectItem value="en_produccion">En Produccion</SelectItem>
                <SelectItem value="enviado">Enviado</SelectItem>
                <SelectItem value="entregado">Entregado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card className="border-2">
        <CardContent className="pt-6">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pedido</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Productos</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Pago</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.id}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{order.customer}</p>
                        <p className="text-xs text-muted-foreground">{order.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm">{order.items} items</p>
                      <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                        {order.products.join(", ")}
                      </p>
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      S/ {order.total}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusConfig[order.status].variant}>
                        {statusConfig[order.status].label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={`${paymentStatusConfig[order.paymentStatus].color}`}>
                        {paymentStatusConfig[order.paymentStatus].label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(order.date).toLocaleDateString("es-PE")}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <Dialog>
                            <DialogTrigger asChild>
                              <DropdownMenuItem 
                                onSelect={(e) => {
                                  e.preventDefault()
                                  setSelectedOrder(order)
                                }}
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                Ver Detalles
                              </DropdownMenuItem>
                            </DialogTrigger>
                          </Dialog>
                          <DropdownMenuItem>
                            <Printer className="w-4 h-4 mr-2" />
                            Imprimir
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {order.status === "pendiente" && (
                            <DropdownMenuItem>
                              <Package className="w-4 h-4 mr-2" />
                              Iniciar Produccion
                            </DropdownMenuItem>
                          )}
                          {order.status === "en_produccion" && (
                            <DropdownMenuItem>
                              <Truck className="w-4 h-4 mr-2" />
                              Marcar como Enviado
                            </DropdownMenuItem>
                          )}
                          {order.status === "enviado" && (
                            <DropdownMenuItem>
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Marcar como Entregado
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredOrders.length === 0 && (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-muted-foreground">No se encontraron pedidos</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Order Detail Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-2xl">
          {selectedOrder && (
            <>
              <DialogHeader>
                <DialogTitle>Detalle del Pedido {selectedOrder.id}</DialogTitle>
                <DialogDescription>
                  Creado el {new Date(selectedOrder.date).toLocaleDateString("es-PE")}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Cliente</p>
                    <p className="font-medium">{selectedOrder.customer}</p>
                    <p className="text-sm text-muted-foreground">{selectedOrder.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Estado</p>
                    <Badge variant={statusConfig[selectedOrder.status].variant} className="mt-1">
                      {statusConfig[selectedOrder.status].label}
                    </Badge>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-2">Productos</p>
                  <div className="space-y-2">
                    {selectedOrder.products.map((product, index) => (
                      <div key={index} className="flex justify-between p-3 bg-muted/50 rounded-lg">
                        <span>{product}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between items-center p-4 bg-primary/5 rounded-lg">
                  <span className="font-medium">Total del Pedido</span>
                  <span className="text-2xl font-bold">S/ {selectedOrder.total}</span>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setSelectedOrder(null)}>
                  Cerrar
                </Button>
                <Button>
                  <Printer className="w-4 h-4 mr-2" />
                  Imprimir
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
