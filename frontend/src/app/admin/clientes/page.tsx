"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
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
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Search,
  MoreHorizontal,
  Eye,
  Mail,
  Phone,
  ShoppingBag,
  Building2,
  User,
  Users,
  Calendar,
  DollarSign,
  Download,
  UserX,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Package,
  Truck,
  Clock,
  ArrowLeft
} from "lucide-react"

interface Client {
  id: string
  name: string
  email: string
  phone: string
  type: "individual" | "business"
  company?: string
  ruc?: string
  totalOrders: number
  totalSpent: number
  lastOrder: string
  createdAt: string
  status: "active" | "inactive"
  hasPendingOrders?: boolean
  deactivationRequest?: boolean
}

interface Order {
  id: string
  codigo: string
  fecha: string
  estado: "pendiente" | "confirmado" | "en_produccion" | "enviado" | "entregado" | "cancelado"
  total: number
  items: number
  productos: string[]
}

const mockOrders: Record<string, Order[]> = {
  "CLI-001": [
    { id: "ord-1", codigo: "PED-2024-0045", fecha: "2024-01-15", estado: "entregado", total: 450, items: 3, productos: ["Polo Premium Blanco", "Polo Basico Negro"] },
    { id: "ord-2", codigo: "PED-2024-0032", fecha: "2024-01-08", estado: "entregado", total: 320, items: 2, productos: ["Polera Cuello V"] },
    { id: "ord-3", codigo: "PED-2024-0018", fecha: "2023-12-20", estado: "entregado", total: 480, items: 4, productos: ["Polo Premium", "Polo Basico"] },
  ],
  "CLI-002": [
    { id: "ord-4", codigo: "PED-2024-0048", fecha: "2024-01-14", estado: "en_produccion", total: 2500, items: 50, productos: ["Polo Corporativo Tech Solutions"] },
    { id: "ord-5", codigo: "PED-2024-0041", fecha: "2024-01-10", estado: "entregado", total: 3200, items: 60, productos: ["Polo Corporativo Tech Solutions"] },
    { id: "ord-6", codigo: "PED-2024-0028", fecha: "2024-01-02", estado: "entregado", total: 4800, items: 100, productos: ["Camiseta Evento", "Polo Promocional"] },
  ],
  "CLI-003": [
    { id: "ord-7", codigo: "PED-2024-0039", fecha: "2024-01-10", estado: "enviado", total: 1800, items: 30, productos: ["Polo Uniforme Restaurant"] },
    { id: "ord-8", codigo: "PED-2024-0022", fecha: "2023-12-28", estado: "entregado", total: 2400, items: 40, productos: ["Polo Uniforme Restaurant"] },
  ],
  "CLI-004": [
    { id: "ord-9", codigo: "PED-2024-0035", fecha: "2024-01-08", estado: "entregado", total: 280, items: 2, productos: ["Polo Casual"] },
    { id: "ord-10", codigo: "PED-2023-0412", fecha: "2023-11-15", estado: "entregado", total: 370, items: 3, productos: ["Polera Basica", "Polo Premium"] },
  ],
  "CLI-005": [
    { id: "ord-11", codigo: "PED-2024-0030", fecha: "2024-01-05", estado: "pendiente", total: 8500, items: 150, productos: ["Polo Escolar San Martin"] },
    { id: "ord-12", codigo: "PED-2023-0380", fecha: "2023-09-01", estado: "entregado", total: 14000, items: 280, productos: ["Polo Escolar San Martin", "Polera Escolar"] },
  ],
  "CLI-006": [
    { id: "ord-13", codigo: "PED-2023-0398", fecha: "2023-12-20", estado: "entregado", total: 180, items: 1, productos: ["Polo Basico"] },
  ],
}

const clients: Client[] = [
  {
    id: "CLI-001",
    name: "Maria Garcia",
    email: "maria@email.com",
    phone: "+51 999 888 777",
    type: "individual",
    totalOrders: 5,
    totalSpent: 1250,
    lastOrder: "2024-01-15",
    createdAt: "2023-06-15",
    status: "active"
  },
  {
    id: "CLI-002",
    name: "Carlos Lopez",
    email: "carlos@techsolutions.pe",
    phone: "+51 987 654 321",
    type: "business",
    company: "Tech Solutions SAC",
    ruc: "20456789012",
    totalOrders: 12,
    totalSpent: 15800,
    lastOrder: "2024-01-14",
    createdAt: "2023-03-20",
    status: "active",
    hasPendingOrders: true
  },
  {
    id: "CLI-003",
    name: "Rosa Martinez",
    email: "rosa@restaurantlima.pe",
    phone: "+51 912 345 678",
    type: "business",
    company: "Restaurant Lima SAC",
    ruc: "20123456789",
    totalOrders: 8,
    totalSpent: 8500,
    lastOrder: "2024-01-10",
    createdAt: "2023-08-10",
    status: "active",
    hasPendingOrders: true
  },
  {
    id: "CLI-004",
    name: "Pedro Ramirez",
    email: "pedro@email.com",
    phone: "+51 945 678 123",
    type: "individual",
    totalOrders: 3,
    totalSpent: 650,
    lastOrder: "2024-01-08",
    createdAt: "2023-11-05",
    status: "active"
  },
  {
    id: "CLI-005",
    name: "Ana Fernandez",
    email: "ana@colegiosanmartin.edu.pe",
    phone: "+51 998 765 432",
    type: "business",
    company: "Colegio San Martin",
    ruc: "20987654321",
    totalOrders: 4,
    totalSpent: 22500,
    lastOrder: "2024-01-05",
    createdAt: "2023-02-15",
    status: "active",
    hasPendingOrders: true,
    deactivationRequest: true
  },
  {
    id: "CLI-006",
    name: "Luis Vargas",
    email: "luis@email.com",
    phone: "+51 955 123 456",
    type: "individual",
    totalOrders: 1,
    totalSpent: 180,
    lastOrder: "2023-12-20",
    createdAt: "2023-12-20",
    status: "inactive"
  },
]

const estadoConfig = {
  pendiente: { label: "Pendiente", color: "bg-yellow-100 text-yellow-700", icon: Clock },
  confirmado: { label: "Confirmado", color: "bg-blue-100 text-blue-700", icon: CheckCircle2 },
  en_produccion: { label: "En Produccion", color: "bg-purple-100 text-purple-700", icon: Package },
  enviado: { label: "Enviado", color: "bg-indigo-100 text-indigo-700", icon: Truck },
  entregado: { label: "Entregado", color: "bg-green-100 text-green-700", icon: CheckCircle2 },
  cancelado: { label: "Cancelado", color: "bg-red-100 text-red-700", icon: XCircle },
}

export default function AdminClientsPage() {
  const [clientsList, setClientsList] = useState(clients)
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [viewMode, setViewMode] = useState<"profile" | "orders">("profile")
  const [clientToDeactivate, setClientToDeactivate] = useState<Client | null>(null)
  const [deactivationError, setDeactivationError] = useState<string | null>(null)

  const filteredClients = clientsList.filter(client => {
    const matchesSearch = 
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.company?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesType = typeFilter === "all" || client.type === typeFilter
    const matchesStatus = statusFilter === "all" || client.status === statusFilter

    return matchesSearch && matchesType && matchesStatus
  })

  const totalClients = clientsList.length
  const businessClients = clientsList.filter(c => c.type === "business").length
  const totalRevenue = clientsList.reduce((sum, c) => sum + c.totalSpent, 0)
  const pendingDeactivations = clientsList.filter(c => c.deactivationRequest).length

  const handleViewOrders = (client: Client) => {
    setSelectedClient(client)
    setViewMode("orders")
  }

  const handleViewProfile = (client: Client) => {
    setSelectedClient(client)
    setViewMode("profile")
  }

  const handleDeactivateAccount = (client: Client) => {
    setDeactivationError(null)
    
    // Check for pending orders
    const clientOrders = mockOrders[client.id] || []
    const hasPendingOrders = clientOrders.some(order => 
      ["pendiente", "confirmado", "en_produccion", "enviado"].includes(order.estado)
    )
    
    if (hasPendingOrders) {
      setDeactivationError("No se puede desactivar esta cuenta porque tiene pedidos en proceso. Espere a que todos los pedidos sean entregados o cancelados.")
      setClientToDeactivate(client)
      return
    }
    
    setClientToDeactivate(client)
  }

  const confirmDeactivation = () => {
    if (clientToDeactivate && !deactivationError) {
      setClientsList(clientsList.map(c => 
        c.id === clientToDeactivate.id 
          ? { ...c, status: "inactive" as const, deactivationRequest: false }
          : c
      ))
      setClientToDeactivate(null)
      setSelectedClient(null)
    }
  }

  const handleReactivateAccount = (client: Client) => {
    setClientsList(clientsList.map(c => 
      c.id === client.id 
        ? { ...c, status: "active" as const }
        : c
    ))
  }

  const clientOrders = selectedClient ? mockOrders[selectedClient.id] || [] : []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-primary">Gestion de Clientes</h1>
          <p className="text-muted-foreground">Administra la base de clientes</p>
        </div>
        <div className="flex gap-2">
          {pendingDeactivations > 0 && (
            <Badge variant="destructive" className="gap-1">
              <AlertTriangle className="w-3 h-3" />
              {pendingDeactivations} solicitud(es) de desactivacion
            </Badge>
          )}
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-muted rounded-lg">
                <Users className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Clientes</p>
                <p className="text-2xl font-bold">{totalClients}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Building2 className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Empresas</p>
                <p className="text-2xl font-bold text-blue-600">{businessClients}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <User className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Individuales</p>
                <p className="text-2xl font-bold text-purple-600">{totalClients - businessClients}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Ingresos Totales</p>
                <p className="text-2xl font-bold text-green-600">S/ {totalRevenue.toLocaleString()}</p>
              </div>
            </div>
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
                placeholder="Buscar por nombre, email o empresa..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="individual">Persona Natural</SelectItem>
                <SelectItem value="business">Empresa</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Activos</SelectItem>
                <SelectItem value="inactive">Inactivos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Clients Table */}
      <Card className="border-2">
        <CardContent className="pt-6">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-center">Pedidos</TableHead>
                  <TableHead className="text-right">Total Gastado</TableHead>
                  <TableHead>Ultimo Pedido</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.map((client) => (
                  <TableRow key={client.id} className={client.deactivationRequest ? "bg-amber-50" : ""}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            {client.name.split(" ").map(n => n[0]).join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{client.name}</p>
                            {client.deactivationRequest && (
                              <Badge variant="outline" className="text-amber-600 border-amber-300 text-xs">
                                Solicita desactivar
                              </Badge>
                            )}
                          </div>
                          {client.company && (
                            <p className="text-xs text-muted-foreground">{client.company}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="text-sm flex items-center gap-1">
                          <Mail className="w-3 h-3 text-muted-foreground" />
                          {client.email}
                        </p>
                        <p className="text-sm flex items-center gap-1">
                          <Phone className="w-3 h-3 text-muted-foreground" />
                          {client.phone}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={client.type === "business" ? "default" : "secondary"}>
                        {client.type === "business" ? "Empresa" : "Individual"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="font-semibold">{client.totalOrders}</span>
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      S/ {client.totalSpent.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(client.lastOrder).toLocaleDateString("es-PE")}
                    </TableCell>
                    <TableCell>
                      <Badge variant={client.status === "active" ? "default" : "secondary"}>
                        {client.status === "active" ? "Activo" : "Inactivo"}
                      </Badge>
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
                          <DropdownMenuItem onClick={() => handleViewProfile(client)}>
                            <Eye className="w-4 h-4 mr-2" />
                            Ver Perfil
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleViewOrders(client)}>
                            <ShoppingBag className="w-4 h-4 mr-2" />
                            Ver Pedidos
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Mail className="w-4 h-4 mr-2" />
                            Enviar Email
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {client.status === "active" ? (
                            <DropdownMenuItem 
                              onClick={() => handleDeactivateAccount(client)}
                              className="text-destructive focus:text-destructive"
                            >
                              <UserX className="w-4 h-4 mr-2" />
                              Desactivar Cuenta
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem 
                              onClick={() => handleReactivateAccount(client)}
                              className="text-green-600 focus:text-green-600"
                            >
                              <CheckCircle2 className="w-4 h-4 mr-2" />
                              Reactivar Cuenta
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

          {filteredClients.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-muted-foreground">No se encontraron clientes</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Client Detail Dialog */}
      <Dialog open={!!selectedClient} onOpenChange={() => setSelectedClient(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          {selectedClient && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {viewMode === "orders" && (
                      <Button variant="ghost" size="icon" onClick={() => setViewMode("profile")}>
                        <ArrowLeft className="w-4 h-4" />
                      </Button>
                    )}
                    <Avatar className="w-12 h-12">
                      <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                        {selectedClient.name.split(" ").map(n => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <DialogTitle>{selectedClient.name}</DialogTitle>
                      {selectedClient.company && (
                        <p className="text-sm text-muted-foreground">{selectedClient.company}</p>
                      )}
                    </div>
                  </div>
                  <Badge variant={selectedClient.status === "active" ? "default" : "secondary"}>
                    {selectedClient.status === "active" ? "Activo" : "Inactivo"}
                  </Badge>
                </div>
                <DialogDescription>
                  {viewMode === "profile" 
                    ? `Cliente desde ${new Date(selectedClient.createdAt).toLocaleDateString("es-PE", { year: "numeric", month: "long" })}`
                    : `Historial de pedidos (${clientOrders.length} pedidos)`
                  }
                </DialogDescription>
              </DialogHeader>

              {viewMode === "profile" ? (
                <div className="space-y-6 py-4">
                  {/* Deactivation request alert */}
                  {selectedClient.deactivationRequest && (
                    <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                      <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-medium text-amber-800">Solicitud de desactivacion pendiente</p>
                        <p className="text-sm text-amber-700">Este cliente ha solicitado desactivar su cuenta.</p>
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="border-amber-300 text-amber-700 hover:bg-amber-100"
                        onClick={() => handleDeactivateAccount(selectedClient)}
                      >
                        Procesar
                      </Button>
                    </div>
                  )}

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <ShoppingBag className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-2xl font-bold">{selectedClient.totalOrders}</p>
                      <p className="text-sm text-muted-foreground">Pedidos</p>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <DollarSign className="w-6 h-6 mx-auto mb-2 text-green-600" />
                      <p className="text-2xl font-bold text-green-600">S/ {selectedClient.totalSpent.toLocaleString()}</p>
                      <p className="text-sm text-green-600">Total Gastado</p>
                    </div>
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <Calendar className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-lg font-bold">{new Date(selectedClient.lastOrder).toLocaleDateString("es-PE")}</p>
                      <p className="text-sm text-muted-foreground">Ultimo Pedido</p>
                    </div>
                  </div>

                  <Separator />

                  {/* Contact Info */}
                  <div>
                    <h4 className="font-semibold mb-3">Informacion de Contacto</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                        <Mail className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Email</p>
                          <p className="font-medium">{selectedClient.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                        <Phone className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Telefono</p>
                          <p className="font-medium">{selectedClient.phone}</p>
                        </div>
                      </div>
                      {selectedClient.ruc && (
                        <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg col-span-2">
                          <Building2 className="w-5 h-5 text-muted-foreground" />
                          <div>
                            <p className="text-sm text-muted-foreground">RUC</p>
                            <p className="font-medium">{selectedClient.ruc}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 py-4">
                  {clientOrders.length === 0 ? (
                    <div className="text-center py-12">
                      <ShoppingBag className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                      <p className="text-muted-foreground">Este cliente no tiene pedidos</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {clientOrders.map((order) => {
                        const config = estadoConfig[order.estado]
                        const Icon = config.icon
                        return (
                          <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/30 transition-colors">
                            <div className="flex items-center gap-4">
                              <div className={`p-2 rounded-full ${config.color}`}>
                                <Icon className="w-4 h-4" />
                              </div>
                              <div>
                                <p className="font-medium">{order.codigo}</p>
                                <p className="text-sm text-muted-foreground">
                                  {new Date(order.fecha).toLocaleDateString("es-PE", { 
                                    year: "numeric", 
                                    month: "long", 
                                    day: "numeric" 
                                  })}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {order.productos.join(", ")}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <Badge className={config.color}>
                                {config.label}
                              </Badge>
                              <p className="font-semibold mt-1">S/ {order.total.toLocaleString()}</p>
                              <p className="text-xs text-muted-foreground">{order.items} items</p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}

              <DialogFooter className="gap-2">
                {viewMode === "profile" && (
                  <>
                    <Button variant="outline" onClick={() => setViewMode("orders")}>
                      <ShoppingBag className="w-4 h-4 mr-2" />
                      Ver Pedidos
                    </Button>
                    <Button variant="outline">
                      <Mail className="w-4 h-4 mr-2" />
                      Enviar Email
                    </Button>
                    {selectedClient.status === "active" ? (
                      <Button 
                        variant="destructive" 
                        onClick={() => handleDeactivateAccount(selectedClient)}
                      >
                        <UserX className="w-4 h-4 mr-2" />
                        Desactivar Cuenta
                      </Button>
                    ) : (
                      <Button 
                        onClick={() => handleReactivateAccount(selectedClient)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Reactivar Cuenta
                      </Button>
                    )}
                  </>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Deactivation Confirmation Dialog */}
      <AlertDialog open={!!clientToDeactivate} onOpenChange={() => { setClientToDeactivate(null); setDeactivationError(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              {deactivationError ? (
                <>
                  <XCircle className="w-5 h-5 text-destructive" />
                  No se puede desactivar la cuenta
                </>
              ) : (
                <>
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  Confirmar desactivacion
                </>
              )}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deactivationError ? (
                <div className="space-y-3">
                  <p>{deactivationError}</p>
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-sm text-amber-800">
                      El cliente <strong>{clientToDeactivate?.name}</strong> tiene pedidos activos que deben completarse antes de desactivar su cuenta.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <p>
                    Esta a punto de desactivar la cuenta de <strong>{clientToDeactivate?.name}</strong>. 
                    La cuenta quedara en estado inactivo y el cliente no podra acceder al sistema.
                  </p>
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm font-medium">Esta accion:</p>
                    <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                      <li>- Invalidara la sesion activa del cliente</li>
                      <li>- Mantendra todos los datos almacenados</li>
                      <li>- Puede ser revertida en cualquier momento</li>
                    </ul>
                  </div>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            {!deactivationError && (
              <AlertDialogAction 
                onClick={confirmDeactivation}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Desactivar Cuenta
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
