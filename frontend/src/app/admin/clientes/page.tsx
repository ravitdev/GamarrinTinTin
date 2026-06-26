"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
  Edit,
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
import { AdminService } from "@/features/admin/services/admin.service"
import {
  UserService,
  type DocumentChangeRequest,
  type UserProfile,
} from "@/features/user/services/user.service"
import { toast } from "@/hooks/use-toast"

interface Client {
  id: string
  nombres: string
  apellidos: string
  name: string
  email: string
  phone: string
  direccion: string | null
  tipoDocumento: "DNI" | "RUC"
  numeroDocumento: string
  type: "individual" | "business"
  company?: string
  ruc?: string
  totalOrders: number
  totalSpent: number
  lastOrder: string
  createdAt: string
  status: "active" | "inactive"
  orders: Order[]
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

interface EditClientForm {
  nombres: string
  apellidos: string
  email: string
  telefono: string
  direccion: string
}

const estadoConfig = {
  pendiente: { label: "Pendiente", color: "bg-yellow-100 text-yellow-700", icon: Clock },
  confirmado: { label: "Confirmado", color: "bg-blue-100 text-blue-700", icon: CheckCircle2 },
  en_produccion: { label: "En Produccion", color: "bg-purple-100 text-purple-700", icon: Package },
  enviado: { label: "Enviado", color: "bg-indigo-100 text-indigo-700", icon: Truck },
  entregado: { label: "Entregado", color: "bg-green-100 text-green-700", icon: CheckCircle2 },
  cancelado: { label: "Cancelado", color: "bg-red-100 text-red-700", icon: XCircle },
}

function mapBackendOrderStatus(
  estado: string,
): Order["estado"] {
  const estados: Record<string, Order["estado"]> = {
    REGISTRADO: "pendiente",
    CONFIRMADO: "confirmado",
    PROCESANDO: "en_produccion",
    ENVIADO: "enviado",
    ENTREGADO: "entregado",
    CANCELADO: "cancelado",
  }

  return estados[estado] ?? "pendiente"
}

function mapProfileToClient(
  profile: UserProfile,
  deactivationRequest = false,
): Client {
  const orders: Order[] = (profile.pedidos ?? []).map((pedido) => ({
    id: String(pedido.idPedido),
    codigo: pedido.codigo,
    fecha: pedido.fecha,
    estado: mapBackendOrderStatus(pedido.estado),
    total: pedido.total,
    items: pedido.items,
    productos: pedido.productos,
  }))

  return {
    id: String(profile.idUsuario),
    nombres: profile.nombres,
    apellidos: profile.apellidos,
    name: `${profile.nombres} ${profile.apellidos}`,
    email: profile.email,
    phone: profile.telefono,
    direccion: profile.direccion,
    tipoDocumento: profile.tipoDocumento,
    numeroDocumento: profile.numeroDocumento,
    type: profile.tipoDocumento === "RUC" ? "business" : "individual",
    company: profile.tipoDocumento === "RUC" ? `${profile.nombres} ${profile.apellidos}` : undefined,
    ruc: profile.tipoDocumento === "RUC" ? profile.numeroDocumento : undefined,
    totalOrders: profile.totalPedidos ?? orders.length,
    totalSpent: profile.totalGastado ?? orders.reduce((total, order) => total + order.total, 0),
    lastOrder: profile.fechaUltimoPedido ?? orders[0]?.fecha ?? profile.fechaRegistro,
    createdAt: profile.fechaRegistro,
    status: profile.estado === "ACTIVO" ? "active" : "inactive",
    orders,
    hasPendingOrders: profile.puedeDesactivarse === false,
    deactivationRequest,
  }
}

export default function AdminClientsPage() {
  const [clientsList, setClientsList] = useState<Client[]>([])
  const [isLoadingClients, setIsLoadingClients] = useState(true)
  const [pendingDeactivationMap, setPendingDeactivationMap] = useState<Record<string, number>>({})
  const [pendingDocumentRequests, setPendingDocumentRequests] = useState<DocumentChangeRequest[]>([])
  const [isApprovingDocumentRequest, setIsApprovingDocumentRequest] = useState<number | null>(null)
  const [isRejectingDocumentRequest, setIsRejectingDocumentRequest] = useState<number | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [viewMode, setViewMode] = useState<"profile" | "orders">("profile")
  const [clientToDeactivate, setClientToDeactivate] = useState<Client | null>(null)
  const [deactivationError, setDeactivationError] = useState<string | null>(null)
  const [isProcessingDeactivation, setIsProcessingDeactivation] = useState(false)
  const [clientToEdit, setClientToEdit] = useState<Client | null>(null)
  const [editClientForm, setEditClientForm] = useState<EditClientForm>({
    nombres: "",
    apellidos: "",
    email: "",
    telefono: "",
    direccion: "",
  })
  const [editClientErrors, setEditClientErrors] = useState<Record<string, string>>({})
  const [isSavingClientEdit, setIsSavingClientEdit] = useState(false)

  useEffect(() => {
    const loadClients = async () => {
      setIsLoadingClients(true)
      try {
        const [profiles, pendingRequests, documentRequests] = await Promise.all([
          AdminService.getClients(),
          AdminService.getPendingDeactivationRequests(),
          AdminService.getPendingDocumentRequests(),
        ])

        const pendingMap: Record<string, number> = {}
        pendingRequests.forEach((request) => {
          pendingMap[String(request.idUsuario)] = request.idSolicitud
        })
        setPendingDeactivationMap(pendingMap)

        setPendingDocumentRequests(
          documentRequests.filter((request) => request.rol === "CLIENTE"),
        )

        setClientsList(
          profiles.map((profile) =>
            mapProfileToClient(profile, Boolean(pendingMap[String(profile.idUsuario)])),
          ),
        )
      } catch (error) {
        toast({
          title: "Error al cargar clientes",
          description: error instanceof Error ? error.message : "Intenta nuevamente.",
          variant: "destructive",
        })
      } finally {
        setIsLoadingClients(false)
      }
    }

    loadClients()
  }, [])

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
  const pendingDocumentChanges = pendingDocumentRequests.length

  const handleViewOrders = (client: Client) => {
    setSelectedClient(client)
    setViewMode("orders")
  }

  const handleViewProfile = (client: Client) => {
    setSelectedClient(client)
    setViewMode("profile")
  }

  const handleOpenEditClient = (client: Client) => {
    setClientToEdit(client)
    setEditClientForm({
      nombres: client.nombres,
      apellidos: client.apellidos,
      email: client.email,
      telefono: client.phone,
      direccion: client.direccion ?? "",
    })
    setEditClientErrors({})
  }

  const handleCloseEditClient = () => {
    setClientToEdit(null)
    setEditClientErrors({})
  }

  const handleSaveEditClient = async () => {
    if (!clientToEdit) return

    setIsSavingClientEdit(true)
    setEditClientErrors({})

    try {
      const nextErrors: Record<string, string> = {}
      const telefonoNormalizado = editClientForm.telefono.replace(/\D/g, "")

      if (!editClientForm.nombres.trim()) {
        nextErrors.nombres = "Los nombres son obligatorios."
      }

      if (!editClientForm.apellidos.trim()) {
        nextErrors.apellidos = "Los apellidos son obligatorios."
      }

      if (telefonoNormalizado.length !== 9) {
        nextErrors.telefono = "El teléfono debe tener 9 dígitos."
      } else if (!telefonoNormalizado.startsWith("9")) {
        nextErrors.telefono = "El teléfono debe empezar con 9."
      }

      if (Object.keys(nextErrors).length > 0) {
        setEditClientErrors(nextErrors)
        return
      }

      const updated = await AdminService.updateUser(Number(clientToEdit.id), {
        nombres: editClientForm.nombres.trim(),
        apellidos: editClientForm.apellidos.trim(),
        email: editClientForm.email.trim(),
        telefono: telefonoNormalizado,
        direccion: editClientForm.direccion.trim() || null,
      })

      const mapped = mapProfileToClient(
        updated,
        Boolean(pendingDeactivationMap[String(updated.idUsuario)]),
      )

      setClientsList((prev) =>
        prev.map((client) =>
          client.id === clientToEdit.id
            ? mapped
            : client,
        ),
      )

      setSelectedClient((prev) =>
        prev?.id === clientToEdit.id ? mapped : prev,
      )

      setClientToEdit(null)

      toast({
        title: "Cliente actualizado",
        description: "Los datos del cliente fueron actualizados correctamente.",
      })
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Revisa los datos ingresados."

      const normalizedMessage = message.toLowerCase()

      if (normalizedMessage.includes("nombre")) {
        setEditClientErrors((prev) => ({
          ...prev,
          nombres: message,
        }))
      }

      if (normalizedMessage.includes("apellido")) {
        setEditClientErrors((prev) => ({
          ...prev,
          apellidos: message,
        }))
      }

      if (normalizedMessage.includes("email") || normalizedMessage.includes("correo")) {
        setEditClientErrors((prev) => ({
          ...prev,
          email: message,
        }))
      }

      if (
        normalizedMessage.includes("teléfono") ||
        normalizedMessage.includes("telefono") ||
        normalizedMessage.includes("celular")
      ) {
        setEditClientErrors((prev) => ({
          ...prev,
          telefono: message,
        }))
      }

      toast({
        title: "Error al actualizar cliente",
        description: message,
        variant: "destructive",
      })
    } finally {
      setIsSavingClientEdit(false)
    }
  }

  const handleApproveDocumentRequest = async (request: DocumentChangeRequest) => {
    setIsApprovingDocumentRequest(request.idSolicitud)

    try {
      const updated = await AdminService.approveDocumentRequest(request.idSolicitud)
      const mapped = mapProfileToClient(
        updated,
        Boolean(pendingDeactivationMap[String(updated.idUsuario)]),
      )

      setClientsList((prev) =>
        prev.map((client) =>
          client.id === String(updated.idUsuario)
            ? mapped
            : client,
        ),
      )

      setSelectedClient((prev) =>
        prev?.id === String(updated.idUsuario) ? mapped : prev,
      )

      setPendingDocumentRequests((prev) =>
        prev.filter((item) => item.idSolicitud !== request.idSolicitud),
      )

      toast({
        title: "Solicitud aprobada",
        description: "El documento del cliente fue actualizado correctamente.",
      })
    } catch (error) {
      toast({
        title: "No se pudo aprobar la solicitud",
        description: error instanceof Error ? error.message : "Intenta nuevamente.",
        variant: "destructive",
      })
    } finally {
      setIsApprovingDocumentRequest(null)
    }
  }

  const handleRejectDocumentRequest = async (request: DocumentChangeRequest) => {
    setIsRejectingDocumentRequest(request.idSolicitud)

    try {
      await AdminService.rejectDocumentRequest(request.idSolicitud)

      setPendingDocumentRequests((prev) =>
        prev.filter((item) => item.idSolicitud !== request.idSolicitud),
      )

      toast({
        title: "Solicitud rechazada",
        description: "La solicitud de cambio de documento fue rechazada correctamente.",
      })
    } catch (error) {
      toast({
        title: "No se pudo rechazar la solicitud",
        description: error instanceof Error ? error.message : "Intenta nuevamente.",
        variant: "destructive",
      })
    } finally {
      setIsRejectingDocumentRequest(null)
    }
  }

  const handleDeactivateAccount = async (client: Client) => {
    setDeactivationError(null)

    try {
      const validation = await UserService.canDeactivateUser(Number(client.id))
      if (!validation.puede) {
        setDeactivationError(
          validation.motivo ??
            "No se puede desactivar esta cuenta porque tiene pedidos en proceso.",
        )
        setClientToDeactivate(client)
        return
      }
    } catch {
      if (client.hasPendingOrders) {
        setDeactivationError(
          "No se puede desactivar esta cuenta porque tiene pedidos en proceso. Espere a que todos los pedidos sean entregados o cancelados.",
        )
        setClientToDeactivate(client)
        return
      }
    }

    setClientToDeactivate(client)
  }

  const confirmDeactivation = async () => {
    if (!clientToDeactivate || deactivationError) return

    setIsProcessingDeactivation(true)
    try {
      const idSolicitud = pendingDeactivationMap[clientToDeactivate.id]
      await AdminService.deactivateUser(Number(clientToDeactivate.id), idSolicitud)
      setClientsList((prev) =>
        prev.map((c) =>
          c.id === clientToDeactivate.id
            ? { ...c, status: "inactive" as const, deactivationRequest: false }
            : c,
        ),
      )
      setClientToDeactivate(null)
      setSelectedClient(null)
      toast({
        title: "Cuenta desactivada",
        description: "La cuenta del cliente fue desactivada correctamente.",
      })
    } catch (error) {
      toast({
        title: "No se pudo desactivar",
        description: error instanceof Error ? error.message : "Intenta nuevamente.",
        variant: "destructive",
      })
    } finally {
      setIsProcessingDeactivation(false)
    }
  }

  const handleReactivateAccount = async (client: Client) => {
    try {
      await AdminService.reactivateUser(Number(client.id))

      setClientsList((prev) =>
        prev.map((c) =>
          c.id === client.id
            ? { ...c, status: "active" as const }
            : c,
        ),
      )

      setSelectedClient((prev) =>
        prev?.id === client.id
          ? { ...prev, status: "active" as const }
          : prev,
      )

      toast({
        title: "Cuenta reactivada",
        description: "La cuenta del cliente fue reactivada correctamente.",
      })
    } catch (error) {
      toast({
        title: "No se pudo reactivar",
        description: error instanceof Error ? error.message : "Intenta nuevamente.",
        variant: "destructive",
      })
    }
  }

  const clientOrders = selectedClient?.orders ?? []

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

      {/* Document Change Requests */}
      {pendingDocumentChanges > 0 && (
        <Card className="border-amber-200 bg-amber-50/40">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h3 className="font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                  Solicitudes de cambio de documento
                </h3>
                <p className="text-sm text-muted-foreground">
                  Revisa y aprueba las solicitudes de cambio de DNI/RUC enviadas por clientes.
                </p>
              </div>
              <Badge variant="outline" className="border-amber-300 text-amber-700">
                {pendingDocumentChanges} pendiente{pendingDocumentChanges === 1 ? "" : "s"}
              </Badge>
            </div>

            <div className="space-y-3">
              {pendingDocumentRequests.map((request) => (
                <div
                  key={request.idSolicitud}
                  className="flex flex-col gap-3 rounded-lg border bg-background p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="space-y-1">
                    <p className="font-medium">
                      {request.nombres} {request.apellidos}
                    </p>
                    <p className="text-sm text-muted-foreground">{request.email}</p>
                    <div className="flex flex-wrap gap-2 text-sm">
                      <Badge variant="secondary">
                        Actual: {request.tipoDocumentoActual} {request.numeroDocumentoActual}
                      </Badge>
                      <Badge variant="outline">
                        Nuevo: {request.tipoDocumentoNuevo} {request.numeroDocumentoNuevo}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Solicitud enviada el{" "}
                      {new Date(request.fechaSolicitud).toLocaleDateString("es-PE", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => handleRejectDocumentRequest(request)}
                      disabled={
                        isRejectingDocumentRequest === request.idSolicitud ||
                        isApprovingDocumentRequest === request.idSolicitud
                      }
                    >
                      {isRejectingDocumentRequest === request.idSolicitud
                        ? "Rechazando..."
                        : "Rechazar"}
                    </Button>

                    <Button
                      onClick={() => handleApproveDocumentRequest(request)}
                      disabled={
                        isApprovingDocumentRequest === request.idSolicitud ||
                        isRejectingDocumentRequest === request.idSolicitud
                      }
                    >
                      {isApprovingDocumentRequest === request.idSolicitud
                        ? "Aprobando..."
                        : "Aprobar"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

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
                            {pendingDocumentRequests.some((request) => String(request.idUsuario) === client.id) && (
                              <Badge variant="outline" className="text-blue-600 border-blue-300 text-xs">
                                Solicita documento
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
                          <DropdownMenuItem onClick={() => handleOpenEditClient(client)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Editar Cliente
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
                    <Button variant="outline" onClick={() => handleOpenEditClient(selectedClient)}>
                      <Edit className="w-4 h-4 mr-2" />
                      Editar Cliente
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

      {/* Edit Client Dialog */}
      <Dialog open={!!clientToEdit} onOpenChange={(open) => {
        if (!open) handleCloseEditClient()
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Modificar datos del cliente</DialogTitle>
            <DialogDescription>
              Actualiza los datos básicos del cliente. El documento solo puede modificarse mediante solicitud aprobada.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edit-client-nombres">Nombres</Label>
                <Input
                  id="edit-client-nombres"
                  value={editClientForm.nombres}
                  onChange={(e) => {
                    setEditClientForm({ ...editClientForm, nombres: e.target.value })
                    if (editClientErrors.nombres) {
                      setEditClientErrors((prev) => ({ ...prev, nombres: "" }))
                    }
                  }}
                  className={editClientErrors.nombres ? "border-destructive" : ""}
                />
                {editClientErrors.nombres && (
                  <p className="text-xs text-destructive">{editClientErrors.nombres}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-client-apellidos">Apellidos</Label>
                <Input
                  id="edit-client-apellidos"
                  value={editClientForm.apellidos}
                  onChange={(e) => {
                    setEditClientForm({ ...editClientForm, apellidos: e.target.value })
                    if (editClientErrors.apellidos) {
                      setEditClientErrors((prev) => ({ ...prev, apellidos: "" }))
                    }
                  }}
                  className={editClientErrors.apellidos ? "border-destructive" : ""}
                />
                {editClientErrors.apellidos && (
                  <p className="text-xs text-destructive">{editClientErrors.apellidos}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-client-email">Correo</Label>
              <Input
                id="edit-client-email"
                type="email"
                value={editClientForm.email}
                onChange={(e) => {
                  setEditClientForm({ ...editClientForm, email: e.target.value })
                  if (editClientErrors.email) {
                    setEditClientErrors((prev) => ({ ...prev, email: "" }))
                  }
                }}
                className={editClientErrors.email ? "border-destructive" : ""}
              />
              {editClientErrors.email && (
                <p className="text-xs text-destructive">{editClientErrors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-client-telefono">Celular</Label>
              <Input
                id="edit-client-telefono"
                value={editClientForm.telefono}
                type="tel"
                maxLength={9}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "").slice(0, 9)
                  setEditClientForm({ ...editClientForm, telefono: value })
                  if (editClientErrors.telefono) {
                    setEditClientErrors((prev) => ({ ...prev, telefono: "" }))
                  }
                }}
                className={editClientErrors.telefono ? "border-destructive" : ""}
              />
              {editClientErrors.telefono && (
                <p className="text-xs text-destructive">{editClientErrors.telefono}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-client-direccion">Dirección</Label>
              <Input
                id="edit-client-direccion"
                value={editClientForm.direccion}
                onChange={(e) =>
                  setEditClientForm({ ...editClientForm, direccion: e.target.value })
                }
                placeholder="Opcional"
              />
            </div>

            {clientToEdit && (
              <div className="rounded-lg border bg-muted/40 p-3 text-sm text-muted-foreground">
                Documento actual:{" "}
                <strong>
                  {clientToEdit.tipoDocumento} {clientToEdit.numeroDocumento}
                </strong>
                <br />
                Para modificar este dato, el cliente debe solicitar el cambio y un administrador debe aprobarlo.
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseEditClient} disabled={isSavingClientEdit}>
              Cancelar
            </Button>
            <Button onClick={handleSaveEditClient} disabled={isSavingClientEdit}>
              {isSavingClientEdit ? "Guardando..." : "Guardar cambios"}
            </Button>
          </DialogFooter>
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
