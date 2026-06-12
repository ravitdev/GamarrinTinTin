"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
  TrendingUp,
  ShoppingBag,
  FileText,
  DollarSign,
  Users,
  Filter,
  Mail,
  Phone,
  Calendar
} from "lucide-react"
import { formatPrice } from "@/lib/mock-data"

interface VendorMock {
  id: string;
  nombres: string;
  apellidos: string;
  correo: string;
  celular: string;
  documento: string;
  tipoDocumento: "DNI" | "RUC";
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

// Mock vendors data
const mockVendors: VendorMock[] = [
  {
    id: "vendor-1",
    nombres: "Maria",
    apellidos: "Garcia Lopez",
    correo: "maria.garcia@gamarrintintin.com",
    celular: "+51 987 654 321",
    documento: "45678901",
    tipoDocumento: "DNI",
    rol: "vendedor",
    estado: "activo",
    createdAt: new Date("2023-06-15"),
    stats: {
      cotizacionesAtendidas: 156,
      cotizacionesPendientes: 3,
      pedidosGestionados: 89,
      ventasTotales: 45600,
      tasaConversion: 78,
    }
  },
  {
    id: "vendor-2",
    nombres: "Carlos",
    apellidos: "Martinez Ruiz",
    correo: "carlos.martinez@gamarrintintin.com",
    celular: "+51 976 543 210",
    documento: "34567890",
    tipoDocumento: "DNI",
    rol: "vendedor",
    estado: "activo",
    createdAt: new Date("2023-09-20"),
    stats: {
      cotizacionesAtendidas: 98,
      cotizacionesPendientes: 5,
      pedidosGestionados: 67,
      ventasTotales: 32400,
      tasaConversion: 72,
    }
  },
  {
    id: "vendor-3",
    nombres: "Ana",
    apellidos: "Fernandez Torres",
    correo: "ana.fernandez@gamarrintintin.com",
    celular: "+51 965 432 109",
    documento: "23456789",
    tipoDocumento: "DNI",
    rol: "vendedor",
    estado: "inactivo",
    createdAt: new Date("2024-01-10"),
    stats: {
      cotizacionesAtendidas: 45,
      cotizacionesPendientes: 0,
      pedidosGestionados: 28,
      ventasTotales: 12800,
      tasaConversion: 65,
    }
  },
  {
    id: "vendor-4",
    nombres: "Luis",
    apellidos: "Sanchez Vargas",
    correo: "luis.sanchez@gamarrintintin.com",
    celular: "+51 954 321 098",
    documento: "56789012",
    tipoDocumento: "DNI",
    rol: "vendedor",
    estado: "activo",
    createdAt: new Date("2024-03-05"),
    stats: {
      cotizacionesAtendidas: 67,
      cotizacionesPendientes: 2,
      pedidosGestionados: 45,
      ventasTotales: 28900,
      tasaConversion: 75,
    }
  },
]

export default function AdminVendedoresPage() {
  const [vendors, setVendors] = useState<VendorMock[]>(mockVendors)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [selectedVendor, setSelectedVendor] = useState<VendorMock | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newVendor, setNewVendor] = useState({
    nombres: "",
    apellidos: "",
    correo: "",
    celular: "",
    documento: "",
    tipoDocumento: "DNI" as "DNI" | "RUC",
  })

  const filteredVendors = vendors.filter(vendor => {
    const matchesSearch = 
      vendor.nombres.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vendor.apellidos.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vendor.correo.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === "all" || vendor.estado === statusFilter

    return matchesSearch && matchesStatus
  })

  const handleToggleStatus = (vendorId: string) => {
    setVendors(vendors.map(v => 
      v.id === vendorId 
        ? { ...v, estado: v.estado === 'activo' ? 'inactivo' as const : 'activo' as const }
        : v
    ))
  }

  const handleAddVendor = () => {
    const vendor: VendorMock = {
      id: `vendor-${Date.now()}`,
      ...newVendor,
      rol: "vendedor" as const,
      estado: "activo" as const,
      createdAt: new Date(),
      stats: {
        cotizacionesAtendidas: 0,
        cotizacionesPendientes: 0,
        pedidosGestionados: 0,
        ventasTotales: 0,
        tasaConversion: 0,
      }
    }
    setVendors([vendor, ...vendors])
    setIsAddDialogOpen(false)
    setNewVendor({
      nombres: "",
      apellidos: "",
      correo: "",
      celular: "",
      documento: "",
      tipoDocumento: "DNI",
    })
  }

  const totalVendors = vendors.length
  const activeVendors = vendors.filter(v => v.estado === 'activo').length
  const totalSales = vendors.reduce((sum, v) => sum + v.stats.ventasTotales, 0)
  const avgConversion = Math.round(vendors.reduce((sum, v) => sum + v.stats.tasaConversion, 0) / vendors.length)

  const getInitials = (vendor: VendorMock) => {
    return `${vendor.nombres.charAt(0)}${vendor.apellidos.charAt(0)}`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-primary">Gestion de Vendedores</h1>
          <p className="text-muted-foreground">Administra el equipo de ventas y su desempeno</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Vendedor
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Agregar Nuevo Vendedor</DialogTitle>
              <DialogDescription>
                Ingresa los datos del nuevo vendedor
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nombres">Nombres *</Label>
                  <Input
                    id="nombres"
                    value={newVendor.nombres}
                    onChange={(e) => setNewVendor({ ...newVendor, nombres: e.target.value })}
                    placeholder="Nombres"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="apellidos">Apellidos *</Label>
                  <Input
                    id="apellidos"
                    value={newVendor.apellidos}
                    onChange={(e) => setNewVendor({ ...newVendor, apellidos: e.target.value })}
                    placeholder="Apellidos"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="correo">Correo Electronico *</Label>
                <Input
                  id="correo"
                  type="email"
                  value={newVendor.correo}
                  onChange={(e) => setNewVendor({ ...newVendor, correo: e.target.value })}
                  placeholder="correo@gamarrintintin.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="celular">Celular *</Label>
                <Input
                  id="celular"
                  value={newVendor.celular}
                  onChange={(e) => setNewVendor({ ...newVendor, celular: e.target.value })}
                  placeholder="+51 999 888 777"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tipoDocumento">Tipo Documento</Label>
                  <Select
                    value={newVendor.tipoDocumento}
                    onValueChange={(value: "DNI" | "RUC") => setNewVendor({ ...newVendor, tipoDocumento: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DNI">DNI</SelectItem>
                      <SelectItem value="RUC">RUC</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="documento">Numero *</Label>
                  <Input
                    id="documento"
                    value={newVendor.documento}
                    onChange={(e) => setNewVendor({ ...newVendor, documento: e.target.value })}
                    placeholder="12345678"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleAddVendor}
                disabled={!newVendor.nombres || !newVendor.apellidos || !newVendor.correo}
              >
                Agregar Vendedor
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-accent/20 rounded-lg">
                <DollarSign className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Ventas Totales</p>
                <p className="text-2xl font-bold">{formatPrice(totalSales)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Conversion Prom.</p>
                <p className="text-2xl font-bold">{avgConversion}%</p>
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

      {/* Vendors Table */}
      <Card className="border-2">
        <CardContent className="pt-6">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vendedor</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead className="text-center">Cotizaciones</TableHead>
                  <TableHead className="text-center">Pedidos</TableHead>
                  <TableHead className="text-right">Ventas</TableHead>
                  <TableHead className="text-center">Conversion</TableHead>
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
                    <TableCell className="text-center">
                      <div>
                        <p className="font-medium">{vendor.stats.cotizacionesAtendidas}</p>
                        {vendor.stats.cotizacionesPendientes > 0 && (
                          <Badge variant="secondary" className="text-xs mt-1">
                            {vendor.stats.cotizacionesPendientes} pend.
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center font-medium">
                      {vendor.stats.pedidosGestionados}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatPrice(vendor.stats.ventasTotales)}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <div 
                          className="h-2 rounded-full bg-muted w-16"
                          title={`${vendor.stats.tasaConversion}%`}
                        >
                          <div 
                            className="h-2 rounded-full bg-accent"
                            style={{ width: `${vendor.stats.tasaConversion}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium">{vendor.stats.tasaConversion}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={vendor.estado === 'activo'}
                          onCheckedChange={() => handleToggleStatus(vendor.id)}
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
                            <Eye className="w-4 h-4 mr-2" />
                            Ver Detalles
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="w-4 h-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleToggleStatus(vendor.id)}
                            className={vendor.estado === 'activo' ? "text-destructive" : "text-green-600"}
                          >
                            {vendor.estado === 'activo' ? (
                              <>
                                <UserX className="w-4 h-4 mr-2" />
                                Desactivar
                              </>
                            ) : (
                              <>
                                <UserCheck className="w-4 h-4 mr-2" />
                                Activar
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
        </CardContent>
      </Card>

      {/* View Vendor Dialog */}
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
                      <span>Vendedor desde {selectedVendor.createdAt.toLocaleDateString('es-PE', {
                        month: 'long',
                        year: 'numeric'
                      })}</span>
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-6 py-4">
                {/* Contact Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <Mail className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Correo</p>
                      <p className="text-sm font-medium">{selectedVendor.correo}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <Phone className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Celular</p>
                      <p className="text-sm font-medium">{selectedVendor.celular}</p>
                    </div>
                  </div>
                </div>

                {/* Performance Stats */}
                <div>
                  <h4 className="font-medium mb-3">Desempeno</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="pt-4 text-center">
                        <FileText className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
                        <p className="text-2xl font-bold">{selectedVendor.stats.cotizacionesAtendidas}</p>
                        <p className="text-xs text-muted-foreground">Cotizaciones Atendidas</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4 text-center">
                        <ShoppingBag className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
                        <p className="text-2xl font-bold">{selectedVendor.stats.pedidosGestionados}</p>
                        <p className="text-xs text-muted-foreground">Pedidos Gestionados</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4 text-center">
                        <DollarSign className="w-6 h-6 text-accent mx-auto mb-2" />
                        <p className="text-2xl font-bold">{formatPrice(selectedVendor.stats.ventasTotales)}</p>
                        <p className="text-xs text-muted-foreground">Ventas Totales</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4 text-center">
                        <TrendingUp className="w-6 h-6 text-green-600 mx-auto mb-2" />
                        <p className="text-2xl font-bold">{selectedVendor.stats.tasaConversion}%</p>
                        <p className="text-xs text-muted-foreground">Tasa de Conversion</p>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {/* Pending Work */}
                {selectedVendor.stats.cotizacionesPendientes > 0 && (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-sm text-amber-800">
                      <strong>{selectedVendor.stats.cotizacionesPendientes}</strong> cotizaciones pendientes por atender
                    </p>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
                  Cerrar
                </Button>
                <Button onClick={() => handleToggleStatus(selectedVendor.id)}>
                  {selectedVendor.estado === 'activo' ? (
                    <>
                      <UserX className="w-4 h-4 mr-2" />
                      Desactivar Cuenta
                    </>
                  ) : (
                    <>
                      <UserCheck className="w-4 h-4 mr-2" />
                      Activar Cuenta
                    </>
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
