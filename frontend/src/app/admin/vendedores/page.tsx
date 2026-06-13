"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Switch } from "@/components/ui/switch"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Search,
  Plus,
  MoreHorizontal,
  Edit,
  UserX,
  UserCheck,
  Eye,
  EyeOff,
  TrendingUp,
  ShoppingBag,
  FileText,
  DollarSign,
  Users,
  Filter,
  Mail,
  Phone,
  Lock,
  Loader2
} from "lucide-react"
import { formatPrice } from "@/lib/mock-data"
import { AdminService } from "@/features/admin/services/admin.service"
import type { UserProfile } from "@/features/user/services/user.service"
import { UserService } from "@/features/user/services/user.service"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { TipoDocumento } from "@/lib/types"

// ---------------------------------------------------------------------------
// Reglas de validación idénticas al Registro de Usuarios
// ---------------------------------------------------------------------------
const EMAIL_REGEX    = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CELULAR_DIGITOS_REGEX  = /^[0-9]{9}$/;
const DNI_REGEX      = /^[0-9]{8}$/;
const PASSWORD_REGEX = /^(?=.*[0-9]).{8,}$/; // min 8 chars + al menos 1 número

interface VendorMock {
  id: string;
  nombres: string;
  apellidos: string;
  correo: string;
  celular: string;
  documento: string;
  tipoDocumento: "DNI";
  rol: "vendedor";
  estado: "activo" | "inactivo";
  createdAt: Date;
  stats: {
    cotizacionesAtendidas: number;
    cotizacionesPendientes: number;
    pedidosGestionados: number;
    ventasTotales: number;
    tasaConversion: number;
  };
}

const emptyStats = {
  cotizacionesAtendidas: 0,
  cotizacionesPendientes: 0,
  pedidosGestionados: 0,
  ventasTotales: 0,
  tasaConversion: 0,
}

function mapProfileToVendor(profile: UserProfile): VendorMock {
  return {
    id: String(profile.idUsuario),
    nombres: profile.nombres,
    apellidos: profile.apellidos,
    correo: profile.email,
    celular: profile.telefono,
    documento: profile.numeroDocumento,
    tipoDocumento: "DNI",
    rol: "vendedor",
    estado: profile.estado === "ACTIVO" ? "activo" : "inactivo",
    createdAt: new Date(profile.fechaRegistro),
    stats: emptyStats,
  }
}

export default function AdminVendedoresPage() {
  const { toast } = useToast()
  const [vendors, setVendors] = useState<VendorMock[]>([])
  const [isLoadingVendors, setIsLoadingVendors] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [selectedVendor, setSelectedVendor] = useState<VendorMock | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isSavingEdit, setIsSavingEdit] = useState(false)
  const [editVendor, setEditVendor] = useState({
    nombres: "",
    apellidos: "",
    correo: "",
    celular: "",
    documento: "",
    direccion: "",
  })
  const [isAddingVendor, setIsAddingVendor] = useState(false)
  
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const [newVendor, setNewVendor] = useState({
    nombres: "",
    apellidos: "",
    correo: "",
    celular: "",
    documento: "",
    contrasena: "",
    confirmPassword: "",
  })

  const resetNewVendorForm = () => {
    setNewVendor({
      nombres: "",
      apellidos: "",
      correo: "",
      celular: "",
      documento: "",
      contrasena: "",
      confirmPassword: "",
    })
    setFieldErrors({})
    setShowPassword(false)
    setShowConfirmPassword(false)
  }

  const handleInputChange = (id: string, value: string) => {
    setNewVendor((prev) => ({ ...prev, [id]: value }))
    if (fieldErrors[id]) {
      setFieldErrors((prev) => ({ ...prev, [id]: "" }))
    }
  }

  useEffect(() => {
    const loadVendors = async () => {
      setIsLoadingVendors(true)
      try {
        const profiles = await AdminService.getVendedores()
        setVendors(profiles.map(mapProfileToVendor))
      } catch (error) {
        toast({
          title: "Error al cargar vendedores",
          description: error instanceof Error ? error.message : "Intenta nuevamente.",
          variant: "destructive",
        })
      } finally {
        setIsLoadingVendors(false)
      }
    }

    loadVendors()
  }, [toast])

  const openEditDialog = async (vendor: VendorMock) => {
    setSelectedVendor(vendor)
    try {
      const profile = await UserService.getUserById(Number(vendor.id))
      setEditVendor({
        nombres: profile.nombres,
        apellidos: profile.apellidos,
        correo: profile.email,
        celular: profile.telefono,
        documento: profile.numeroDocumento,
        direccion: profile.direccion,
      })
      setIsEditDialogOpen(true)
    } catch (error) {
      toast({
        title: "Error al cargar vendedor",
        description: error instanceof Error ? error.message : "Intenta nuevamente.",
        variant: "destructive",
      })
    }
  }

  const handleSaveEdit = async () => {
    if (!selectedVendor) return

    setIsSavingEdit(true)
    try {
      const updated = await AdminService.updateUser(Number(selectedVendor.id), {
        nombres: editVendor.nombres.trim(),
        apellidos: editVendor.apellidos.trim(),
        email: editVendor.correo.trim(),
        telefono: editVendor.celular.replace(/\D/g, ""),
        numeroDocumento: editVendor.documento.trim(),
        tipoDocumento: TipoDocumento.DNI,
        ...(editVendor.direccion.trim() ? { direccion: editVendor.direccion.trim() } : {}),
      })

      const mapped = mapProfileToVendor(updated)
      setVendors((prev) =>
        prev.map((vendor) =>
          vendor.id === selectedVendor.id
            ? { ...vendor, ...mapped, stats: vendor.stats }
            : vendor,
        ),
      )
      setIsEditDialogOpen(false)
      toast({
        title: "Vendedor actualizado",
        description: "Los datos del vendedor fueron actualizados correctamente.",
      })
    } catch (error) {
      toast({
        title: "Error al actualizar vendedor",
        description: error instanceof Error ? error.message : "Revisa los datos ingresados.",
        variant: "destructive",
      })
    } finally {
      setIsSavingEdit(false)
    }
  }

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}

    if (!newVendor.nombres.trim()) errors.nombres = "El nombre es obligatorio"
    if (!newVendor.apellidos.trim()) errors.apellidos = "Los apellidos son obligatorios"

    if (!newVendor.documento.trim()) {
      errors.documento = "El número de DNI es obligatorio"
    } else if (!DNI_REGEX.test(newVendor.documento)) {
      errors.documento = "El DNI debe tener exactamente 8 dígitos numéricos"
    }

    if (!newVendor.celular.trim()) {
      errors.celular = "El celular es obligatorio"
    } else if (!CELULAR_DIGITOS_REGEX.test(newVendor.celular)) {
      errors.celular = "El celular debe tener exactamente 9 dígitos numéricos"
    } else if (!newVendor.celular.startsWith("9")) {
      errors.celular = "El celular debe empezar con 9"
    }

    if (!newVendor.correo.trim()) {
      errors.correo = "El correo es obligatorio"
    } else if (!EMAIL_REGEX.test(newVendor.correo)) {
      errors.correo = "Ingresa un correo válido (ej. juan.perez@gmail.com)"
    }

    // Validación de contraseñas de Registro de Usuario
    if (!newVendor.contrasena) {
      errors.contrasena = "La contraseña es obligatoria"
    } else if (!PASSWORD_REGEX.test(newVendor.contrasena)) {
      errors.contrasena = "Mínimo 8 caracteres y al menos 1 número"
    }

    if (!newVendor.confirmPassword) {
      errors.confirmPassword = "Debes confirmar la contraseña"
    } else if (newVendor.contrasena !== newVendor.confirmPassword) {
      errors.confirmPassword = "Las contraseñas no coinciden"
    }

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const filteredVendors = vendors.filter(vendor => {
    const matchesSearch = 
      vendor.nombres.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vendor.apellidos.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vendor.correo.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === "all" || vendor.estado === statusFilter

    return matchesSearch && matchesStatus
  })

  const handleToggleStatus = async (vendor: VendorMock) => {
    if (vendor.estado === "activo") {
      try {
        await AdminService.deactivateUser(Number(vendor.id))
        setVendors((prev) =>
          prev.map((v) =>
            v.id === vendor.id ? { ...v, estado: "inactivo" as const } : v,
          ),
        )
        toast({
          title: "Cuenta desactivada",
          description: `${vendor.nombres} ${vendor.apellidos} fue desactivado.`,
        })
      } catch (error) {
        toast({
          title: "No se pudo desactivar",
          description: error instanceof Error ? error.message : "Intenta nuevamente.",
          variant: "destructive",
        })
      }
      return
    }

    toast({
      title: "Reactivacion no disponible",
      description: "Contacta soporte para reactivar la cuenta del vendedor.",
    })
  }

  const handleAddVendor = async () => {
    if (!validateForm()) {
      toast({
        title: "Datos incompletos o incorrectos",
        description: "Revisa los campos marcados antes de continuar.",
        variant: "destructive",
      })
      return
    }

    setIsAddingVendor(true)
    try {
      // Se envía con la estructura requerida por el backend sin romper el endpoint
      const created = await AdminService.createVendedor({
        nombres: newVendor.nombres.trim(),
        apellidos: newVendor.apellidos.trim(),
        email: newVendor.correo.trim(),
        contrasena: newVendor.contrasena,
        telefono: newVendor.celular.trim(),
        tipoDocumento: TipoDocumento.DNI,
        numeroDocumento: newVendor.documento.trim(),
        direccion: "No aplica",
      })

      const vendor: VendorMock = {
        id: String(created.idUsuario),
        nombres: created.nombres,
        apellidos: created.apellidos,
        correo: created.email,
        celular: newVendor.celular.trim(),
        documento: newVendor.documento.trim(),
        tipoDocumento: TipoDocumento.DNI,
        rol: "vendedor",
        estado: "activo",
        createdAt: new Date(),
        stats: {
          cotizacionesAtendidas: 0,
          cotizacionesPendientes: 0,
          pedidosGestionados: 0,
          ventasTotales: 0,
          tasaConversion: 0,
        },
      }

      setVendors([vendor, ...vendors])
      setIsAddDialogOpen(false)
      resetNewVendorForm()
      toast({
        title: "Vendedor registrado",
        description: `${created.nombres} ${created.apellidos} fue agregado correctamente.`,
      })
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "Ocurrió un error inesperado. Intenta de nuevo."
      toast({
        title: "Error al registrar vendedor",
        description: message,
        variant: "destructive",
      })
    } finally {
      setIsAddingVendor(false)
    }
  }

  const totalVendors = vendors.length
  const activeVendors = vendors.filter(v => v.estado === 'activo').length
  const totalSales = vendors.reduce((sum, v) => sum + v.stats.ventasTotales, 0)
  const avgConversion = vendors.length > 0 
    ? Math.round(vendors.reduce((sum, v) => sum + v.stats.tasaConversion, 0) / vendors.length) 
    : 0

  const getInitials = (vendor: VendorMock) => {
    return `${vendor.nombres.charAt(0)}${vendor.apellidos.charAt(0)}`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-primary">Gestión de Vendedores</h1>
          <p className="text-muted-foreground">Administra el equipo de ventas y su desempeño</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
          if (!open) resetNewVendorForm();
          setIsAddDialogOpen(open);
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Vendedor
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Agregar Nuevo Vendedor</DialogTitle>
              <DialogDescription>
                Crea una cuenta de acceso para un nuevo miembro del equipo de ventas.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              
              {/* Nombres y Apellidos */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nombres">Nombres <span className="text-destructive">*</span></Label>
                  <Input
                    id="nombres"
                    value={newVendor.nombres}
                    onChange={(e) => handleInputChange("nombres", e.target.value)}
                    placeholder="Juan Carlos"
                    className={cn(fieldErrors.nombres && "border-destructive")}
                  />
                  {fieldErrors.nombres && (
                    <p className="text-xs text-destructive">{fieldErrors.nombres}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="apellidos">Apellidos <span className="text-destructive">*</span></Label>
                  <Input
                    id="apellidos"
                    value={newVendor.apellidos}
                    onChange={(e) => handleInputChange("apellidos", e.target.value)}
                    placeholder="Rodriguez Mendoza"
                    className={cn(fieldErrors.apellidos && "border-destructive")}
                  />
                  {fieldErrors.apellidos && (
                    <p className="text-xs text-destructive">{fieldErrors.apellidos}</p>
                  )}
                </div>
              </div>

              {/* Número de Documento (Solo DNI) */}
              <div className="space-y-2">
                <Label htmlFor="documento">Número de DNI <span className="text-destructive">*</span></Label>
                <div className="relative">
                  <FileText className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="documento"
                    value={newVendor.documento}
                    maxLength={8}
                    onChange={(e) => handleInputChange("documento", e.target.value)}
                    placeholder="12345678"
                    className={cn("pl-10", fieldErrors.documento && "border-destructive")}
                  />
                </div>
                {fieldErrors.documento && (
                  <p className="text-xs text-destructive">{fieldErrors.documento}</p>
                )}
              </div>

              {/* Celular */}
              <div className="space-y-2">
                <Label htmlFor="celular">Celular <span className="text-destructive">*</span></Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="celular"
                    type="tel"
                    maxLength={9}
                    value={newVendor.celular}
                    onChange={(e) => handleInputChange("celular", e.target.value)}
                    placeholder="987654321"
                    className={cn("pl-10", fieldErrors.celular && "border-destructive")}
                  />
                </div>
                {fieldErrors.celular && (
                  <p className="text-xs text-destructive">{fieldErrors.celular}</p>
                )}
              </div>

              {/* Correo Electrónico */}
              <div className="space-y-2">
                <Label htmlFor="correo">Correo Electrónico <span className="text-destructive">*</span></Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="correo"
                    type="email"
                    value={newVendor.correo}
                    onChange={(e) => handleInputChange("correo", e.target.value)}
                    placeholder="juan.perez@gamarrintintin.com"
                    className={cn("pl-10", fieldErrors.correo && "border-destructive")}
                  />
                </div>
                {fieldErrors.correo && (
                  <p className="text-xs text-destructive">{fieldErrors.correo}</p>
                )}
              </div>

              {/* Contraseña */}
              <div className="space-y-2">
                <Label htmlFor="contrasena">Contraseña <span className="text-destructive">*</span></Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="contrasena"
                    type={showPassword ? "text" : "password"}
                    value={newVendor.contrasena}
                    onChange={(e) => handleInputChange("contrasena", e.target.value)}
                    placeholder="Min. 8 caracteres con al menos 1 número"
                    className={cn("pl-10 pr-10", fieldErrors.contrasena && "border-destructive")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {fieldErrors.contrasena && (
                  <p className="text-xs text-destructive">{fieldErrors.contrasena}</p>
                )}
              </div>

              {/* Confirmar Contraseña */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Contraseña <span className="text-destructive">*</span></Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={newVendor.confirmPassword}
                    onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                    placeholder="Repite la contraseña"
                    className={cn("pl-10 pr-10", fieldErrors.confirmPassword && "border-destructive")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {fieldErrors.confirmPassword && (
                  <p className="text-xs text-destructive">{fieldErrors.confirmPassword}</p>
                )}
              </div>

            </div>
            <DialogFooter className="pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setIsAddDialogOpen(false)}
                disabled={isAddingVendor}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleAddVendor}
                disabled={isAddingVendor}
              >
                {isAddingVendor ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creando Cuenta...
                  </>
                ) : (
                  "Crear Cuenta"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-2 gap-6">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Vendedores</p>
                <p className="text-2xl font-bold">{totalVendors}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <UserCheck className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Activos</p>
                <p className="text-2xl font-bold text-green-600">{activeVendors}</p>
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
                placeholder="Buscar por nombre o correo..."
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
                <SelectItem value="activo">Activos</SelectItem>
                <SelectItem value="inactivo">Inactivos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border-2">
        <CardContent className="pt-6">
          {isLoadingVendors ? (
            <div className="text-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
              <p className="text-muted-foreground">Cargando vendedores...</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vendedor</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVendors.map((vendor) => (
                  <TableRow key={vendor.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            {getInitials(vendor)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{vendor.nombres} {vendor.apellidos}</p>
                          <p className="text-xs text-muted-foreground">
                            Desde {vendor.createdAt.toLocaleDateString('es-PE', { month: 'short', year: 'numeric' })}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="text-sm">{vendor.correo}</p>
                        <p className="text-xs text-muted-foreground">{vendor.celular}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={vendor.estado === 'activo'}
                          onCheckedChange={() => handleToggleStatus(vendor)}
                        />
                        <Badge variant={vendor.estado === 'activo' ? "default" : "secondary"}>
                          {vendor.estado === 'activo' ? "Activo" : "Inactivo"}
                        </Badge>
                      </div>
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
                          <DropdownMenuItem onClick={() => {
                            setSelectedVendor(vendor)
                            setIsViewDialogOpen(true)
                          }}>
                            <Eye className="w-4 h-4 mr-2" /> Ver Detalles
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEditDialog(vendor)}>
                            <Edit className="w-4 h-4 mr-2" /> Editar
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleToggleStatus(vendor)}
                            className={vendor.estado === 'activo' ? "text-destructive" : "text-green-600"}
                          >
                            {vendor.estado === 'activo' ? (
                              <>
                                <UserX className="w-4 h-4 mr-2" /> Desactivar
                              </>
                            ) : (
                              <>
                                <UserCheck className="w-4 h-4 mr-2" /> Activar
                              </>
                            )}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
                </Table>
              </div>

              {filteredVendors.length === 0 && (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                  <p className="text-muted-foreground">No se encontraron vendedores</p>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* View Details Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          {selectedVendor && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-4">
                  <Avatar className="w-16 h-16">
                    <AvatarFallback className="text-xl bg-primary text-primary-foreground">
                      {getInitials(selectedVendor)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <DialogTitle className="text-xl">
                      {selectedVendor.nombres} {selectedVendor.apellidos}
                    </DialogTitle>
                    <DialogDescription className="flex items-center gap-2 mt-1">
                      <Badge variant={selectedVendor.estado === 'activo' ? "default" : "secondary"}>
                        {selectedVendor.estado}
                      </Badge>
                      <span>Vendedor desde {selectedVendor.createdAt.toLocaleDateString('es-PE', { month: 'long', year: 'numeric' })}</span>
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-10 py-4">
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-1 p-2 bg-muted/50 rounded-lg">
                    <Mail className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Correo</p>
                      <p className="text-sm font-medium">{selectedVendor.correo}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 p-2 bg-muted/50 rounded-lg">
                    <Phone className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Celular</p>
                      <p className="text-sm font-medium">{selectedVendor.celular}</p>
                    </div>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
                  Cerrar
                </Button>
                <Button onClick={() => selectedVendor && handleToggleStatus(selectedVendor)}>
                  {selectedVendor.estado === 'activo' ? (
                    <>
                      <UserX className="w-4 h-4 mr-2" /> Desactivar Cuenta
                    </>
                  ) : (
                    <>
                      <UserCheck className="w-4 h-4 mr-2" /> Activar Cuenta
                    </>
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Modificar vendedor</DialogTitle>
            <DialogDescription>
              Actualiza los datos del vendedor seleccionado.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-nombres">Nombres</Label>
                <Input
                  id="edit-nombres"
                  value={editVendor.nombres}
                  onChange={(e) => setEditVendor({ ...editVendor, nombres: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-apellidos">Apellidos</Label>
                <Input
                  id="edit-apellidos"
                  value={editVendor.apellidos}
                  onChange={(e) => setEditVendor({ ...editVendor, apellidos: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-correo">Correo</Label>
              <Input
                id="edit-correo"
                type="email"
                value={editVendor.correo}
                onChange={(e) => setEditVendor({ ...editVendor, correo: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-celular">Celular</Label>
              <Input
                id="edit-celular"
                value={editVendor.celular}
                onChange={(e) => setEditVendor({ ...editVendor, celular: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-documento">DNI</Label>
              <Input
                id="edit-documento"
                value={editVendor.documento}
                onChange={(e) => setEditVendor({ ...editVendor, documento: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-direccion">Direccion</Label>
              <Input
                id="edit-direccion"
                value={editVendor.direccion}
                onChange={(e) => setEditVendor({ ...editVendor, direccion: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={isSavingEdit}>
              Cancelar
            </Button>
            <Button onClick={handleSaveEdit} disabled={isSavingEdit}>
              {isSavingEdit ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                "Guardar cambios"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}