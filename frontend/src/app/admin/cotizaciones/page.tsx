"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import {
  Search,
  Filter,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  Send,
  Eye,
  Calendar,
  Building2,
  User,
  Phone,
  Mail,
  Package,
  AlertCircle,
  Palette,
  Ruler,
  DollarSign,
  AlertTriangle,
  Loader2
} from "lucide-react"
import { formatPrice, getQuotationStatusColor } from "@/lib/mock-data"
import type { Quotation, QuotationStatus } from "@/lib/types"
import { cn } from "@/lib/utils"
import { QuotationService } from "@/features/quotations/services/quotation.service"

const statusConfig: Record<QuotationStatus, { label: string; icon: React.ReactNode }> = {
  pendiente: { label: "Pendiente", icon: <Clock className="w-4 h-4" /> },
  cotizado: { label: "Cotizado", icon: <Send className="w-4 h-4" /> },
  pagado: { label: "Pagado", icon: <CheckCircle2 className="w-4 h-4" /> },
  rechazado: { label: "Rechazado", icon: <XCircle className="w-4 h-4" /> },
  vencido: { label: "Vencido", icon: <AlertTriangle className="w-4 h-4" /> },
}

export default function AdminQuotationsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<QuotationStatus | "all">("all")
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null)
  const [isQuotingDialogOpen, setIsQuotingDialogOpen] = useState(false)
  const [quotationPrice, setQuotationPrice] = useState("")
  const [quotations, setQuotations] = useState<Quotation[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    QuotationService.getAllQuotations()
      .then(setQuotations)
      .finally(() => setIsLoading(false))
  }, [])

  const filteredQuotations = quotations.filter(q => {
    const matchesSearch = 
      q.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.cliente.nombres.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.cliente.apellidos.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.cliente.correo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.producto.nombre.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === "all" || q.estado === statusFilter

    return matchesSearch && matchesStatus
  })

  const counts = {
    total: quotations.length,
    pendiente: quotations.filter(q => q.estado === "pendiente").length,
    cotizado: quotations.filter(q => q.estado === "cotizado").length,
    pagado: quotations.filter(q => q.estado === "pagado").length,
  }

  const handleSendQuotation = async () => {
    if (!selectedQuotation || !quotationPrice) return
    try {
      const updated = await QuotationService.updateQuotation(selectedQuotation.id, {
        estado: 'cotizado',
        precioSugerido: parseFloat(quotationPrice),
      })
      setQuotations(prev => prev.map(q => q.id === updated.id ? updated : q))
    } catch (err: any) {
      alert(err.message || "No se pudo enviar la cotizacion")
    }
    setIsQuotingDialogOpen(false)
    setSelectedQuotation(null)
    setQuotationPrice("")
  }

  const openQuotingDialog = (quotation: Quotation) => {
    setSelectedQuotation(quotation)
    setIsQuotingDialogOpen(true)
    const suggestedPrice = quotation.producto.precio * 0.85 // 15% off as suggestion
    setQuotationPrice(suggestedPrice.toFixed(2))
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-serif text-2xl font-bold text-primary">Gestion de Cotizaciones</h1>
        <p className="text-muted-foreground">Responde y da seguimiento a las solicitudes de cotizacion</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-muted rounded-lg">
                <FileText className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{counts.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-yellow-200 bg-yellow-50/50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="w-5 h-5 text-yellow-700" />
              </div>
              <div>
                <p className="text-sm text-yellow-700">Pendientes</p>
                <p className="text-2xl font-bold text-yellow-700">{counts.pendiente}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-blue-200 bg-blue-50/50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Send className="w-5 h-5 text-blue-700" />
              </div>
              <div>
                <p className="text-sm text-blue-700">Cotizadas</p>
                <p className="text-2xl font-bold text-blue-700">{counts.cotizado}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-green-200 bg-green-50/50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-green-700" />
              </div>
              <div>
                <p className="text-sm text-green-700">Pagadas</p>
                <p className="text-2xl font-bold text-green-700">{counts.pagado}</p>
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
                placeholder="Buscar por codigo, cliente, email o producto..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as QuotationStatus | "all")}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pendiente">Pendiente</SelectItem>
                <SelectItem value="cotizado">Cotizado</SelectItem>
                <SelectItem value="pagado">Pagado</SelectItem>
                <SelectItem value="rechazado">Rechazado</SelectItem>
                <SelectItem value="vencido">Vencido</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Quotations List */}
      <div className="space-y-4">
        {filteredQuotations.map((quotation) => (
          <Card key={quotation.id} className="border-2 hover:border-accent/50 transition-colors">
            <CardContent className="pt-6">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                {/* Main Info */}
                <div className="flex-1 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-semibold text-lg">{quotation.codigo}</h3>
                        <Badge className={cn("capitalize", getQuotationStatusColor(quotation.estado))}>
                          <span className="flex items-center gap-1">
                            {statusConfig[quotation.estado].icon}
                            {statusConfig[quotation.estado].label}
                          </span>
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(quotation.createdAt).toLocaleDateString("es-PE")}
                        </span>
                        <span className="flex items-center gap-1">
                          <Package className="w-4 h-4" />
                          {quotation.cantidad} unidades
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Customer Info */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">{quotation.cliente.nombres} {quotation.cliente.apellidos}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">{quotation.cliente.tipoDocumento}: {quotation.cliente.documento}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">{quotation.cliente.correo}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">{quotation.cliente.celular}</span>
                    </div>
                  </div>

                  {/* Product Info */}
                  <div className="flex items-center gap-4 p-3 border rounded-lg">
                    <div 
                      className="w-12 h-12 rounded-lg border flex items-center justify-center"
                      style={{ backgroundColor: quotation.colorSeleccionado.hexCode }}
                    >
                      <Package className="w-6 h-6 text-white/70" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{quotation.producto.nombre}</p>
                      <p className="text-sm text-muted-foreground">
                        {quotation.colorSeleccionado.nombre} | Talla {quotation.tallaSeleccionada} | {quotation.cantidad} und.
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Precio base</p>
                      <p className="font-semibold">{formatPrice(quotation.producto.precio)}/und</p>
                    </div>
                  </div>
                </div>

                {/* Actions & Price */}
                <div className="lg:w-64 space-y-4">
                  {quotation.precioSugerido && (
                    <div className="p-4 bg-primary/5 rounded-lg text-center">
                      <p className="text-sm text-muted-foreground">Precio Cotizado</p>
                      <p className="text-2xl font-bold text-primary">{formatPrice(quotation.precioSugerido)}/und</p>
                      <p className="text-sm text-accent font-medium mt-1">
                        Total: {formatPrice(quotation.precioSugerido * quotation.cantidad)}
                      </p>
                      {quotation.fechaVencimiento && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Valido hasta {new Date(quotation.fechaVencimiento).toLocaleDateString("es-PE")}
                        </p>
                      )}
                    </div>
                  )}

                  <div className="space-y-2">
                    <Button 
                      className="w-full" 
                      variant="outline"
                      onClick={() => setSelectedQuotation(quotation)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Ver Detalles
                    </Button>
                    
                    {quotation.estado === "pendiente" && (
                      <Button 
                        className="w-full"
                        onClick={() => openQuotingDialog(quotation)}
                      >
                        <Send className="w-4 h-4 mr-2" />
                        Enviar Cotizacion
                      </Button>
                    )}

                    {quotation.estado === "pagado" && (
                      <Button className="w-full bg-green-600 hover:bg-green-700">
                        <Package className="w-4 h-4 mr-2" />
                        Ver Pedido
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredQuotations.length === 0 && (
          <Card className="border-2">
            <CardContent className="py-12 text-center">
              <FileText className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-muted-foreground">No se encontraron cotizaciones</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!selectedQuotation && !isQuotingDialogOpen} onOpenChange={() => setSelectedQuotation(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedQuotation && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  {selectedQuotation.codigo}
                  <Badge className={cn("capitalize", getQuotationStatusColor(selectedQuotation.estado))}>
                    {statusConfig[selectedQuotation.estado].label}
                  </Badge>
                </DialogTitle>
                <DialogDescription>
                  Solicitud recibida el {new Date(selectedQuotation.createdAt).toLocaleDateString("es-PE", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric"
                  })}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 py-4">
                {/* Customer Details */}
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Datos del Cliente
                  </h4>
                  <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                    <div>
                      <p className="text-sm text-muted-foreground">Nombre</p>
                      <p className="font-medium">{selectedQuotation.cliente.nombres} {selectedQuotation.cliente.apellidos}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Documento</p>
                      <p className="font-medium">{selectedQuotation.cliente.tipoDocumento}: {selectedQuotation.cliente.documento}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium">{selectedQuotation.cliente.correo}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Telefono</p>
                      <p className="font-medium">{selectedQuotation.cliente.celular}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-sm text-muted-foreground">Direccion</p>
                      <p className="font-medium">{selectedQuotation.cliente.direccion}</p>
                    </div>
                  </div>
                </div>

                {/* Product Details */}
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    Producto Solicitado
                  </h4>
                  <div className="p-4 bg-muted/50 rounded-lg space-y-4">
                    <div className="flex items-center gap-4">
                      <div 
                        className="w-16 h-16 rounded-lg border flex items-center justify-center"
                        style={{ backgroundColor: selectedQuotation.colorSeleccionado.hexCode }}
                      >
                        <Package className="w-8 h-8 text-white/70" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-lg">{selectedQuotation.producto.nombre}</p>
                        <p className="text-sm text-muted-foreground">{selectedQuotation.producto.descripcion}</p>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Palette className="w-3 h-3" />
                          Color
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <div 
                            className="w-4 h-4 rounded-full border"
                            style={{ backgroundColor: selectedQuotation.colorSeleccionado.hexCode }}
                          />
                          <span className="font-medium">{selectedQuotation.colorSeleccionado.nombre}</span>
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Ruler className="w-3 h-3" />
                          Talla
                        </div>
                        <p className="font-medium mt-1">{selectedQuotation.tallaSeleccionada}</p>
                      </div>
                      <div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Package className="w-3 h-3" />
                          Cantidad
                        </div>
                        <p className="font-medium mt-1">{selectedQuotation.cantidad} unidades</p>
                      </div>
                      <div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <DollarSign className="w-3 h-3" />
                          Precio Base
                        </div>
                        <p className="font-medium mt-1">{formatPrice(selectedQuotation.producto.precio)}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quotation Info */}
                {selectedQuotation.precioSugerido && (
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Cotizacion Enviada
                    </h4>
                    <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Precio Cotizado</p>
                          <p className="text-2xl font-bold text-primary">{formatPrice(selectedQuotation.precioSugerido)}/und</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Total</p>
                          <p className="text-2xl font-bold text-accent">
                            {formatPrice(selectedQuotation.precioSugerido * selectedQuotation.cantidad)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Descuento Aplicado</p>
                          <Badge className="bg-green-100 text-green-800 mt-1">
                            {Math.round((1 - selectedQuotation.precioSugerido / selectedQuotation.producto.precio) * 100)}%
                          </Badge>
                        </div>
                        {selectedQuotation.fechaVencimiento && (
                          <div>
                            <p className="text-sm text-muted-foreground">Valido Hasta</p>
                            <p className="font-medium mt-1">
                              {new Date(selectedQuotation.fechaVencimiento).toLocaleDateString("es-PE")}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setSelectedQuotation(null)}>
                  Cerrar
                </Button>
                {selectedQuotation.estado === "pendiente" && (
                  <Button onClick={() => {
                    setSelectedQuotation(null)
                    setTimeout(() => openQuotingDialog(selectedQuotation), 100)
                  }}>
                    <Send className="w-4 h-4 mr-2" />
                    Enviar Cotizacion
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Quoting Dialog */}
      <Dialog open={isQuotingDialogOpen} onOpenChange={setIsQuotingDialogOpen}>
        <DialogContent className="max-w-lg">
          {selectedQuotation && (
            <>
              <DialogHeader>
                <DialogTitle>Enviar Cotizacion</DialogTitle>
                <DialogDescription>
                  Define el precio especial para {selectedQuotation.codigo}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 py-4">
                {/* Product Summary */}
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-12 h-12 rounded-lg border flex items-center justify-center"
                      style={{ backgroundColor: selectedQuotation.colorSeleccionado.hexCode }}
                    >
                      <Package className="w-6 h-6 text-white/70" />
                    </div>
                    <div>
                      <p className="font-medium">{selectedQuotation.producto.nombre}</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedQuotation.colorSeleccionado.nombre} | Talla {selectedQuotation.tallaSeleccionada} | {selectedQuotation.cantidad} und.
                      </p>
                    </div>
                  </div>
                  <Separator className="my-3" />
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Precio base:</span>
                    <span className="font-medium">{formatPrice(selectedQuotation.producto.precio)}/und</span>
                  </div>
                </div>

                {/* Price Input */}
                <div className="space-y-2">
                  <Label htmlFor="price">Precio por unidad (S/)</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      className="pl-10 text-lg font-semibold"
                      value={quotationPrice}
                      onChange={(e) => setQuotationPrice(e.target.value)}
                    />
                  </div>
                  {quotationPrice && (
                    <div className="text-sm space-y-1">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Descuento:</span>
                        <Badge className={cn(
                          Number(quotationPrice) < selectedQuotation.producto.precio 
                            ? "bg-green-100 text-green-800" 
                            : "bg-red-100 text-red-800"
                        )}>
                          {Math.round((1 - Number(quotationPrice) / selectedQuotation.producto.precio) * 100)}%
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total ({selectedQuotation.cantidad} und):</span>
                        <span className="font-bold text-primary">
                          {formatPrice(Number(quotationPrice) * selectedQuotation.cantidad)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <p className="text-sm text-muted-foreground">
                  La cotizacion tendra una vigencia de 48 horas.
                </p>

                {/* Warning */}
                <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5" />
                  <p className="text-sm text-yellow-800">
                    El cliente recibira un correo con esta cotizacion y podra agregar el producto a su carrito con el precio especial.
                  </p>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsQuotingDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button 
                  onClick={handleSendQuotation}
                  disabled={!quotationPrice || Number(quotationPrice) <= 0}
                >
                  <Send className="w-4 h-4 mr-2" />
                  Enviar Cotizacion
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
