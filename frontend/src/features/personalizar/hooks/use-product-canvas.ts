'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  type CustomizationDesign,
  type ImageBounds,
  type PrintArea,
  type ProductSide,
  BASE_DESIGN_WIDTH,
  CANVAS_CENTER,
  CANVAS_SIZE,
  ZOOM_MAX,
  ZOOM_MIN,
  clampObjectToArea,
  clampRotationToArea,
  clampScaleToArea,
  fabricScaleToReact,
  getPrintArea,
  getPrintAreaFromBounds,
  getProductImageForSide,
  normalizeAngle,
  percentToPixels,
  reactScaleToFabric,
} from '../canvas-types';

// ---------------------------------------------------------------------------
// TIPOS DEL HOOK
// ---------------------------------------------------------------------------

/** Referencia extendida a un objeto de Fabric.js con metadatos de negocio. */
interface FabricImageObj {
  id: string;
  posicion: ProductSide;
  visible: boolean;
  selectable: boolean;
  evented: boolean;
  getCenterPoint(): { x: number; y: number };
  bringToFront(): void;
  moveTo(index: number): void;
  set(props: Record<string, unknown>): void;
  width: number;
  scaleX: number;
  angle: number;
}

export interface UseProductCanvasOptions {
  /** Elemento <canvas> DOM que Fabric.js usará. */
  canvasEl: HTMLCanvasElement | null;
  /** Elemento contenedor para el ResizeObserver responsivo. */
  containerEl: HTMLDivElement | null;
  /** Lista de diseños actuales (estado de React). */
  designs: CustomizationDesign[];
  /** Lado activo (pecho / espalda). */
  activeSide: ProductSide;
  /** URL de la imagen del polo según el color seleccionado (lado frente). */
  colorImageUrl: string;
  /** Callbacks para sincronizar React ↔ Canvas. */
  onDesignModified: (id: string, updates: Partial<Omit<CustomizationDesign, 'id'>>) => void;
  onDesignSelected: (id: string | null) => void;
  onLayerOrderChanged: (orderedIds: string[]) => void;
}

export interface UseProductCanvasReturn {
  /** Escala CSS del contenedor para responsividad. */
  containerScale: number;
  /** Nivel de zoom actual del canvas (1.0 = 100 %). */
  zoom: number;
  /** Agrega un diseño al canvas de Fabric.js. */
  addDesignToCanvas: (design: CustomizationDesign) => void;
  /** Elimina un objeto del canvas y libera sus recursos. */
  removeDesignFromCanvas: (id: string) => void;
  /** Selecciona un objeto en el canvas desde la lista de capas. */
  selectDesignInCanvas: (id: string) => void;
  /** Actualiza propiedades visuales de un objeto (desde sliders React → canvas). */
  updateDesignInCanvas: (id: string, updates: Partial<CustomizationDesign>) => void;
  /** Alterna visibilidad de un objeto sin eliminarlo del canvas. */
  setDesignVisible: (id: string, visible: boolean) => void;
  /** Aplica o quita el bloqueo de transformaciones sobre un objeto. */
  setDesignLocked: (id: string, locked: boolean) => void;
  /** Trae el objeto al frente de la pila de capas. */
  bringDesignToFront: (id: string) => void;
  /** Envía el objeto detrás del resto de diseños (pero delante del mockup). */
  sendDesignToBack: (id: string) => void;
  /** Cambia el zoom del canvas con clamp automático. */
  changeZoom: (newZoom: number) => void;
  /** Resetea zoom a 1:1. */
  resetZoom: () => void;
}

// ---------------------------------------------------------------------------
// HOOK
// ---------------------------------------------------------------------------

export function useProductCanvas({
  canvasEl,
  containerEl,
  designs,
  activeSide,
  colorImageUrl,
  onDesignModified,
  onDesignSelected,
  onLayerOrderChanged,
}: UseProductCanvasOptions): UseProductCanvasReturn {
  // Instancia de Fabric.js (cargada dinámicamente para evitar SSR issues)
  const fabricRef = useRef<any>(null);
  // Instancia del canvas de Fabric.js
  const canvasInstanceRef = useRef<any>(null);
  // Flag para evitar bucles de sincronización
  const isSyncingRef = useRef(false);
  // Referencia al activeSide actual (estable dentro de callbacks de Fabric)
  const activeSideRef = useRef<ProductSide>(activeSide);
  // Estado de escala CSS responsiva y zoom
  const [containerScale, setContainerScale] = useState(1.0);
  const [zoom, setZoom] = useState(1.0);
  // Cacheamos la URL de la imagen de fondo para evitar recargas innecesarias
  const bgImageUrlRef = useRef<string>('');
  const bgFabricObjRef = useRef<any>(null); // objeto Fabric de la imagen de fondo
  // Objetos estáticos del mockup (área de impresión) para cada lado
  const printAreaObjectsRef = useRef<{ pecho: any[]; espalda: any[] }>({
    pecho: [],
    espalda: [],
  });
  // Ángulo previo por objeto (para revertir rotación que exceda el área)
  const prevAngleRef = useRef<Record<string, number>>({});
  // Bounding box real de la imagen del producto en el canvas
  const imageBoundsRef = useRef<ImageBounds>({ left: 0, top: 0, width: 0, height: 0 });
  // Área imprimible calculada dinámicamente desde la imagen
  const printAreaRef = useRef<PrintArea>(getPrintArea('pecho'));
  // Ref al handler de transformación (evita stale closures en eventos de Fabric)
  const handleObjectModifiedRef = useRef<(e: any) => void>(() => {});

  // Mantener activeSideRef sincronizado con la prop
  useEffect(() => {
    activeSideRef.current = activeSide;
  }, [activeSide]);

  // -------------------------------------------------------------------------
  // 1. CARGA DINÁMICA DE FABRIC.JS
  // -------------------------------------------------------------------------
  useEffect(() => {
    import('fabric').then((module) => {
      fabricRef.current = module.fabric;
    });
  }, []);

  // -------------------------------------------------------------------------
  // 2. INICIALIZACIÓN DEL CANVAS (solo una vez)
  // -------------------------------------------------------------------------
  useEffect(() => {
    const fabric = fabricRef.current;
    if (!fabric || !canvasEl) return;

    const canvas = new fabric.Canvas(canvasEl, {
      width: CANVAS_SIZE,
      height: CANVAS_SIZE,
      backgroundColor: '#f8fafc',
      // Aumentar el área de toque para dispositivos móviles
      targetFindTolerance: 10,
      preserveObjectStacking: true,
    });

    canvasInstanceRef.current = canvas;

    // Eventos de transformación — usamos ref para evitar stale closures
    canvas.on('object:moving', (e: any) => handleObjectModifiedRef.current(e));
    canvas.on('object:scaling', (e: any) => handleObjectModifiedRef.current(e));
    canvas.on('object:rotating', (e: any) => handleObjectModifiedRef.current(e));
    canvas.on('object:modified', (e: any) => handleObjectModifiedRef.current(e));

    // Guardar ángulo previo antes de rotar (para poder revertir)
    canvas.on('mouse:down', (e: any) => {
      const obj = e.target;
      if (obj?.id) {
        prevAngleRef.current[obj.id] = obj.angle ?? 0;
      }
    });

    // Eventos de selección
    const extractId = (e: any): string | null => {
      const obj = e.selected?.[0] ?? e.target;
      return obj?.id ?? null;
    };

    canvas.on('selection:created', (e: any) => {
      if (isSyncingRef.current) return;
      onDesignSelected(extractId(e));
    });
    canvas.on('selection:updated', (e: any) => {
      if (isSyncingRef.current) return;
      onDesignSelected(extractId(e));
    });
    canvas.on('selection:cleared', () => {
      if (isSyncingRef.current) return;
      onDesignSelected(null);
    });

    return () => {
      canvas.dispose();
      canvasInstanceRef.current = null;
      bgFabricObjRef.current = null;
      printAreaObjectsRef.current = { pecho: [], espalda: [] };
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fabricRef.current, canvasEl]);

  // -------------------------------------------------------------------------
  // 3. RESIZE OBSERVER (escala CSS responsiva del contenedor)
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (!containerEl) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const newScale = Math.min(1.0, entry.contentRect.width / CANVAS_SIZE);
        setContainerScale(newScale);
      }
    });
    observer.observe(containerEl);
    return () => observer.disconnect();
  }, [containerEl]);

  // -------------------------------------------------------------------------
  // 4. CAMBIO DE IMAGEN DE FONDO DEL POLO (color o lado)
  //    Optimización: solo recarga si la URL cambió.
  // -------------------------------------------------------------------------
  useEffect(() => {
    const fabric = fabricRef.current;
    const canvas = canvasInstanceRef.current;
    if (!fabric || !canvas) return;

    const targetUrl = getProductImageForSide(colorImageUrl, activeSide);
    if (targetUrl === bgImageUrlRef.current && bgFabricObjRef.current) {
      // La URL no cambió: solo actualizamos visibilidad de los diseños
      applyActiveSideVisibility(canvas, activeSide);
      return;
    }

    bgImageUrlRef.current = targetUrl;

    fabric.Image.fromURL(
      targetUrl,
      (img: any) => {
        if (!img) return;

        // Eliminar la imagen de fondo anterior
        if (bgFabricObjRef.current) {
          canvas.remove(bgFabricObjRef.current);
        }

        img.set({
          selectable: false,
          evented: false,
          originX: 'center',
          originY: 'center',
          left: CANVAS_CENTER,
          top: CANVAS_CENTER,
        });
        img.scale(530 / img.height);

        canvas.insertAt(img, 0);
        bgFabricObjRef.current = img;

        // Calcular bounding box real de la imagen en el canvas
        const scaledWidth = img.width * (530 / img.height);
        const scaledHeight = 530;
        imageBoundsRef.current = {
          left: CANVAS_CENTER - scaledWidth / 2,
          top: CANVAS_CENTER - scaledHeight / 2,
          width: scaledWidth,
          height: scaledHeight,
        };

        // Calcular área imprimible desde los bounds de la imagen
        printAreaRef.current = getPrintAreaFromBounds(activeSide, imageBoundsRef.current);

        // Rebujar los objetos del área imprimible para este lado
        rebuildPrintAreaObjects(fabric, canvas, activeSide);

        // Actualizar visibilidad de los diseños
        applyActiveSideVisibility(canvas, activeSide);

        canvas.requestRenderAll();
      },
      { crossOrigin: 'anonymous' },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [colorImageUrl, activeSide]);

  // -------------------------------------------------------------------------
  // HELPERS INTERNOS
  // -------------------------------------------------------------------------

  /**
   * Alterna la visibilidad y selectabilidad de los objetos de diseño según
   * el lado activo, sin descargar ni recargar imágenes.
   * Esta es la optimización principal del cambio de lado (O(n) lineal).
   */
  const applyActiveSideVisibility = useCallback(
    (canvas: any, side: ProductSide) => {
      const objects: any[] = canvas.getObjects();
      objects.forEach((obj: any) => {
        if (!obj.id) return; // objetos del mockup (bg, rect, text)
        const isActive = obj.posicion === side;
        obj.set({
          visible: isActive ? obj._userVisible !== false : false,
          selectable: isActive,
          evented: isActive,
        });
      });
      canvas.discardActiveObject();
      canvas.requestRenderAll();
    },
    [],
  );

  /**
   * Elimina y recrea los objetos estáticos del área imprimible (rect + label)
   * para el lado activo. Usa requestRenderAll para encolar en rAF.
   */
  const rebuildPrintAreaObjects = useCallback(
    (fabric: any, canvas: any, side: ProductSide) => {
      // Limpiar objetos del área de impresión anteriores
      const allObjects: any[] = canvas.getObjects();
      allObjects.forEach((obj: any) => {
        if (obj._isPrintAreaObject) canvas.remove(obj);
      });

      const area: PrintArea = printAreaRef.current;

      const rect = new fabric.Rect({
        left: area.left,
        top: area.top,
        width: area.width,
        height: area.height,
        fill: 'transparent',
        stroke: 'rgba(79, 70, 229, 0.25)',
        strokeWidth: 1.5,
        strokeDashArray: [6, 4],
        selectable: false,
        evented: false,
        _isPrintAreaObject: true,
      });

      const label = new fabric.Text(area.label, {
        left: area.left + 5,
        top: area.top - 18,
        fontSize: 10,
        fill: '#94a3b8',
        fontFamily: 'Inter, sans-serif',
        fontWeight: '500',
        selectable: false,
        evented: false,
        _isPrintAreaObject: true,
      });

      canvas.add(rect, label);
    },
    [],
  );

  /**
   * Aplica los estilos de control de Fabric a un objeto de imagen de diseño.
   */
  const applyControlStyles = useCallback((obj: any, locked: boolean) => {
    obj.set({
      cornerColor: '#ffffff',
      cornerStrokeColor: '#6366f1',
      borderColor: '#6366f1',
      cornerSize: 12, // más grande para móviles
      cornerStyle: 'circle',
      borderDashArray: [3, 3],
      transparentCorners: false,
      padding: 4,
      lockMovementX: locked,
      lockMovementY: locked,
      lockScalingX: locked,
      lockScalingY: locked,
      lockRotation: locked,
      hasControls: !locked,
    });
  }, []);

  /**
   * Handler para los eventos de transformación de Fabric.js.
   * Aplica clamping de bounding box completo y sincroniza el estado de React.
   */
  const handleObjectModified = useCallback(
    (e: any) => {
      const obj = e.target as any;
      if (!obj?.id) return;

      const canvas = canvasInstanceRef.current;
      if (!canvas) return;

      const side = activeSideRef.current;
      const area = printAreaRef.current;
      const eventType = e.type;

      if (eventType === 'object:moving') {
        clampObjectToArea(obj, area);
      } else if (eventType === 'object:scaling') {
        clampScaleToArea(obj, area);
        clampObjectToArea(obj, area);
      } else if (eventType === 'object:rotating') {
        const savedAngle = prevAngleRef.current[obj.id] ?? obj.angle;
        clampRotationToArea(obj, savedAngle, area);
      } else if (eventType === 'object:modified') {
        clampScaleToArea(obj, area);
        clampObjectToArea(obj, area);
      }

      canvas.requestRenderAll();

      // Calcular valores normalizados para React
      const center = obj.getCenterPoint();
      const xPercent = ((center.x - area.left) / area.width) * 100;
      const yPercent = ((center.y - area.top) / area.height) * 100;
      const reactScale = fabricScaleToReact(obj.scaleX, obj.width);
      const rotation = normalizeAngle(obj.angle);

      isSyncingRef.current = true;
      onDesignModified(obj.id, {
        x: xPercent,
        y: yPercent,
        scale: reactScale,
        rotation,
      });

      // Liberar el flag después de que React termine de procesar
      setTimeout(() => {
        isSyncingRef.current = false;
      }, 50);
    },
    [onDesignModified],
  );

  // Mantener el ref del handler siempre actualizado (evita stale closures)
  useEffect(() => {
    handleObjectModifiedRef.current = handleObjectModified;
  }, [handleObjectModified]);

  // -------------------------------------------------------------------------
  // 5. API PÚBLICA DEL HOOK
  // -------------------------------------------------------------------------

  /** Agrega un diseño al canvas con todos los estilos de control. */
  const addDesignToCanvas = useCallback(
    (design: CustomizationDesign) => {
      const fabric = fabricRef.current;
      const canvas = canvasInstanceRef.current;
      if (!fabric || !canvas) return;

      const area = printAreaRef.current;
      const { left, top } = percentToPixels(design.x, design.y, area);

      fabric.Image.fromURL(
        design.preview,
        (imgObj: any) => {
          if (!imgObj) return;

          const scaleFactor = reactScaleToFabric(design.scale, imgObj.width);

          imgObj.set({
            left,
            top,
            scaleX: scaleFactor,
            scaleY: scaleFactor,
            angle: design.rotation,
            originX: 'center',
            originY: 'center',
          });

          applyControlStyles(imgObj, design.bloqueado ?? false);

          // Metadatos de negocio en el objeto de Fabric
          imgObj.id = design.id;
          imgObj.posicion = design.posicion;
          imgObj._userVisible = design.visible !== false;

          // Si el diseño pertenece al lado inactivo, ocultarlo inmediatamente
          const isActiveSide = design.posicion === activeSideRef.current;
          imgObj.set({
            visible: isActiveSide ? imgObj._userVisible : false,
            selectable: isActiveSide,
            evented: isActiveSide,
          });

          canvas.add(imgObj);
          imgObj.setCoords();

          // Restringir el objeto al área imprimible después de agregarlo
          clampScaleToArea(imgObj, area);
          clampObjectToArea(imgObj, area);

          if (isActiveSide) {
            canvas.setActiveObject(imgObj);
          }

          canvas.requestRenderAll();
        },
        { crossOrigin: 'anonymous' },
      );
    },
    [applyControlStyles],
  );

  /** Elimina un objeto del canvas y libera sus recursos. */
  const removeDesignFromCanvas = useCallback((id: string) => {
    const canvas = canvasInstanceRef.current;
    if (!canvas) return;

    const obj = canvas.getObjects().find((o: any) => o.id === id);
    if (obj) {
      // Si el objeto estaba activo, deseleccionar antes de eliminar
      if (canvas.getActiveObject() === obj) {
        canvas.discardActiveObject();
      }
      canvas.remove(obj);
      canvas.requestRenderAll();
    }
  }, []);

  /** Selecciona un diseño en el canvas desde la lista de capas. */
  const selectDesignInCanvas = useCallback((id: string) => {
    const canvas = canvasInstanceRef.current;
    if (!canvas) return;

    const obj = canvas.getObjects().find((o: any) => o.id === id);
    if (obj && obj.selectable) {
      canvas.setActiveObject(obj);
      canvas.requestRenderAll();
    }
  }, []);

  /**
   * Sincroniza cambios de sliders/inputs de React → Fabric.
   * Solo actualiza las propiedades que cambiaron (incremental).
   */
  const updateDesignInCanvas = useCallback(
    (id: string, updates: Partial<CustomizationDesign>) => {
      if (isSyncingRef.current) return;

      const canvas = canvasInstanceRef.current;
      if (!canvas) return;

      const obj = canvas.getObjects().find((o: any) => o.id === id) as any;
      if (!obj) return;

      const area = printAreaRef.current;
      let needsRender = false;

      if (updates.x !== undefined || updates.y !== undefined) {
        const currentCenter = obj.getCenterPoint();
        const currentX = ((currentCenter.x - area.left) / area.width) * 100;
        const currentY = ((currentCenter.y - area.top) / area.height) * 100;

        const { left, top } = percentToPixels(
          updates.x ?? currentX,
          updates.y ?? currentY,
          area,
        );
        obj.set({ left, top });
        obj.setCoords();
        needsRender = true;
      }

      if (updates.scale !== undefined) {
        const scaleFactor = reactScaleToFabric(updates.scale, obj.width);
        obj.set({ scaleX: scaleFactor, scaleY: scaleFactor });
        obj.setCoords();
        needsRender = true;
      }

      if (updates.rotation !== undefined) {
        obj.set({ angle: updates.rotation });
        obj.setCoords();
        needsRender = true;
      }

      if (needsRender) {
        clampObjectToArea(obj, area);
        if (updates.scale !== undefined) {
          clampScaleToArea(obj, area);
          clampObjectToArea(obj, area);
        }
        if (updates.rotation !== undefined) {
          clampRotationToArea(obj, obj.angle, area);
        }
        canvas.requestRenderAll();
      }
    },
    [],
  );

  /** Cambia la visibilidad de un objeto sin eliminarlo. */
  const setDesignVisible = useCallback((id: string, visible: boolean) => {
    const canvas = canvasInstanceRef.current;
    if (!canvas) return;

    const obj = canvas.getObjects().find((o: any) => o.id === id) as any;
    if (!obj) return;

    // Guardar la preferencia del usuario para restaurarla al cambiar de lado
    obj._userVisible = visible;

    // Solo aplicar si el objeto pertenece al lado activo
    if (obj.posicion === activeSideRef.current) {
      obj.set({ visible });
      if (!visible && canvas.getActiveObject() === obj) {
        canvas.discardActiveObject();
      }
      canvas.requestRenderAll();
    }
  }, []);

  /** Aplica o quita el bloqueo de transformaciones. */
  const setDesignLocked = useCallback(
    (id: string, locked: boolean) => {
      const canvas = canvasInstanceRef.current;
      if (!canvas) return;

      const obj = canvas.getObjects().find((o: any) => o.id === id) as any;
      if (obj) {
        applyControlStyles(obj, locked);
        canvas.requestRenderAll();
      }
    },
    [applyControlStyles],
  );

  /** Trae el objeto al frente y notifica el nuevo orden. */
  const bringDesignToFront = useCallback(
    (id: string) => {
      const canvas = canvasInstanceRef.current;
      if (!canvas) return;

      const obj = canvas.getObjects().find((o: any) => o.id === id) as any;
      if (!obj) return;

      obj.bringToFront();
      canvas.requestRenderAll();

      const orderedIds = canvas
        .getObjects()
        .filter((o: any) => o.id)
        .map((o: any) => o.id as string);
      onLayerOrderChanged(orderedIds);
    },
    [onLayerOrderChanged],
  );

  /** Envía el objeto detrás del resto de diseños (pero delante del mockup). */
  const sendDesignToBack = useCallback(
    (id: string) => {
      const canvas = canvasInstanceRef.current;
      if (!canvas) return;

      const obj = canvas.getObjects().find((o: any) => o.id === id) as any;
      if (!obj) return;

      // Índice justo encima de los objetos del mockup (sin id)
      const nonDesignCount = canvas.getObjects().filter((o: any) => !o.id).length;
      obj.moveTo(nonDesignCount);
      canvas.requestRenderAll();

      const orderedIds = canvas
        .getObjects()
        .filter((o: any) => o.id)
        .map((o: any) => o.id as string);
      onLayerOrderChanged(orderedIds);
    },
    [onLayerOrderChanged],
  );

  /** Cambia el zoom del canvas con clamp y usa requestRenderAll. */
  const changeZoom = useCallback((newZoom: number) => {
    const fabric = fabricRef.current;
    const canvas = canvasInstanceRef.current;
    if (!fabric || !canvas) return;

    const clamped = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, newZoom));
    setZoom(clamped);
    canvas.zoomToPoint(new fabric.Point(CANVAS_CENTER, CANVAS_CENTER), clamped);
    canvas.requestRenderAll();
  }, []);

  /** Restaura el zoom a 1:1. */
  const resetZoom = useCallback(() => {
    changeZoom(1.0);
  }, [changeZoom]);

  // -------------------------------------------------------------------------
  // RETORNO DE LA INTERFAZ PÚBLICA
  // -------------------------------------------------------------------------
  return {
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
  };
}
