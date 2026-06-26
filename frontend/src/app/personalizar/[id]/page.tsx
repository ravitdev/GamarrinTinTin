'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowDown,
  ArrowUp,
  ChevronLeft,
  Copy,
  Eye,
  EyeOff,
  FileText,
  Image as ImageIcon,
  Lock,
  Move,
  RotateCw,
  Trash2,
  Unlock,
  Upload,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { formatPrice } from '@/lib/mock-data';
import { ProductService } from '@/features/product/services/product.service';
import type { PredefinedDesign, Producto, ProductSize } from '@/lib/types';
import { cn } from '@/lib/utils';
import { DisenoPredefinidoService } from '@/features/disenos/services/diseno-predefinido.service';

import {
  type CustomizationDesign,
  type ProductSide,
  MAX_DESIGNS,
  ZOOM_STEP,
  serializeDesign,
} from '@/features/personalizar/canvas-types';
import { useProductCanvas } from '@/features/personalizar/hooks/use-product-canvas';

// ---------------------------------------------------------------------------
// CONSTANTES DE VALIDACIÓN DE ARCHIVOS
// ---------------------------------------------------------------------------
const VALID_TYPES = /^image\/(png|jpeg|jpg)$/;
const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB
const MIN_IMAGE_DIM = 500;
const MAX_IMAGE_DIM = 2000;

// ---------------------------------------------------------------------------
// PÁGINA PRINCIPAL
// ---------------------------------------------------------------------------
export default function CustomizePage() {
  const params = useParams();
  const router = useRouter();
  const productId = parseInt(params.id as string, 10);

  // ── Estado de negocio ──────────────────────────────────────────────────
  const [product, setProduct] = useState<Producto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [predefinedDesigns, setPredefinedDesigns] = useState<PredefinedDesign[]>([]);
  const [isLoadingPredefinedDesigns, setIsLoadingPredefinedDesigns] = useState(false);

  const [selectedColorIndex, setSelectedColorIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState<ProductSize | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [activeSide, setActiveSide] = useState<ProductSide>('pecho');

  const [designs, setDesigns] = useState<CustomizationDesign[]>([]);
  const [selectedDesignId, setSelectedDesignId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const canvasElRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const colores = product?.colores ?? [];
  const selectedColor = colores[selectedColorIndex] ?? { nombre: '', codigoHex: '', urlImagen: '' };
  const selectedDesign = designs.find((d) => d.id === selectedDesignId);
  const totalDesigns = designs.length;

  // ── Carga inicial de datos ─────────────────────────────────────────────
  useEffect(() => {
    async function cargarDatos() {
      try {
        setIsLoading(true);
        setIsLoadingPredefinedDesigns(true);

        const [prod, disenos] = await Promise.all([
          ProductService.getProductDetail(productId),
          DisenoPredefinidoService.listarActivos(),
        ]);

        setProduct(prod.esPersonalizable ? prod : null);

        setPredefinedDesigns(
          disenos.map((diseno) => ({
            id: diseno.idDisenoPredefinido ?? diseno.idDiseno ?? 0,
            idDisenoPredefinido: diseno.idDisenoPredefinido,
            nombre: diseno.nombre,
            urlImagen: diseno.urlImagen ?? diseno.imagen ?? '',
            imagen: diseno.urlImagen ?? diseno.imagen ?? '',
          })),
        );
      } finally {
        setIsLoading(false);
        setIsLoadingPredefinedDesigns(false);
      }
    }
    cargarDatos();
  }, [productId]);

  // ── Hook de canvas (toda la lógica de Fabric.js) ──────────────────────
  const {
    containerScale,
    zoom,
    addDesignToCanvas,
    removeDesignFromCanvas,
    selectDesignInCanvas,
    updateDesignInCanvas,
    setDesignVisible,
    setDesignLocked,
    bringDesignToFront,
    sendDesignToBack,
    changeZoom,
    resetZoom,
  } = useProductCanvas({
    canvasEl: canvasElRef.current,
    containerEl: containerRef.current,
    designs,
    activeSide,
    colorImageUrl: activeSide === 'pecho'
      ? (selectedColor.urlImagenFrontal || selectedColor.urlImagen)
      : (selectedColor.urlImagenTrasera || selectedColor.urlImagenFrontal || selectedColor.urlImagen),
    onDesignModified: useCallback(
      (id: string, updates: Partial<Omit<CustomizationDesign, 'id'>>) => {
        setDesigns((prev) => prev.map((d) => (d.id === id ? { ...d, ...updates } : d)));
        setSelectedDesignId(id);
      },
      [],
    ),
    onDesignSelected: useCallback((id: string | null) => {
      setSelectedDesignId(id);
    }, []),
    onLayerOrderChanged: useCallback((orderedIds: string[]) => {
      setDesigns((prev) => {
        const map = new Map(prev.map((d) => [d.id, d]));
        return orderedIds.map((id) => map.get(id)).filter(Boolean) as CustomizationDesign[];
      });
    }, []),
  });

  // ── Operaciones de diseño (negocio) ────────────────────────────────────

  const addDesign = useCallback(
    (newDesign: CustomizationDesign) => {
      setDesigns((prev) => [...prev, newDesign]);
      setSelectedDesignId(newDesign.id);
      addDesignToCanvas(newDesign);
    },
    [addDesignToCanvas],
  );

  const removeDesign = useCallback(
    (id: string) => {
      setDesigns((prev) => prev.filter((d) => d.id !== id));
      if (selectedDesignId === id) setSelectedDesignId(null);
      removeDesignFromCanvas(id);
    },
    [selectedDesignId, removeDesignFromCanvas],
  );

  const duplicateDesign = useCallback(
    (id: string) => {
      if (totalDesigns >= MAX_DESIGNS) {
        alert(`Solo puedes agregar hasta ${MAX_DESIGNS} diseños.`);
        return;
      }
      const design = designs.find((d) => d.id === id);
      if (!design) return;
      const newDesign: CustomizationDesign = {
        ...design,
        id: `${design.tipo.toLowerCase()}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        x: Math.min(90, design.x + 5),
        y: Math.min(90, design.y + 5),
      };
      addDesign(newDesign);
    },
    [designs, totalDesigns, addDesign],
  );

  const toggleVisibility = useCallback(
    (id: string) => {
      const design = designs.find((d) => d.id === id);
      if (!design) return;
      const nextVisible = design.visible !== false ? false : true;
      setDesigns((prev) => prev.map((d) => (d.id === id ? { ...d, visible: nextVisible } : d)));
      setDesignVisible(id, nextVisible);
      if (!nextVisible && selectedDesignId === id) setSelectedDesignId(null);
    },
    [designs, selectedDesignId, setDesignVisible],
  );

  const toggleLock = useCallback(
    (id: string) => {
      const design = designs.find((d) => d.id === id);
      if (!design) return;
      const nextLocked = !design.bloqueado;
      setDesigns((prev) => prev.map((d) => (d.id === id ? { ...d, bloqueado: nextLocked } : d)));
      setDesignLocked(id, nextLocked);
    },
    [designs, setDesignLocked],
  );

  const updateDesign = useCallback(
    (id: string, updates: Partial<CustomizationDesign>) => {
      setDesigns((prev) => prev.map((d) => (d.id === id ? { ...d, ...updates } : d)));
      updateDesignInCanvas(id, updates);
    },
    [updateDesignInCanvas],
  );

  // ── Validación y carga de archivos ─────────────────────────────────────
  const handleFileUpload = useCallback(
    (files: FileList | null) => {
      if (!files) return;
      const remaining = MAX_DESIGNS - totalDesigns;
      const toProcess = Array.from(files).slice(0, remaining);

      toProcess.forEach((file) => {
        if (!VALID_TYPES.test(file.type)) {
          alert('Solo se permiten archivos PNG o JPG');
          return;
        }
        if (file.size > MAX_FILE_SIZE_BYTES) {
          alert('El archivo debe ser menor a 2 MB');
          return;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
          const src = e.target?.result as string;
          const img = new window.Image();
          img.onload = () => {
            if (
              img.width < MIN_IMAGE_DIM ||
              img.height < MIN_IMAGE_DIM ||
              img.width > MAX_IMAGE_DIM ||
              img.height > MAX_IMAGE_DIM
            ) {
              alert('La imagen debe tener dimensiones entre 500×500 y 2000×2000 píxeles');
              return;
            }
            addDesign({
              id: `uploaded-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
              tipo: 'SUBIDO',
              file,
              nombre: file.name,
              preview: src,
              posicion: activeSide,
              x: 50,
              y: 50,
              scale: 1.0,
              rotation: 0,
              bloqueado: false,
              visible: true,
            });
          };
          img.src = src;
        };
        reader.readAsDataURL(file);
      });
    },
    [activeSide, totalDesigns, addDesign],
  );

  const handleSelectPredefinedDesign = useCallback(
    (diseno: PredefinedDesign) => {
      if (totalDesigns >= MAX_DESIGNS) {
        alert(`Solo puedes agregar hasta ${MAX_DESIGNS} diseños.`);
        return;
      }
      const imageUrl = diseno.urlImagen || diseno.imagen;
      if (!imageUrl) {
        alert('El diseño predefinido no tiene imagen disponible.');
        return;
      }
      addDesign({
        id: `predefined-${diseno.id}-${Date.now()}`,
        tipo: 'PREDEFINIDO',
        idDisenoPredefinido: diseno.idDisenoPredefinido ?? diseno.id,
        nombre: diseno.nombre,
        preview: imageUrl,
        posicion: activeSide,
        x: 50,
        y: 50,
        scale: 1.0,
        rotation: 0,
        bloqueado: false,
        visible: true,
      });
    },
    [activeSide, totalDesigns, addDesign],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      handleFileUpload(e.dataTransfer.files);
    },
    [handleFileUpload],
  );

  // ── Enviar cotización ──────────────────────────────────────────────────
  const handleRequestQuote = useCallback(() => {
    if (!product || !selectedSize || designs.length === 0) return;

    const customizationId = `customization-${Date.now()}`;
    const payload = {
      producto: { idProducto: product.idProducto, nombre: product.nombre },
      color: { nombre: selectedColor.nombre, codigoHex: selectedColor.codigoHex },
      talla: selectedSize,
      cantidad: quantity,
      designs: designs.map(serializeDesign),
    };

    window.sessionStorage.setItem(`gtt_customization_${customizationId}`, JSON.stringify(payload));

    const queryParams = new URLSearchParams({
      producto: String(product.idProducto),
      color: selectedColor.nombre,
      talla: selectedSize,
      cantidad: quantity.toString(),
      personalizacion: 'true',
      disenos: designs.length.toString(),
      customizationId,
    });

    router.push(`/solicitar-cotizacion?${queryParams.toString()}`);
  }, [product, selectedSize, designs, selectedColor, quantity, router]);

  // ── Estados de carga / error ───────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex flex-1 items-center justify-center bg-background">
          <div className="animate-pulse text-muted-foreground">Cargando producto…</div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex flex-1 items-center justify-center bg-background">
          <div className="text-center">
            <h1 className="text-2xl font-semibold text-foreground">
              Producto no disponible para personalización
            </h1>
            <Link href="/catalogo" className="mt-4 inline-block text-accent hover:underline">
              Volver al catálogo
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground selection:bg-indigo-500/20">
      <Header cartItemCount={2} />

      {/* Sub-header de contexto */}
      <div className="border-b border-border bg-card/50 px-6 py-4 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href={`/producto/${product.idProducto}`}
              className="flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ChevronLeft className="h-4 w-4" />
              Volver al Producto
            </Link>
            <span className="text-border">|</span>
            <span className="text-sm font-medium text-muted-foreground">Personalización</span>
            <span className="text-sm font-semibold text-foreground/80">{product.nombre}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
            Modo Editor Activo
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          LAYOUT 3 PANELES
      ════════════════════════════════════════════════════════════════ */}
      <main className="mx-auto w-full max-w-7xl flex-1 p-6">
        <div className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-4">

          {/* ── PANEL IZQUIERDO: herramientas y capas ─────────────── */}
          <div className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-5 shadow-sm lg:col-span-1">

            {/* Selector de lado */}
            <div>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Lado de Personalización
              </h3>
              <div className="flex gap-2">
                {(['pecho', 'espalda'] as ProductSide[]).map((side) => (
                  <button
                    key={side}
                    onClick={() => setActiveSide(side)}
                    className={cn(
                      'flex-1 rounded-xl border py-2.5 text-xs font-semibold transition-all duration-200',
                      activeSide === side
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm'
                        : 'border-border bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground',
                    )}
                  >
                    {side === 'pecho' ? 'Frente (Pecho)' : 'Posterior (Espalda)'}
                  </button>
                ))}
              </div>
            </div>

            {/* Subida de imágenes */}
            <div>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Agregar mis Imágenes
              </h3>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg"
                multiple
                onChange={(e) => handleFileUpload(e.target.files)}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={totalDesigns >= MAX_DESIGNS}
                className="group w-full flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border p-5 text-center transition-all hover:border-indigo-500/50 hover:bg-muted/40 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600 transition-transform duration-200 group-hover:scale-110">
                  <Upload className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground">Subir Archivos PNG/JPG</p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">Hasta 2 MB (Mín 500×500 px)</p>
                </div>
              </button>
            </div>

            {/* Lista de capas */}
            <div className="flex min-h-[180px] flex-1 flex-col">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Capas del Lienzo
                </h3>
                <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                  {totalDesigns}/{MAX_DESIGNS}
                </span>
              </div>

              {designs.length === 0 ? (
                <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 p-4 text-center">
                  <ImageIcon className="mb-1.5 h-6 w-6 text-muted-foreground/60" />
                  <p className="text-[11px] text-muted-foreground">
                    Sube o selecciona un elemento para empezar
                  </p>
                </div>
              ) : (
                <div className="max-h-[220px] space-y-2 overflow-y-auto pr-1">
                  {designs.map((design) => (
                    <div
                      key={design.id}
                      onClick={() => selectDesignInCanvas(design.id)}
                      className={cn(
                        'group flex cursor-pointer items-center gap-2.5 rounded-xl border p-2 transition-all hover:bg-muted/30',
                        selectedDesignId === design.id
                          ? 'border-indigo-600 bg-indigo-50/20'
                          : 'border-border bg-card',
                      )}
                    >
                      <img
                        src={design.preview}
                        alt={design.nombre}
                        className="h-9 w-9 rounded-md border bg-slate-50 object-contain"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium text-foreground">{design.nombre}</p>
                        <p className="text-[9px] capitalize text-muted-foreground">{design.posicion}</p>
                      </div>
                      <div className="flex items-center gap-0.5 opacity-80 transition-opacity group-hover:opacity-100">
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleVisibility(design.id); }}
                          className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                          title={design.visible !== false ? 'Ocultar' : 'Mostrar'}
                        >
                          {design.visible !== false
                            ? <Eye className="h-3 w-3" />
                            : <EyeOff className="h-3 w-3 text-destructive" />}
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); duplicateDesign(design.id); }}
                          className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                          title="Duplicar"
                        >
                          <Copy className="h-3 w-3" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); removeDesign(design.id); }}
                          className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-destructive"
                          title="Eliminar"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Galería de diseños predefinidos */}
            <div className="border-t border-border pt-4">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Diseños Predefinidos
              </h3>
              {isLoadingPredefinedDesigns ? (
                <div className="animate-pulse text-xs text-muted-foreground">Cargando galería…</div>
              ) : predefinedDesigns.length === 0 ? (
                <div className="text-xs text-muted-foreground">No hay galerías disponibles</div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {predefinedDesigns.map((diseno) => (
                    <button
                      key={diseno.idDisenoPredefinido ?? diseno.id}
                      type="button"
                      onClick={() => handleSelectPredefinedDesign(diseno)}
                      disabled={totalDesigns >= MAX_DESIGNS}
                      className="group aspect-square flex flex-col items-center justify-center gap-1 rounded-xl border border-border bg-muted/30 p-1 text-center transition-all hover:border-indigo-500/50 hover:bg-muted disabled:opacity-50"
                    >
                      <img
                        src={diseno.urlImagen || diseno.imagen}
                        alt={diseno.nombre}
                        className="h-10 w-10 rounded object-contain"
                      />
                      <span className="w-full truncate text-[9px] font-medium text-foreground">
                        {diseno.nombre}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── PANEL CENTRAL: Canvas de Fabric.js ────────────────── */}
          <div className="relative flex flex-col items-center justify-center overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm lg:col-span-2">
            <div
              ref={containerRef}
              className="relative flex w-full max-w-[500px] items-center justify-center"
              style={{ aspectRatio: '1' }}
            >
              <div
                style={{ transform: `scale(${containerScale})`, transformOrigin: 'center center' }}
                className={cn(
                  'overflow-hidden rounded-xl border border-border/80 bg-[#f8fafc] shadow-md transition-all duration-200',
                  isDragging && 'ring-2 ring-indigo-500/40',
                )}
                onDrop={handleDrop}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
              >
                {/* El elemento <canvas> que Fabric.js administra */}
                <canvas ref={canvasElRef} id="canvas-personalizacion" />
              </div>

              {isDragging && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-2xl border-2 border-dashed border-indigo-500 bg-indigo-600/5 backdrop-blur-[1px]">
                  <div className="flex animate-bounce flex-col items-center gap-1.5 rounded-xl border bg-white/95 px-4 py-3 text-indigo-700 shadow-lg">
                    <Upload className="h-6 w-6 text-indigo-600" />
                    <p className="text-xs font-semibold">Suelta tus imágenes aquí</p>
                  </div>
                </div>
              )}
            </div>

            {/* Barra de zoom flotante */}
            <div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full border border-border bg-white/95 px-3.5 py-1.5 shadow-lg backdrop-blur-md">
              <button
                onClick={() => changeZoom(zoom - ZOOM_STEP)}
                disabled={zoom <= 1.0}
                className="rounded p-1 text-slate-600 hover:bg-slate-100 disabled:opacity-30"
                title="Alejar"
              >
                <ZoomOut className="h-4 w-4" />
              </button>
              <span className="min-w-[45px] text-center text-xs font-semibold text-slate-700">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={() => changeZoom(zoom + ZOOM_STEP)}
                disabled={zoom >= 2.5}
                className="rounded p-1 text-slate-600 hover:bg-slate-100 disabled:opacity-30"
                title="Acercar"
              >
                <ZoomIn className="h-4 w-4" />
              </button>
              <span className="mx-1 h-4 w-px bg-slate-200" />
              <button
                onClick={resetZoom}
                className="rounded p-1 text-[10px] font-bold text-slate-600 hover:bg-slate-100"
                title="Restablecer zoom"
              >
                1:1
              </button>
            </div>
          </div>

          {/* ── PANEL DERECHO: propiedades del elemento seleccionado ── */}
          <div className="flex flex-col rounded-2xl border border-border bg-card p-5 shadow-sm lg:col-span-1">
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Propiedades del Elemento
            </h3>

            {selectedDesign ? (
              <div className="flex flex-1 flex-col space-y-5">
                <div>
                  <p className="text-xs font-semibold text-slate-400">Elemento seleccionado:</p>
                  <p className="mt-0.5 truncate text-xs font-semibold text-foreground">
                    {selectedDesign.nombre}
                  </p>
                </div>

                {/* Escala */}
                <div className="space-y-2">
                  <label className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <ZoomIn className="h-3.5 w-3.5" /> Tamaño / Escala
                    </span>
                    <span>{Math.round(selectedDesign.scale * 100)}%</span>
                  </label>
                  <Slider
                    value={[selectedDesign.scale]}
                    min={0.4} max={2.2} step={0.05}
                    disabled={selectedDesign.bloqueado}
                    onValueChange={([v]) => updateDesign(selectedDesign.id, { scale: v })}
                  />
                </div>

                {/* Rotación */}
                <div className="space-y-2">
                  <label className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <RotateCw className="h-3.5 w-3.5" /> Rotación
                    </span>
                    <span>{Math.round(selectedDesign.rotation)}°</span>
                  </label>
                  <Slider
                    value={[selectedDesign.rotation]}
                    min={-180} max={180} step={5}
                    disabled={selectedDesign.bloqueado}
                    onValueChange={([v]) => updateDesign(selectedDesign.id, { rotation: v })}
                  />
                </div>

                {/* Posición X */}
                <div className="space-y-2">
                  <label className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Move className="h-3.5 w-3.5" /> Posición X (Horizontal)
                    </span>
                    <span>{Math.round(selectedDesign.x)}%</span>
                  </label>
                  <Slider
                    value={[selectedDesign.x]}
                    min={0} max={100} step={1}
                    disabled={selectedDesign.bloqueado}
                    onValueChange={([v]) => updateDesign(selectedDesign.id, { x: v })}
                  />
                </div>

                {/* Posición Y */}
                <div className="space-y-2">
                  <label className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Move className="h-3.5 w-3.5 rotate-90" /> Posición Y (Vertical)
                    </span>
                    <span>{Math.round(selectedDesign.y)}%</span>
                  </label>
                  <Slider
                    value={[selectedDesign.y]}
                    min={0} max={100} step={1}
                    disabled={selectedDesign.bloqueado}
                    onValueChange={([v]) => updateDesign(selectedDesign.id, { y: v })}
                  />
                </div>

                {/* Organizar capas */}
                <div className="space-y-2.5 border-t border-border pt-2">
                  <span className="block text-xs font-semibold text-muted-foreground">Organizar Capas</span>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline" size="sm"
                      className="flex h-8 items-center gap-1 text-xs"
                      onClick={() => bringDesignToFront(selectedDesign.id)}
                    >
                      <ArrowUp className="h-3.5 w-3.5 text-slate-500" /> Traer al frente
                    </Button>
                    <Button
                      variant="outline" size="sm"
                      className="flex h-8 items-center gap-1 text-xs"
                      onClick={() => sendDesignToBack(selectedDesign.id)}
                    >
                      <ArrowDown className="h-3.5 w-3.5 text-slate-500" /> Enviar atrás
                    </Button>
                  </div>
                </div>

                {/* Bloquear / eliminar */}
                <div className="mt-auto space-y-2 border-t border-border pt-4">
                  <button
                    onClick={() => toggleLock(selectedDesign.id)}
                    className={cn(
                      'flex h-9 w-full items-center justify-center gap-2 rounded-lg border py-2 text-xs font-semibold transition-all',
                      selectedDesign.bloqueado
                        ? 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100/80'
                        : 'border-border text-slate-700 hover:bg-slate-50',
                    )}
                  >
                    {selectedDesign.bloqueado
                      ? <><Lock className="h-3.5 w-3.5 text-amber-600" /> Desbloquear</>
                      : <><Unlock className="h-3.5 w-3.5 text-slate-500" /> Bloquear en lienzo</>}
                  </button>
                  <Button
                    variant="outline"
                    className="h-9 w-full border-destructive/20 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => removeDesign(selectedDesign.id)}
                  >
                    <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Eliminar elemento
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 p-5 text-center">
                <ImageIcon className="mb-2 h-8 w-8 text-muted-foreground/40" />
                <p className="text-xs font-semibold text-muted-foreground">Sin elemento seleccionado</p>
                <p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">
                  Haz clic sobre una imagen en el lienzo o selecciónala en el panel de capas.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* ═══════════════════════════════════════════════════════════════
          BARRA INFERIOR STICKY
      ════════════════════════════════════════════════════════════════ */}
      <footer className="sticky bottom-0 z-10 border-t border-border bg-card/90 px-6 py-4 shadow-2xl backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">

          {/* Opciones del producto */}
          <div className="flex flex-wrap items-center gap-6">

            {/* Selector de color */}
            <div>
              <span className="mb-1 block text-[11px] font-bold uppercase text-muted-foreground">Color</span>
              <div className="flex gap-1.5">
                {colores.map((color, index) => (
                  <button
                    key={color.idColor}
                    onClick={() => setSelectedColorIndex(index)}
                    className={cn(
                      'relative h-7 w-7 rounded-full border-2 shadow-sm transition-all hover:scale-110',
                      selectedColorIndex === index
                        ? 'scale-105 border-indigo-600 ring-2 ring-indigo-600/30 ring-offset-1'
                        : 'border-border',
                    )}
                    style={{
                      backgroundColor: color.codigoHex,
                      boxShadow: color.codigoHex === '#FFFFFF' ? 'inset 0 0 0 1px rgba(0,0,0,0.1)' : undefined,
                    }}
                    title={color.nombre}
                  >
                    {selectedColorIndex === index && (
                      <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-slate-800">✓</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Selector de talla */}
            <div>
              <span className="mb-1 block text-[11px] font-bold uppercase text-muted-foreground">Talla</span>
              <div className="flex gap-1">
                {(product.tallas ?? []).map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size as ProductSize)}
                    className={cn(
                      'flex h-7 items-center justify-center rounded-md border px-2.5 text-[11px] font-bold transition-all hover:border-indigo-500/50',
                      selectedSize === size
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm'
                        : 'border-border bg-card text-muted-foreground hover:text-foreground',
                    )}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Cantidad */}
            <div>
              <span className="mb-1 block text-[11px] font-bold uppercase text-muted-foreground">Cantidad</span>
              <div className="flex h-7 items-center rounded-lg border border-border bg-muted/20">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="flex h-full w-7 items-center justify-center font-semibold text-muted-foreground hover:text-foreground"
                >
                  −
                </button>
                <input
                  type="number" min="1" value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="h-full w-10 border-none bg-transparent text-center text-xs font-semibold focus:outline-none"
                />
                <button
                  onClick={() => setQuantity((q) => q + 1)}
                  className="flex h-full w-7 items-center justify-center font-semibold text-muted-foreground hover:text-foreground"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Resumen + CTA */}
          <div className="ml-auto flex items-center gap-6">
            <div className="text-right">
              <div className="text-xs text-muted-foreground">
                Precio unitario:{' '}
                <span className="font-semibold text-foreground">
                  {formatPrice(product.precio ?? product.precioBase)}
                </span>
              </div>
              <div className="mt-0.5 text-xs text-muted-foreground">
                Diseños agregados:{' '}
                <span className="font-semibold text-foreground">{designs.length}</span>
              </div>
              <div className="mt-1 flex items-baseline justify-end gap-1.5 text-sm font-semibold text-foreground">
                Total estimado:
                <span className="text-lg font-bold text-indigo-600">
                  {formatPrice((product.precio ?? product.precioBase) * quantity)}
                </span>
              </div>
            </div>

            <div className="flex flex-col items-stretch gap-1">
              <Button
                className="h-11 gap-2 rounded-xl bg-indigo-600 px-6 font-semibold text-white shadow-md transition-all duration-300 hover:bg-indigo-700 active:scale-95"
                disabled={!selectedSize || designs.length === 0}
                onClick={handleRequestQuote}
              >
                <FileText className="h-4 w-4" />
                Solicitar Cotización
              </Button>
              {designs.length === 0 && (
                <p className="text-center text-[10px] text-muted-foreground">
                  Agrega al menos una imagen
                </p>
              )}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
