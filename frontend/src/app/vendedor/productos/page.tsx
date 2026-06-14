"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
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
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Search,
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Package,
  Filter,
  AlertCircle,
  CheckCircle2,
  X,
  Percent,
  Upload,
  ImageIcon
} from "lucide-react"
import { formatPrice, categorias } from "@/lib/mock-data"
import type { Producto, DescuentoVolumen, ProductoVariante } from "@/lib/types"
import { AdminService, type CreateProductPayload } from "@/features/admin/services/admin.service"
import { Talla } from "@/lib/types"

// Helper to calculate total stock for a product
function getTotalStock(product: Producto): number {
  const variantes = (product as any).variantes || []

  if (variantes.length > 0) {
    return variantes.reduce((total: number, variante: any) => {
      return total + (Number(variante.stock) || 0)
    }, 0)
  }

  return product.stock || 0
}

// Helper to check if stock is low (less than 20 total units)
function isLowStock(product: Producto): boolean {
  return getTotalStock(product) < 20
}

// Helper to check if a specific size/color is out of stock
function getOutOfStockVariants(product: Producto): string[] {
  return (product.variantes || [])
    .filter((variante) => Number(variante.stock) === 0)
    .map((variante) => `${variante.colorNombre} ${variante.talla}`)
}

function getProductCategoryName(product: Producto): string {
  if (typeof product.categoria === 'string') return product.categoria
  return product.categoria?.nombre || 'Sin categoria'
}

function getProductDesignType(product: Producto): string {
  return product.esPersonalizable ? 'Personalizable' : 'No personalizable'
}

function isProductActive(product: Producto): boolean {
  return product.esActivo === true || product.estado === 'ACTIVO' || product.estado === 'activo'
}

function getStockByVariant(
  product: Producto,
  colorHex: string,
  talla: string,
): number | null {
  const variante = (product.variantes || []).find(
    (item) =>
      item.colorHex.toUpperCase() === colorHex.toUpperCase() &&
      item.talla === talla,
  )

  return variante ? Number(variante.stock) : null
}

interface ProductVariantFormData {
  idProductoVariante?: number
  colorNombre: string
  colorHex: string
  talla: Talla
  stock: number
}

interface ProductFormData {
  idCategoria: number
  nombre: string
  descripcion: string
  precioBase: number
  esPersonalizable: boolean
  variantes: ProductVariantFormData[]
  descuentosVolumen: DescuentoVolumen[]
  imagenPreviewUrl?: string | null
  codigo?: string
  precio?: number
  estado?: string
}

const defaultFormData: ProductFormData = {
  idCategoria: categorias[0]?.idCategoria ?? 1,
  nombre: "",
  descripcion: "",
  precioBase: 0,
  esPersonalizable: false,
  variantes: [],
  descuentosVolumen: [],
  imagenPreviewUrl: null,
  codigo: "",
  precio: 0,
  estado: "activo"
}

const availableSizes: Talla[] = [Talla.S, Talla.M, Talla.L, Talla.XL]

export default function VendedorProductsPage() {
  const [products, setProducts] = useState<Producto[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Producto | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [formData, setFormData] = useState<ProductFormData>(defaultFormData)

  const categoryOptions = useMemo(() => {
    const options = new Map<number, { idCategoria: number; nombre: string }>()

    categorias.forEach((categoria) => {
      options.set(categoria.idCategoria, {
        idCategoria: categoria.idCategoria,
        nombre: categoria.nombre,
      })
    })

    products.forEach((product) => {
      const categoria = typeof product.categoria === 'string' ? undefined : product.categoria
      if (categoria?.idCategoria) {
        options.set(categoria.idCategoria, {
          idCategoria: categoria.idCategoria,
          nombre: categoria.nombre,
        })
      }
    })

    return Array.from(options.values())
  }, [products])

  useEffect(() => {
    async function loadProducts() {
      try {
        setIsLoading(true)
        const data = await AdminService.getProducts()
        setProducts(data)
      } catch (error) {
        console.error("Error al cargar productos del vendedor:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadProducts()
  }, [])

  const filteredProducts = products.filter(product => {
    const matchesSearch = 
      product.nombre.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === "all" || getProductCategoryName(product) === categoryFilter;
    return matchesSearch && matchesCategory
  })

  const totalProducts = products.length
  const activeProducts = products.filter(p => isProductActive(p)).length
  const lowStockProducts = products.filter(p => isLowStock(p)).length
  const totalCategories = categoryOptions.length

  const handleAddVariant = () => {
    setFormData(prev => ({
      ...prev,
      variantes: [
        ...prev.variantes,
        {
          colorNombre: "Negro",
          colorHex: "#000000",
          talla: Talla.M,
          stock: 0,
        },
      ],
    }))
  }

  const handleUpdateVariant = (
    index: number,
    field: keyof ProductVariantFormData,
    value: string | number,
  ) => {
    setFormData(prev => ({
      ...prev,
      variantes: prev.variantes.map((variant, currentIndex) =>
        currentIndex === index ? { ...variant, [field]: value } : variant,
      ),
    }))
  }

  const handleRemoveVariant = (index: number) => {
    setFormData(prev => ({
      ...prev,
      variantes: prev.variantes.filter((_, currentIndex) => currentIndex !== index),
    }))
  }

  const handleImageSelected = (file: File) => {
    const reader = new FileReader()
    reader.onload = () => {
      setFormData(prev => ({
        ...prev,
        imagenPreviewUrl: typeof reader.result === 'string' ? reader.result : null,
      }))
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveImage = () => {
    setFormData(prev => ({
      ...prev,
      imagenPreviewUrl: null,
    }))
  }

  const handleAddDiscount = () => {
    const newDiscount: DescuentoVolumen = {
      idDescuento: Date.now(),
      cantidadMinima: 10,
      porcentajeDescuento: 5
    }
    setFormData(prev => ({
      ...prev,
      descuentosVolumen: [...prev.descuentosVolumen, newDiscount]
    }))
  }

  const handleUpdateDiscount = (index: number, field: 'cantidadMinima' | 'porcentajeDescuento', value: number) => {
    setFormData(prev => ({
      ...prev,
      descuentosVolumen: prev.descuentosVolumen.map((d, i) => 
        i === index ? { ...d, [field]: value } : d
      )
    }))
  }

  const handleRemoveDiscount = (index: number) => {
    setFormData(prev => ({
      ...prev,
      descuentosVolumen: prev.descuentosVolumen.filter((_, i) => i !== index)
    }))
  }

  const buildCreateProductPayload = (values: ProductFormData): CreateProductPayload => ({
    idCategoria: values.idCategoria,
    nombre: values.nombre,
    descripcion: values.descripcion,
    precioBase: values.precioBase || values.precio || 0,
    esPersonalizable: values.esPersonalizable,
    variantes: values.variantes.map((variant) => ({
      colorNombre: variant.colorNombre.trim(),
      colorHex: variant.colorHex.trim(),
      talla: variant.talla,
      stock: variant.stock,
    })),
    imagenes: [
      {
        colorHex: values.variantes[0]?.colorHex || "#000000",
        lado: "FRONT",
        urlImagen: "/placeholder.svg",
        displayOrder: 0,
      },
    ],
    descuentosVolumen: values.descuentosVolumen.map((discount) => ({
      cantidadMinima: discount.cantidadMinima,
      porcentajeDescuento: discount.porcentajeDescuento,
    })),
  })

  const handleSaveProduct = async () => {
    try {
      if (selectedProduct && isEditDialogOpen) {
        const updatedProduct = await AdminService.updateProduct(
          String(selectedProduct.idProducto),
          buildCreateProductPayload(formData)
        )

        setProducts((prevProducts) =>
          prevProducts.map((product) =>
            product.idProducto === selectedProduct.idProducto
              ? updatedProduct
              : product
          )
        )

        setIsEditDialogOpen(false)
      } else {
        const newProduct = await AdminService.createProduct(
          buildCreateProductPayload(formData)
        )

        setProducts((prevProducts) => [newProduct, ...prevProducts])
        setIsAddDialogOpen(false)
      }

      setFormData(defaultFormData)
      setSelectedProduct(null)
    } catch (error) {
      console.error("Error al guardar producto del vendedor:", error)
    }
  }

  const handleOpenEdit = (product: Producto) => {
    setSelectedProduct(product)
    setFormData({
      nombre: product.nombre,
      descripcion: product.descripcion,
      precioBase: product.precioBase,
      esPersonalizable: product.esPersonalizable,
      imagenPreviewUrl:
        typeof product.imagenes?.[0] === 'string' ? product.imagenes[0] : null,
      variantes: (product.variantes || []).map((variante: ProductoVariante) => ({
        idProductoVariante: variante.idProductoVariante,
        colorNombre: variante.colorNombre,
        colorHex: variante.colorHex,
        talla: variante.talla,
        stock: variante.stock,
      })),
      descuentosVolumen: product.descuentosVolumen || [],
      idCategoria: product.idCategoria,
      precio: product.precioBase,
      estado: "activo",
    })
    setIsEditDialogOpen(true)
  }

  const handleOpenAdd = () => {
    setFormData({
      ...defaultFormData,
      idCategoria: categoryOptions[0]?.idCategoria ?? defaultFormData.idCategoria,
    })
    setSelectedProduct(null)
    setIsAddDialogOpen(true)
  }

  const handleDeleteProduct = async (product: Producto) => {
    try {
      await AdminService.deleteProduct(String(product.idProducto))

      setProducts((prevProducts) =>
        prevProducts.map((p) =>
          p.idProducto === product.idProducto
            ? { ...p, esActivo: false, estado: "INACTIVO" }
            : p
        )
      )
    } catch (error) {
      console.error("Error al eliminar producto del vendedor:", error)
    }
  }

  // Reusable form component for both add and edit
  const ProductForm = ({ isEdit = false }: { isEdit?: boolean }) => (
    <div className="space-y-6 py-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(240px,1fr)_150px_220px]">
        <div className="space-y-2">
          <Label htmlFor="nombre">Nombre del Producto *</Label>
          <Input 
            id="nombre" 
            placeholder="Ej: Polo Premium" 
            value={formData.nombre}
            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="precio">Precio Base (S/) *</Label>
          <Input 
            id="precio" 
            type="number" 
            step="0.01" 
            placeholder="0.00" 
            value={formData.precio || ""}
            onChange={(e) => setFormData({ ...formData, precio: parseFloat(e.target.value) || 0, precioBase: parseFloat(e.target.value) || 0 })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="categoria">categoría *</Label>
          <Select 
            value={String(formData.idCategoria)}
            onValueChange={(value) => setFormData({ ...formData, idCategoria: Number(value) })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar" />
            </SelectTrigger>
            <SelectContent>
              {categoryOptions.map((categoria) => (
                <SelectItem key={categoria.idCategoria} value={String(categoria.idCategoria)}>
                  {categoria.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="descripcion">Descripción</Label>
        <Textarea 
          id="descripcion" 
          placeholder="Descripción del producto..." 
          rows={3} 
          value={formData.descripcion}
          onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label>Imagen del Producto</Label>
        <div
          className="rounded-lg border border-dashed bg-muted/20 p-4"
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault()
            const file = event.dataTransfer.files?.[0]
            if (file?.type.startsWith("image/")) handleImageSelected(file)
          }}
        >
          {formData.imagenPreviewUrl ? (
            <div className="flex items-center gap-4">
              <img
                src={formData.imagenPreviewUrl}
                alt="Previsualización del producto"
                className="h-24 w-24 rounded-md border object-cover"
              />
              <div className="flex-1">
                <p className="text-sm font-medium">Imagen seleccionada</p>
                <p className="text-xs text-muted-foreground">Previsualización local. Aún no se guarda en la base de datos.</p>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={handleRemoveImage}>
                Quitar
              </Button>
            </div>
          ) : (
            <label className="flex cursor-pointer flex-col items-center justify-center gap-2 py-6 text-center">
              <ImageIcon className="h-8 w-8 text-muted-foreground" />
              <span className="text-sm font-medium">Arrastra una imagen o haz clic para subir</span>
              <span className="text-xs text-muted-foreground">Solo se mostrará como previsualización por ahora.</span>
              <Input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0]
                  if (file) handleImageSelected(file)
                  event.target.value = ""
                }}
              />
              <span className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
                <Upload className="h-4 w-4" />
                Seleccionar imagen
              </span>
            </label>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
        <div>
          <Label htmlFor="personalizable">Producto Personalizable</Label>
          <p className="text-sm text-muted-foreground">Permite diseño personalizado</p>
        </div>
        <Switch
          id="personalizable"
          checked={formData.esPersonalizable}
          onCheckedChange={(checked) => setFormData({ ...formData, esPersonalizable: checked })}
        />
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>Variantes *</Label>
          <Button type="button" variant="outline" size="sm" onClick={handleAddVariant}>
            <Plus className="w-4 h-4 mr-1" />
            Agregar Variante
          </Button>
        </div>

        {formData.variantes.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4 border rounded-lg border-dashed">
            Agrega al menos una variante con color, talla y stock.
          </p>
        ) : (
          <div className="space-y-3">
            {formData.variantes.map((variant, index) => (
              <div key={variant.idProductoVariante ?? `variante-${index}`} className="grid grid-cols-1 gap-3 items-end p-3 border rounded-lg bg-muted/30 lg:grid-cols-[minmax(220px,1.5fr)_180px_100px_80px_auto]">
                <div className="space-y-1">
                  <Label className="text-xs">Color</Label>
                  <Input
                    value={variant.colorNombre}
                    onChange={(e) => handleUpdateVariant(index, 'colorNombre', e.target.value)}
                    placeholder="Negro"
                    className="h-9"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Hex</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="color"
                      key={variant.colorHex}
                      defaultValue={/^#[0-9A-Fa-f]{6}$/.test(variant.colorHex) ? variant.colorHex : "#000000"}
                      onBlur={(e) => handleUpdateVariant(index, 'colorHex', e.target.value.toUpperCase())}
                      className="h-9 w-12 cursor-pointer p-1"
                      aria-label="Seleccionar color"
                    />
                    <Input
                      value={variant.colorHex}
                      onChange={(e) => handleUpdateVariant(index, 'colorHex', e.target.value.toUpperCase())}
                      placeholder="#000000"
                      className="h-9 font-mono"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Talla</Label>
                  <Select
                    value={variant.talla}
                    onValueChange={(value) => handleUpdateVariant(index, 'talla', value)}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {availableSizes.map((size) => (
                        <SelectItem key={size} value={size}>{size}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Stock</Label>
                  <Input
                    type="number"
                    min="0"
                    value={variant.stock}
                    onChange={(e) => handleUpdateVariant(index, 'stock', parseInt(e.target.value) || 0)}
                    className="h-9"
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => handleRemoveVariant(index)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Volume Discounts Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="flex items-center gap-2">
            <Percent className="w-4 h-4" />
            Descuentos por Volumen
          </Label>
          <Button type="button" variant="outline" size="sm" onClick={handleAddDiscount}>
            <Plus className="w-4 h-4 mr-1" />
            Agregar Descuento
          </Button>
        </div>
        
        {formData.descuentosVolumen.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4 border rounded-lg border-dashed">
            No hay descuentos configurados. Agrega descuentos para pedidos por volumen.
          </p>
        ) : (
          <div className="space-y-3">
            {formData.descuentosVolumen.map((discount, index) => (
              <div key={discount.idDescuentoVolumen || discount.idDescuento || index} className="flex items-center gap-3 p-3 border rounded-lg bg-muted/30">
                <div className="flex-1 grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Cantidad Minima</Label>
                    <Input
                      type="number"
                      min="1"
                      value={discount.cantidadMinima}
                      onChange={(e) => handleUpdateDiscount(index, 'cantidadMinima', parseInt(e.target.value) || 0)}
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Descuento (%)</Label>
                    <Input
                      type="number"
                      min="1"
                      max="100"
                      value={discount.porcentajeDescuento}
                      onChange={(e) => handleUpdateDiscount(index, 'porcentajeDescuento', parseInt(e.target.value) || 0)}
                      className="h-9"
                    />
                  </div>
                </div>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="icon"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => handleRemoveDiscount(index)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {formData.descuentosVolumen.length > 0 && (
          <div className="p-3 bg-accent/10 rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong>Vista previa:</strong>{" "}
              {formData.descuentosVolumen
                .sort((a, b) => a.cantidadMinima - b.cantidadMinima)
                .map(d => `${d.cantidadMinima}+ uds = ${d.porcentajeDescuento}% desc.`)
                .join(" | ")}
            </p>
          </div>
        )}
      </div>

    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-primary">Gestión de Productos</h1>
          <p className="text-muted-foreground">Administra el catálogo de productos</p>
        </div>
        <Button onClick={handleOpenAdd}>
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Producto
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Total Productos</p>
            <p className="text-2xl font-bold">{totalProducts}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Activos</p>
            <p className="text-2xl font-bold text-green-600">{activeProducts}</p>
          </CardContent>
        </Card>
        <Card className="border-amber-200 bg-amber-50/50">
          <CardContent className="pt-4">
            <p className="text-sm text-amber-700">Stock Bajo</p>
            <p className="text-2xl font-bold text-amber-700">{lowStockProducts}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Categorías</p>
            <p className="text-2xl font-bold">{totalCategories}</p>
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
                placeholder="Buscar por nombre o codigo..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {categoryOptions.map(cat => (
                  <SelectItem key={cat.idCategoria} value={cat.nombre} className="capitalize">{cat.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card className="border-2">
        <CardContent className="pt-6">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Colores</TableHead>
                  <TableHead>Producto</TableHead>
                  <TableHead>Codigo</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead className="text-right">Precio</TableHead>
                  <TableHead>Stock Total</TableHead>
                  <TableHead>Descuentos</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => {
                  const totalStock = getTotalStock(product)
                  const lowStock = isLowStock(product)
                  const outOfStockVariants = getOutOfStockVariants(product)

                  return (
                    <TableRow key={product.idProducto}>
                      <TableCell>
                        <div className="flex -space-x-1">
                          {(product.colores || []).slice(0, 4).map((color) => (
                            <div
                              key={color.idColor}
                              className="w-8 h-8 rounded-full border-2 border-background"
                              style={{ backgroundColor: color.codigoHex }}
                              title={color.nombre}
                            />
                          ))}
                          {(product.colores || []).length > 4 && (
                            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium border-2 border-background">
                              +{(product.colores || []).length - 4}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{product.nombre}</p>
                          <p className="text-xs text-muted-foreground line-clamp-1 max-w-[200px]">
                            {product.descripcion}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{product.codigo}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="capitalize">
                          {getProductCategoryName(product)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatPrice(product.precio || product.precioBase)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {lowStock ? (
                            <span className="text-amber-600 flex items-center gap-1">
                              <AlertCircle className="w-4 h-4" />
                              {totalStock} uds
                            </span>
                          ) : totalStock === 0 ? (
                            <span className="text-red-600 flex items-center gap-1">
                              <X className="w-4 h-4" />
                              Agotado
                            </span>
                          ) : (
                            <span className="text-green-600 flex items-center gap-1">
                              <CheckCircle2 className="w-4 h-4" />
                              {totalStock} uds
                            </span>
                          )}
                        </div>
                        {outOfStockVariants.length > 0 && outOfStockVariants.length < 5 && (
                          <p className="text-xs text-red-500 mt-1">
                            Sin stock: {outOfStockVariants.slice(0, 2).join(', ')}
                            {outOfStockVariants.length > 2 && ` (+${outOfStockVariants.length - 2})`}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        {product.descuentosVolumen && product.descuentosVolumen.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {product.descuentosVolumen.slice(0, 2).map(d => (
                              <Badge key={d.idDescuentoVolumen || d.idDescuento} variant="outline" className="text-xs">
                                {d.cantidadMinima}+: {d.porcentajeDescuento}%
                              </Badge>
                            ))}
                            {product.descuentosVolumen.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{product.descuentosVolumen.length - 2}
                              </Badge>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">Sin descuentos</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={isProductActive(product) ? "default" : "secondary"}>
                          {isProductActive(product) ? "Activo" : "Inactivo"}
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
                            <DropdownMenuItem onClick={() => {
                              setSelectedProduct(product)
                              setIsViewDialogOpen(true)
                            }}>
                              <Eye className="w-4 h-4 mr-2" />
                              Ver Detalles
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleOpenEdit(product)}>
                              <Edit className="w-4 h-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleDeleteProduct(product)}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>

          {isLoading ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Cargando productos...
            </p>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-muted-foreground">No se encontraron productos</p>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Add Product Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="w-[calc(100vw-2rem)] sm:!max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Agregar Nuevo Producto</DialogTitle>
            <DialogDescription>
              Completa la información del producto
            </DialogDescription>
          </DialogHeader>
          <ProductForm />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSaveProduct}
              disabled={!formData.nombre || !(formData.precioBase || formData.precio) || formData.variantes.length === 0}
            >
              Guardar Producto
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Product Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="w-[calc(100vw-2rem)] sm:!max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Producto</DialogTitle>
            <DialogDescription>
              Modifica la información del producto
            </DialogDescription>
          </DialogHeader>
          <ProductForm isEdit />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSaveProduct}
              disabled={!formData.nombre || !(formData.precioBase || formData.precio) || formData.variantes.length === 0}
            >
              Guardar Cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Product Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="w-[calc(100vw-2rem)] sm:!max-w-4xl max-h-[90vh] overflow-y-auto overflow-x-hidden">
          {selectedProduct && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl">{selectedProduct.nombre}</DialogTitle>
                <DialogDescription>
                  Codigo: {selectedProduct.codigo}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6 py-4">
                {/* Product Info */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">Precio</p>
                    <p className="text-xl font-bold">{formatPrice(selectedProduct.precio || selectedProduct.precioBase)}</p>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">Categoria</p>
                    <p className="text-xl font-bold capitalize">{getProductCategoryName(selectedProduct)}</p>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">Stock Total</p>
                    <p className="text-xl font-bold">{getTotalStock(selectedProduct)} uds</p>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">Tipo Diseño</p>
                    <p className="text-xl font-bold capitalize">{getProductDesignType(selectedProduct)}</p>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <h4 className="font-medium mb-2">Descripción</h4>
                  <p className="text-muted-foreground">{selectedProduct.descripcion}</p>
                </div>

                {/* Colors */}
                <div>
                  <h4 className="font-medium mb-3">Colores Disponibles</h4>
                  <div className="flex flex-wrap gap-3">
                    {(selectedProduct.colores || []).map(color => (
                      <div key={color.idColor} className="flex items-center gap-2 p-2 border rounded-lg">
                        <div
                          className="w-6 h-6 rounded-full border"
                          style={{ backgroundColor: color.codigoHex }}
                        />
                        <span className="text-sm">{color.nombre}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Sizes */}
                <div>
                  <h4 className="font-medium mb-3">Tallas Disponibles</h4>
                  <div className="flex flex-wrap gap-2">
                    {(selectedProduct.tallas || []).map(size => (
                      <Badge key={size} variant="outline" className="px-4 py-2">
                        {size}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Stock by Variant */}
                <div>
                  <h4 className="font-medium mb-3">Stock por Variante</h4>
                  <div className="max-w-full overflow-x-auto rounded-lg border">
                    <Table className="min-w-full">
                      <TableHeader>
                        <TableRow>
                          <TableHead className="min-w-[160px]">Color</TableHead>
                          {(selectedProduct.tallas || []).map(size => (
                            <TableHead key={size} className="min-w-16 text-center">{size}</TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(selectedProduct.colores || []).map(color => (
                          <TableRow key={color.idColor}>
                            <TableCell className="font-medium">
                              <div className="flex min-w-0 items-center gap-2">
                                <div
                                  className="w-4 h-4 rounded-full border"
                                  style={{ backgroundColor: color.codigoHex }}
                                />
                                <span className="truncate">{color.nombre}</span>
                              </div>
                            </TableCell>
                            {(selectedProduct.tallas || []).map(size => {
                              const stockQty = getStockByVariant(
                                selectedProduct,
                                color.codigoHex,
                                size,
                              )
                              return (
                                <TableCell key={size} className="text-center">
                                  {stockQty === null ? (
                                    <span className="text-xs text-muted-foreground">-</span>
                                  ) : (
                                    <Badge
                                      variant={stockQty === 0 ? "destructive" : stockQty < 10 ? "secondary" : "default"}
                                    >
                                      {stockQty}
                                    </Badge>
                                  )}
                                </TableCell>
                              )
                            })}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {/* Volume Discounts */}
                <div>
                  <h4 className="font-medium mb-3">Descuentos por Volumen</h4>
                  {selectedProduct.descuentosVolumen && selectedProduct.descuentosVolumen.length > 0 ? (
                    <div className="flex flex-wrap gap-3">
                      {selectedProduct.descuentosVolumen.map(discount => (
                        <div key={discount.idDescuentoVolumen || discount.idDescuento} className="p-3 border rounded-lg text-center">
                          <p className="text-lg font-bold text-accent">{discount.porcentajeDescuento}%</p>
                          <p className="text-xs text-muted-foreground">+{discount.cantidadMinima} uds</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Este producto no tiene descuentos por volumen configurados.</p>
                  )}
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
                  Cerrar
                </Button>
                <Button onClick={() => {
                  setIsViewDialogOpen(false)
                  handleOpenEdit(selectedProduct)
                }}>
                  <Edit className="w-4 h-4 mr-2" />
                  Editar Producto
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
