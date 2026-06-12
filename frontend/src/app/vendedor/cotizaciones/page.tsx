"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
  Search,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  Send,
  Calculator,
  User,
  Package,
  Calendar
} from "lucide-react"
import { mockQuotations, formatPrice } from "@/lib/mock-data"
import type { Quotation, QuotationStatus } from "@/lib/types"

const statusConfig: Record<QuotationStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: typeof Clock }> = {
  pendiente: { label: "Pendiente", variant: "secondary", icon: Clock },
  cotizado: { label: "Cotizado", variant: "default", icon: CheckCircle2 },
  pagado: { label: "Pagado", variant: "default", icon: CheckCircle2 },
  rechazado: { label: "Rechazado", variant: "destructive", icon: XCircle },
  vencido: { label: "Vencido", variant: "outline", icon: XCircle },
}

export default function VendedorCotizacionesPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState<string>("pendiente")
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isQuoteOpen, setIsQuoteOpen] = useState(false)
  const [quotedPrice, setQuotedPrice] = useState("")
  const [validityDays, setValidityDays] = useState("7")

  const filteredQuotations = mockQuotations.filter(q => {
    const matchesSearch = 
      q.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.cliente.nombres.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.producto.nombre.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesTab = activeTab === "todas" || q.estado === activeTab

    return matchesSearch && matchesTab
  })

  const pendingCount = mockQuotations.filter(q => q.estado === 'pendiente').length
  const quotedCount = mockQuotations.filter(q => q.estado === 'cotizado').length

  const handleOpenQuote = (quotation: Quotation) => {
    setSelectedQuotation(quotation)
    // Calculate suggested price with volume discount
    const basePrice = quotation.producto.precio * quotation.cantidad
    const discount = quotation.producto.descuentosVolumen.find(
      d => quotation.cantidad >= d.cantidadMinima
    )
    const discountedPrice = discount 
      ? basePrice * (1 - discount.porcentajeDescuento / 100)
      : basePrice
    setQuotedPrice(discountedPrice.toFixed(2))
    setIsQuoteOpen(true)
  }

  const handleSendQuote = () => {
    // In real app, this would save to database
    if (selectedQuotation) {
      const index = mockQuotations.findIndex(q => q.id === selectedQuotation.id)
      if (index !== -1) {
        mockQuotations[index] = {
          ...mockQuotations[index],
          estado: 'cotizado',
          precioSugerido: parseFloat(quotedPrice),
          fechaVencimiento: new Date(Date.now() + parseInt(validityDays) * 24 * 60 * 60 * 1000),
          updatedAt: new Date()
        }
      }
    }
    setIsQuoteOpen(false)
    setSelectedQuotation(null)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-serif text-2xl font-bold text-primary">Gestion de Cotizaciones</h1>
        <p className="text-muted-foreground">Responde a las solicitudes de cotizacion de los clientes</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-amber-200 bg-amber-50/50">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-amber-700">Pendientes</p>
                <p className="text-2xl font-bold text-amber-700">{pendingCount}</p>
              </div>
              <Clock className="w-8 h-8 text-amber-300" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Cotizadas</p>
                <p className="text-2xl font-bold">{quotedCount}</p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-muted-foreground/30" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pagadas</p>
                <p className="text-2xl font-bold">{mockQuotations.filter(q => q.estado === 'pagado').length}</p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-green-300" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{mockQuotations.length}</p>
              </div>
              <FileText className="w-8 h-8 text-muted-foreground/30" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por codigo, cliente o producto..."
          className="pl-10"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="pendiente" className="gap-2">
            <Clock className="w-4 h-4" />
            Pendientes
            {pendingCount > 0 && (
              <Badge variant="secondary" className="ml-1">{pendingCount}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="cotizado">Cotizadas</TabsTrigger>
          <TabsTrigger value="pagado">Pagadas</TabsTrigger>
          <TabsTrigger value="todas">Todas</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Codigo</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Producto</TableHead>
                    <TableHead className="text-center">Cantidad</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredQuotations.map((quotation) => {
                    const status = statusConfig[quotation.estado]
                    const StatusIcon = status.icon

                    return (
                      <TableRow key={quotation.id}>
                        <TableCell className="font-mono font-medium">
                          {quotation.codigo}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{quotation.cliente.nombres} {quotation.cliente.apellidos}</p>
                            <p className="text-xs text-muted-foreground">{quotation.cliente.correo}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div
                              className="w-8 h-8 rounded-full border"
                              style={{ backgroundColor: quotation.colorSeleccionado.hexCode }}
                            />
                            <div>
                              <p className="font-medium">{quotation.producto.nombre}</p>
                              <p className="text-xs text-muted-foreground">
                                {quotation.colorSeleccionado.nombre} - Talla {quotation.tallaSeleccionada}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline">{quotation.cantidad} uds</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={status.variant} className="gap-1">
                            <StatusIcon className="w-3 h-3" />
                            {status.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(quotation.createdAt).toLocaleDateString('es-PE', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            timeZone: 'UTC'
                          })}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedQuotation(quotation)
                                setIsDetailOpen(true)
                              }}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            {quotation.estado === 'pendiente' && (
                              <Button
                                size="sm"
                                onClick={() => handleOpenQuote(quotation)}
                              >
                                <Calculator className="w-4 h-4 mr-1" />
                                Cotizar
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>

              {filteredQuotations.length === 0 && (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                  <p className="text-muted-foreground">No hay cotizaciones en esta categoria</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl">
          {selectedQuotation && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <span>Cotizacion {selectedQuotation.codigo}</span>
                  <Badge variant={statusConfig[selectedQuotation.estado].variant}>
                    {statusConfig[selectedQuotation.estado].label}
                  </Badge>
                </DialogTitle>
                <DialogDescription>
                  Solicitada el {new Date(selectedQuotation.createdAt).toLocaleDateString('es-PE', {
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
                      <p className="font-medium">{selectedQuotation.cliente.nombres} {selectedQuotation.cliente.apellidos}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Email</p>
                      <p className="font-medium">{selectedQuotation.cliente.correo}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Telefono</p>
                      <p className="font-medium">{selectedQuotation.cliente.celular}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Documento</p>
                      <p className="font-medium">{selectedQuotation.cliente.tipoDocumento}: {selectedQuotation.cliente.documento}</p>
                    </div>
                  </div>
                </div>

                {/* Product Info */}
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <Package className="w-4 h-4 text-muted-foreground" />
                    <h4 className="font-medium">Producto Solicitado</h4>
                  </div>
                  <div className="flex items-center gap-4">
                    <div
                      className="w-16 h-16 rounded-lg border"
                      style={{ backgroundColor: selectedQuotation.colorSeleccionado.hexCode }}
                    />
                    <div className="flex-1">
                      <p className="font-medium">{selectedQuotation.producto.nombre}</p>
                      <p className="text-sm text-muted-foreground">
                        Color: {selectedQuotation.colorSeleccionado.nombre} | Talla: {selectedQuotation.tallaSeleccionada}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Cantidad: <span className="font-medium">{selectedQuotation.cantidad} unidades</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Precio unitario</p>
                      <p className="font-bold">{formatPrice(selectedQuotation.producto.precio)}</p>
                    </div>
                  </div>
                </div>

                {/* Pricing */}
                {selectedQuotation.precioSugerido && (
                  <div className="p-4 border-2 border-accent/50 bg-accent/5 rounded-lg">
                    <div className="flex items-center gap-2 mb-3">
                      <Calculator className="w-4 h-4 text-accent" />
                      <h4 className="font-medium">Precio Cotizado</h4>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Precio Total</p>
                        <p className="text-2xl font-bold text-accent">
                          {formatPrice(selectedQuotation.precioSugerido)}
                        </p>
                      </div>
                      {selectedQuotation.fechaVencimiento && (
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Valido hasta</p>
                          <p className="font-medium">
                            {new Date(selectedQuotation.fechaVencimiento).toLocaleDateString('es-PE', {
                              day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC'
                            })}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDetailOpen(false)}>
                  Cerrar
                </Button>
                {selectedQuotation.estado === 'pendiente' && (
                  <Button onClick={() => {
                    setIsDetailOpen(false)
                    handleOpenQuote(selectedQuotation)
                  }}>
                    <Calculator className="w-4 h-4 mr-2" />
                    Enviar Cotizacion
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Quote Dialog */}
      <Dialog open={isQuoteOpen} onOpenChange={setIsQuoteOpen}>
        <DialogContent>
          {selectedQuotation && (
            <>
              <DialogHeader>
                <DialogTitle>Enviar Cotizacion</DialogTitle>
                <DialogDescription>
                  {selectedQuotation.producto.nombre} - {selectedQuotation.cantidad} unidades
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 py-4">
                {/* Price Calculation */}
                <div className="p-4 bg-muted/50 rounded-lg space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Precio unitario</span>
                    <span>{formatPrice(selectedQuotation.producto.precio)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Cantidad</span>
                    <span>{selectedQuotation.cantidad} uds</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>{formatPrice(selectedQuotation.producto.precio * selectedQuotation.cantidad)}</span>
                  </div>
                  {selectedQuotation.producto.descuentosVolumen.find(d => selectedQuotation.cantidad >= d.cantidadMinima) && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Descuento por volumen</span>
                      <span>
                        -{selectedQuotation.producto.descuentosVolumen.find(d => selectedQuotation.cantidad >= d.cantidadMinima)?.porcentajeDescuento}%
                      </span>
                    </div>
                  )}
                </div>

                {/* Quoted Price Input */}
                <div className="space-y-2">
                  <Label htmlFor="quotedPrice">Precio Final Cotizado (S/)</Label>
                  <Input
                    id="quotedPrice"
                    type="number"
                    step="0.01"
                    value={quotedPrice}
                    onChange={(e) => setQuotedPrice(e.target.value)}
                    className="text-lg font-bold"
                  />
                  <p className="text-xs text-muted-foreground">
                    Puedes ajustar el precio segun tu criterio
                  </p>
                </div>

                {/* Validity */}
                <div className="space-y-2">
                  <Label htmlFor="validity">Dias de Validez</Label>
                  <Input
                    id="validity"
                    type="number"
                    value={validityDays}
                    onChange={(e) => setValidityDays(e.target.value)}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsQuoteOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSendQuote}>
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
