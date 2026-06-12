'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ChevronLeft, 
  Upload, 
  Trash2, 
  Move, 
  ZoomIn, 
  ZoomOut,
  RotateCw,
  ShoppingCart,
  FileText,
  Image as ImageIcon,
  X,
  Check,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { formatPrice } from '@/lib/mock-data';
import { ProductService } from '@/features/product/services/product.service';
import type { ProductSize, Producto } from '@/lib/types';
import { cn } from '@/lib/utils';

interface UploadedDesign {
  id: string;
  file: File;
  preview: string;
  posicion: 'pecho' | 'espalda';
  x: number;
  y: number;
  scale: number;
  rotation: number;
}

export default function CustomizePage() {
  const params = useParams();
  const router = useRouter();
  const productId = parseInt(params.id as string, 10);
  
  const [product, setProduct] = useState<Producto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    ProductService.getProductDetail(productId)
      .then((prod) => {
        if (prod.esPersonalizable) {
          setProduct(prod);
        } else {
          setProduct(null);
        }
      })
      .finally(() => setIsLoading(false));
  }, [productId]);
  
  const [selectedColorIndex, setSelectedColorIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState<ProductSize | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [activeSide, setActiveSide] = useState<'pecho' | 'espalda'>('pecho');
  const [designs, setDesigns] = useState<UploadedDesign[]>([]);
  const [selectedDesignId, setSelectedDesignId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex flex-1 items-center justify-center">
          <div className="text-muted-foreground">Cargando producto...</div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-semibold text-foreground">Producto no disponible para personalizacion</h1>
            <Link href="/catalogo" className="mt-4 text-accent hover:underline">
              Volver al catalogo
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const colores = product.colores || [];
  const selectedColor = colores[selectedColorIndex] || { nombre: '', codigoHex: '', urlImagen: '' };
  const currentSideDesigns = designs.filter(d => d.posicion === activeSide);
  const selectedDesign = designs.find(d => d.id === selectedDesignId);
  const totalDesigns = designs.length;
  const maxDesigns = 6;

  const handleFileUpload = useCallback((files: FileList | null) => {
    if (!files) return;

    const remainingSlots = maxDesigns - totalDesigns;
    const filesToProcess = Array.from(files).slice(0, remainingSlots);

    filesToProcess.forEach((file) => {
      // Validate file type
      if (!file.type.match(/^image\/(png|jpeg|jpg)$/)) {
        alert('Solo se permiten archivos PNG o JPG');
        return;
      }

      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        alert('El archivo debe ser menor a 2MB');
        return;
      }

      // Create preview and validate dimensions
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new window.Image();
        img.onload = () => {
          if (img.width < 500 || img.height < 500 || img.width > 2000 || img.height > 2000) {
            alert('La imagen debe tener dimensiones entre 500x500 y 2000x2000 pixeles');
            return;
          }

          const newDesign: UploadedDesign = {
            id: `design-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            file,
            preview: e.target?.result as string,
            posicion: activeSide,
            x: 50, // Center
            y: 50,
            scale: 1,
            rotation: 0,
          };

          setDesigns((prev) => [...prev, newDesign]);
          setSelectedDesignId(newDesign.id);
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  }, [activeSide, totalDesigns]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileUpload(e.dataTransfer.files);
  }, [handleFileUpload]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const updateDesign = (id: string, updates: Partial<UploadedDesign>) => {
    setDesigns((prev) => prev.map((d) => 
      d.id === id ? { ...d, ...updates } : d
    ));
  };

  const removeDesign = (id: string) => {
    setDesigns((prev) => prev.filter((d) => d.id !== id));
    if (selectedDesignId === id) {
      setSelectedDesignId(null);
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header cartItemCount={2} />

      <main className="flex-1 py-8">
        <div className="container mx-auto px-4">
          {/* Breadcrumb */}
          <nav className="mb-6 flex items-center gap-2 text-sm">
            <Link href={`/producto/${product.idProducto}`} className="flex items-center gap-1 text-muted-foreground hover:text-foreground">
              <ChevronLeft className="h-4 w-4" />
              Volver al Producto
            </Link>
          </nav>

          <h1 className="mb-8 font-serif text-3xl font-semibold text-foreground">
            Personaliza tu {product.nombre}
          </h1>

          <div className="grid gap-8 lg:grid-cols-3">
            {/* Canvas Area */}
            <div className="lg:col-span-2">
              <div className="rounded-2xl border border-border bg-card p-6">
                {/* Side Toggle */}
                <div className="mb-4 flex gap-2">
                  <button
                    onClick={() => setActiveSide('pecho')}
                    className={cn(
                      'flex-1 rounded-lg border py-2 text-sm font-medium transition-colors',
                      activeSide === 'pecho'
                        ? 'border-accent bg-accent text-accent-foreground'
                        : 'border-border bg-muted text-muted-foreground hover:border-accent/50'
                    )}
                  >
                    Pecho (Frente)
                  </button>
                  <button
                    onClick={() => setActiveSide('espalda')}
                    className={cn(
                      'flex-1 rounded-lg border py-2 text-sm font-medium transition-colors',
                      activeSide === 'espalda'
                        ? 'border-accent bg-accent text-accent-foreground'
                        : 'border-border bg-muted text-muted-foreground hover:border-accent/50'
                    )}
                  >
                    Espalda
                  </button>
                </div>

                {/* Design Canvas */}
                <div
                  ref={canvasRef}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  className={cn(
                    'relative mx-auto aspect-[3/4] max-w-md overflow-hidden rounded-xl border-2 border-dashed transition-colors',
                    isDragging ? 'border-accent bg-accent/5' : 'border-border bg-secondary'
                  )}
                >
                  {/* T-Shirt Mockup */}
                  <div 
                    className="absolute inset-4 flex items-center justify-center"
                  >
                    <div 
                      className="h-full w-4/5 rounded-xl border border-border/50"
                      style={{ 
                        backgroundColor: selectedColor.codigoHex === '#FFFFFF' ? '#f8f8f8' : selectedColor.codigoHex 
                      }}
                    >
                      {/* Print Area Indicator */}
                      <div className="relative h-full p-8">
                        <div className="absolute inset-x-8 top-1/4 bottom-1/4 border border-dashed border-foreground/20 rounded-lg">
                          <span className="absolute -top-6 left-0 text-xs text-muted-foreground">
                            Area de impresion (32x38cm)
                          </span>
                        </div>

                        {/* Rendered Designs */}
                        {currentSideDesigns.map((design: any) => (
                          <div
                            key={design.id}
                            onClick={() => setSelectedDesignId(design.id)}
                            className={cn(
                              'absolute cursor-move transition-shadow',
                              selectedDesignId === design.id && 'ring-2 ring-accent ring-offset-2'
                            )}
                            style={{
                              left: `${design.x}%`,
                              top: `${design.y}%`,
                              transform: `translate(-50%, -50%) scale(${design.scale}) rotate(${design.rotation}deg)`,
                            }}
                          >
                            <img
                              src={design.preview}
                              alt="Diseno personalizado"
                              className="h-20 w-20 object-contain pointer-events-none"
                              draggable={false}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Drop Zone Overlay */}
                  {isDragging && (
                    <div className="absolute inset-0 flex items-center justify-center bg-accent/10">
                      <div className="rounded-lg bg-card p-4 shadow-lg">
                        <Upload className="mx-auto h-8 w-8 text-accent" />
                        <p className="mt-2 text-sm font-medium text-foreground">Suelta tu imagen aqui</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Upload Button */}
                <div className="mt-4 flex items-center justify-between">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/jpg"
                    multiple
                    onChange={(e) => handleFileUpload(e.target.files)}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={totalDesigns >= maxDesigns}
                    className="gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    Subir Imagen
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    {totalDesigns} / {maxDesigns} imagenes
                  </span>
                </div>

                {/* Image Requirements */}
                <div className="mt-4 rounded-lg bg-muted p-3">
                  <p className="text-xs text-muted-foreground">
                    <strong>Requisitos:</strong> PNG o JPG, entre 500x500 y 2000x2000 pixeles, maximo 2MB
                  </p>
                </div>
              </div>

              {/* Design Controls */}
              {selectedDesign && (
                <div className="mt-4 rounded-xl border border-border bg-card p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium text-foreground">Ajustar Diseno</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => removeDesign(selectedDesign.id)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Eliminar
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {/* Scale */}
                    <div>
                      <label className="mb-2 flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2">
                          <ZoomIn className="h-4 w-4 text-muted-foreground" />
                          Tamano
                        </span>
                        <span className="text-muted-foreground">{Math.round(selectedDesign.scale * 100)}%</span>
                      </label>
                      <Slider
                        value={[selectedDesign.scale]}
                        min={0.5}
                        max={2}
                        step={0.1}
                        onValueChange={([value]) => updateDesign(selectedDesign.id, { scale: value })}
                      />
                    </div>

                    {/* Position X */}
                    <div>
                      <label className="mb-2 flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2">
                          <Move className="h-4 w-4 text-muted-foreground" />
                          Posicion Horizontal
                        </span>
                        <span className="text-muted-foreground">{Math.round(selectedDesign.x)}%</span>
                      </label>
                      <Slider
                        value={[selectedDesign.x]}
                        min={10}
                        max={90}
                        step={1}
                        onValueChange={([value]) => updateDesign(selectedDesign.id, { x: value })}
                      />
                    </div>

                    {/* Position Y */}
                    <div>
                      <label className="mb-2 flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2">
                          <Move className="h-4 w-4 text-muted-foreground rotate-90" />
                          Posicion Vertical
                        </span>
                        <span className="text-muted-foreground">{Math.round(selectedDesign.y)}%</span>
                      </label>
                      <Slider
                        value={[selectedDesign.y]}
                        min={10}
                        max={90}
                        step={1}
                        onValueChange={([value]) => updateDesign(selectedDesign.id, { y: value })}
                      />
                    </div>

                    {/* Rotation */}
                    <div>
                      <label className="mb-2 flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2">
                          <RotateCw className="h-4 w-4 text-muted-foreground" />
                          Rotacion
                        </span>
                        <span className="text-muted-foreground">{selectedDesign.rotation}°</span>
                      </label>
                      <Slider
                        value={[selectedDesign.rotation]}
                        min={-180}
                        max={180}
                        step={5}
                        onValueChange={([value]) => updateDesign(selectedDesign.id, { rotation: value })}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Uploaded Images List */}
              {designs.length > 0 && (
                <div className="mt-4">
                  <h3 className="mb-3 text-sm font-medium text-foreground">Imagenes subidas</h3>
                  <div className="flex flex-wrap gap-2">
                    {designs.map((design: any) => (
                      <div
                        key={design.id}
                        onClick={() => {
                          setActiveSide(design.posicion);
                          setSelectedDesignId(design.id);
                        }}
                        className={cn(
                          'relative h-16 w-16 cursor-pointer overflow-hidden rounded-lg border-2 transition-all',
                          selectedDesignId === design.id
                            ? 'border-accent ring-2 ring-accent/30'
                            : 'border-border hover:border-accent/50'
                        )}
                      >
                        <img
                          src={design.preview}
                          alt="Diseno"
                          className="h-full w-full object-cover"
                        />
                        <span className="absolute bottom-0 left-0 right-0 bg-primary/80 py-0.5 text-center text-[10px] text-primary-foreground capitalize">
                          {design.posicion}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeDesign(design.id);
                          }}
                          className="absolute -right-1 -top-1 rounded-full bg-destructive p-0.5 text-destructive-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:opacity-100"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar - Product Options */}
            <div className="space-y-6">
              <div className="rounded-xl border border-border bg-card p-6">
                <h2 className="font-serif text-xl font-semibold text-foreground">
                  {product.nombre}
                </h2>
                <p className="mt-1 text-2xl font-semibold text-accent">
                  {formatPrice(product.precio || product.precioBase)}
                </p>

                {/* Color Selection */}
                <div className="mt-6">
                  <label className="mb-3 block text-sm font-medium text-foreground">
                    Color: <span className="font-normal text-muted-foreground">{selectedColor.nombre}</span>
                  </label>
                  <div className="flex gap-2">
                    {colores.map((color, index) => (
                      <button
                        key={color.idColor}
                        onClick={() => setSelectedColorIndex(index)}
                        className={cn(
                          'h-8 w-8 rounded-full border-2 transition-all',
                          selectedColorIndex === index
                            ? 'border-accent ring-2 ring-accent/30'
                            : 'border-border hover:border-muted-foreground'
                        )}
                        style={{ 
                          backgroundColor: color.codigoHex,
                          boxShadow: color.codigoHex === '#FFFFFF' ? 'inset 0 0 0 1px rgba(0,0,0,0.1)' : 'none'
                        }}
                        title={color.nombre}
                      >
                        <span className="sr-only">{color.nombre}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Size Selection */}
                <div className="mt-6">
                  <label className="mb-3 block text-sm font-medium text-foreground">
                    Talla
                  </label>
                  <div className="flex gap-2">
                    {(product.tallas || []).map((size) => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size as ProductSize)}
                        className={cn(
                          'flex h-10 w-10 items-center justify-center rounded-lg border text-sm font-medium transition-colors',
                          selectedSize === size
                            ? 'border-accent bg-accent text-accent-foreground'
                            : 'border-border bg-card hover:border-accent/50'
                        )}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quantity */}
                <div className="mt-6">
                  <label className="mb-3 block text-sm font-medium text-foreground">
                    Cantidad
                  </label>
                  <div className="flex items-center rounded-lg border border-border">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="flex h-10 w-10 items-center justify-center text-muted-foreground hover:text-foreground"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="h-10 flex-1 border-x border-border bg-transparent text-center text-sm focus:outline-none"
                    />
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="flex h-10 w-10 items-center justify-center text-muted-foreground hover:text-foreground"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Summary */}
                <div className="mt-6 rounded-lg bg-muted p-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Precio unitario</span>
                    <span className="text-foreground">{formatPrice(product.precio || product.precioBase)}</span>
                  </div>
                  <div className="mt-2 flex justify-between text-sm">
                    <span className="text-muted-foreground">Cantidad</span>
                    <span className="text-foreground">{quantity}</span>
                  </div>
                  <div className="mt-2 flex justify-between text-sm">
                    <span className="text-muted-foreground">Disenos</span>
                    <span className="text-foreground">{designs.length}</span>
                  </div>
                  <div className="mt-3 border-t border-border pt-3 flex justify-between">
                    <span className="font-medium text-foreground">Total estimado</span>
                    <span className="font-semibold text-foreground">{formatPrice((product.precio || product.precioBase) * quantity)}</span>
                  </div>
                </div>

                {/* Warning for custom products */}
                <div className="mt-4 flex items-start gap-2 rounded-lg bg-accent/10 p-3">
                  <AlertTriangle className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                  <p className="text-xs text-muted-foreground">
                    Los productos personalizados requieren una cotizacion para confirmar el precio final de produccion.
                  </p>
                </div>

                {/* Actions */}
                <div className="mt-6 space-y-3">
                  <Button 
                    className="w-full gap-2 bg-accent text-accent-foreground hover:bg-accent/90"
                    disabled={!selectedSize || designs.length === 0}
                    onClick={() => {
                      // Build URL with all customization data
                      const params = new URLSearchParams({
                        producto: String(product.idProducto),
                        color: selectedColor.nombre,
                        talla: selectedSize || '',
                        cantidad: quantity.toString(),
                        personalizacion: 'true',
                        disenos: designs.length.toString()
                      });
                      router.push(`/solicitar-cotizacion?${params.toString()}`);
                    }}
                  >
                    <FileText className="h-4 w-4" />
                    Solicitar Cotizacion
                  </Button>
                  {designs.length === 0 && (
                    <p className="text-center text-xs text-muted-foreground">
                      Sube al menos una imagen para continuar
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
