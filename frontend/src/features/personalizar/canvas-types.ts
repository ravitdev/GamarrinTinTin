export type ProductSide = 'pecho' | 'espalda';
export type DesignSource = 'SUBIDO' | 'PREDEFINIDO';

/**
 * COORDENADAS NORMALIZADAS:
 *   x, y  → porcentaje (0–100) dentro del área imprimible.
 *   scale → relativo al ancho base de referencia (BASE_DESIGN_WIDTH px).
 *   rotation → grados (-180 a 180).
 */
export interface CustomizationDesign {
  id: string;
  tipo: DesignSource;
  /** Solo presente en diseños SUBIDO. No se serializa a BD. */
  file?: File;
  /** Referencia al diseño predefinido del backend (solo PREDEFINIDO). */
  idDisenoPredefinido?: number;
  nombre: string;
  /** URL o DataURL para cargar la imagen en Fabric.js. */
  preview: string;
  posicion: ProductSide;
  /** Coordenada X normalizada (0–100 %) dentro del área imprimible. */
  x: number;
  /** Coordenada Y normalizada (0–100 %) dentro del área imprimible. */
  y: number;
  /** Factor de escala relativo al ancho base (1.0 = tamaño original base). */
  scale: number;
  /** Rotación en grados, rango [-180, 180]. */
  rotation: number;
  /** Si es true el usuario no puede mover ni escalar el elemento en el canvas. */
  bloqueado?: boolean;
  /** Si es false el objeto existe pero no se renderiza. */
  visible?: boolean;
}

// ---------------------------------------------------------------------------
// CONSTANTES DEL CANVAS
// ---------------------------------------------------------------------------

/** Tamaño lógico del canvas de Fabric.js (en píxeles). */
export const CANVAS_SIZE = 600 as const;

/** Centro lógico del canvas (usado para zoomToPoint). */
export const CANVAS_CENTER = CANVAS_SIZE / 2;

/**
 * Ancho de referencia que se usa para calcular el scaleFactor de Fabric.
 * Al agregar una imagen con scale=1 en React, ocupará BASE_DESIGN_WIDTH px.
 */
export const BASE_DESIGN_WIDTH = 120 as const;

/** Número máximo de diseños permitidos por producto. */
export const MAX_DESIGNS = 6 as const;

/** Límites de zoom del canvas. */
export const ZOOM_MIN = 1.0 as const;
export const ZOOM_MAX = 2.5 as const;
export const ZOOM_STEP = 0.25 as const;

// ---------------------------------------------------------------------------
// ÁREA IMPRIMIBLE (PrintArea)
// ---------------------------------------------------------------------------

/**
 * Región rectangular dentro del canvas donde el usuario puede colocar diseños.
 * Las coordenadas están en píxeles del canvas (no en porcentaje).
 */
export interface PrintArea {
  left: number;
  top: number;
  width: number;
  height: number;
  label: string;
}

/**
 * Dimensiones y posición del bounding box de la imagen del producto en el canvas.
 */
export interface ImageBounds {
  left: number;
  top: number;
  width: number;
  height: number;
}

/**
 * Área imprimible definida como porcentuales del bounding box de la imagen.
 * Esto garantiza que el área siempre quede centrada en la imagen
 * sin importar el tamaño del canvas, zoom o resolución.
 */
export interface PrintAreaPercent {
  leftPercent: number;
  topPercent: number;
  widthPercent: number;
  heightPercent: number;
  label: string;
}

/**
 * Porcentuales del área imprimible relativos al bounding box de la imagen.
 * Calculados para que coincidan con los valores absolutos originales
 * cuando la imagen mide 424×530 px en el canvas.
 */
export const PRINT_AREA_PERCENT: Record<ProductSide, PrintAreaPercent> = {
  pecho: {
    leftPercent: 20.5,
    topPercent: 21.7,
    widthPercent: 59,
    heightPercent: 56.6,
    label: 'Área de impresión Pecho (32×38 cm)',
  },
  espalda: {
    leftPercent: 20.5,
    topPercent: 18.9,
    widthPercent: 59,
    heightPercent: 62.3,
    label: 'Área de impresión Espalda (32×38 cm)',
  },
};

/**
 * Calcula el área imprimible en píxeles a partir del bounding box real
 * de la imagen del producto y los porcentuales definidos por lado.
 */
export function getPrintAreaFromBounds(
  side: ProductSide,
  bounds: ImageBounds,
): PrintArea {
  const pct = PRINT_AREA_PERCENT[side];
  return {
    left: bounds.left + (pct.leftPercent / 100) * bounds.width,
    top: bounds.top + (pct.topPercent / 100) * bounds.height,
    width: (pct.widthPercent / 100) * bounds.width,
    height: (pct.heightPercent / 100) * bounds.height,
    label: pct.label,
  };
}

/**
 * Devuelve las dimensiones del área imprimible según el lado activo.
 * Función pura — sin efectos secundarios ni dependencias externas.
 * Se mantiene como fallback cuando no se dispone del bounding box de la imagen.
 */
export function getPrintArea(side: ProductSide): PrintArea {
  if (side === 'pecho') {
    return {
      left: 175,
      top: 150,
      width: 250,
      height: 300,
      label: 'Área de impresión Pecho (32×38 cm)',
    };
  }
  return {
    left: 175,
    top: 135,
    width: 250,
    height: 330,
    label: 'Área de impresión Espalda (32×38 cm)',
  };
}

// ---------------------------------------------------------------------------
// NORMALIZACIÓN DE COORDENADAS (píxeles ↔ porcentaje)
// ---------------------------------------------------------------------------

/**
 * Convierte coordenadas absolutas del canvas (center-origin) a valores
 * normalizados (0–100 %) relativas al área imprimible.
 */
export function pixelsToPercent(
  pixelX: number,
  pixelY: number,
  area: PrintArea,
): { x: number; y: number } {
  return {
    x: ((pixelX - area.left) / area.width) * 100,
    y: ((pixelY - area.top) / area.height) * 100,
  };
}

/**
 * Convierte coordenadas normalizadas (0–100 %) a coordenadas absolutas
 * del canvas (center-origin) dentro del área imprimible.
 */
export function percentToPixels(
  xPercent: number,
  yPercent: number,
  area: PrintArea,
): { left: number; top: number } {
  return {
    left: area.left + (xPercent / 100) * area.width,
    top: area.top + (yPercent / 100) * area.height,
  };
}

/**
 * Calcula el scaleFactor de Fabric.js a partir del scale de React y el
 * ancho intrínseco del objeto de imagen.
 *
 * scaleFactor = (BASE_DESIGN_WIDTH / objWidth) * reactScale
 */
export function reactScaleToFabric(reactScale: number, objWidth: number): number {
  return (BASE_DESIGN_WIDTH / objWidth) * reactScale;
}

/**
 * Recalcula el scale de React a partir del scaleFactor de Fabric y el
 * ancho intrínseco del objeto.
 *
 * reactScale = scaleX / (BASE_DESIGN_WIDTH / objWidth)
 */
export function fabricScaleToReact(fabricScaleX: number, objWidth: number): number {
  return fabricScaleX / (BASE_DESIGN_WIDTH / objWidth);
}

/**
 * Normaliza un ángulo de Fabric.js (0–360) al rango [-180, 180] usado en React.
 */
export function normalizeAngle(angle: number): number {
  let a = angle ?? 0;
  if (a > 180) a -= 360;
  if (a < -180) a += 360;
  return a;
}

/**
 * Aplica clamp a un valor normalizado (0–100 %) dentro de los bordes del área.
 */
export function clampPixelToArea(
  pixelX: number,
  pixelY: number,
  area: PrintArea,
): { x: number; y: number } {
  return {
    x: Math.max(area.left, Math.min(area.left + area.width, pixelX)),
    y: Math.max(area.top, Math.min(area.top + area.height, pixelY)),
  };
}

// ---------------------------------------------------------------------------
// RESTRICCIÓN DE BOUNDING BOX COMPLETO
// ---------------------------------------------------------------------------

/**
 * Rectángulo axis-aligned que describe la caja delimitadora de un objeto,
 * incluyendo su rotación y escala.
 */
interface BoundingRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

/**
 * Devuelve el rectángulo delimitador real de un objeto Fabric.js
 * (incluye rotación y escala, no solo dimensions originales).
 */
export function getObjectBoundingBox(obj: any): BoundingRect {
  const br = obj.getBoundingRect();
  return { left: br.left, top: br.top, width: br.width, height: br.height };
}

/**
 * Ajusta la posición del objeto para que su bounding box completo
 * permanezca dentro del área imprimible. Retorna true si se movió.
 *
 * Usa obj.set({ left, top }) directamente porque el origen del objeto
 * es 'center' — left/top representan el centro.
 */
export function clampObjectToArea(obj: any, area: PrintArea): boolean {
  const bbox = getObjectBoundingBox(obj);
  const center = obj.getCenterPoint();
  let dx = 0;
  let dy = 0;

  if (bbox.left < area.left) {
    dx = area.left - bbox.left;
  } else if (bbox.left + bbox.width > area.left + area.width) {
    dx = (area.left + area.width) - (bbox.left + bbox.width);
  }

  if (bbox.top < area.top) {
    dy = area.top - bbox.top;
  } else if (bbox.top + bbox.height > area.top + area.height) {
    dy = (area.top + area.height) - (bbox.top + bbox.height);
  }

  if (dx !== 0 || dy !== 0) {
    obj.set({ left: center.x + dx, top: center.y + dy });
    obj.setCoords();
    return true;
  }
  return false;
}

/**
 * Si el bounding box del objeto (con su escala actual) excede el área
 * imprimible, reduce scaleX y scaleY proporcionalmente hasta que quepa.
 * Retorna true si se ajustó la escala.
 */
export function clampScaleToArea(obj: any, area: PrintArea): boolean {
  const bbox = getObjectBoundingBox(obj);

  const overflowX = Math.max(
    0,
    area.left - bbox.left,
    (bbox.left + bbox.width) - (area.left + area.width),
  );
  const overflowY = Math.max(
    0,
    area.top - bbox.top,
    (bbox.top + bbox.height) - (area.top + area.height),
  );

  if (overflowX <= 0 && overflowY <= 0) return false;

  const scaleX = obj.scaleX;
  const scaleY = obj.scaleY;
  const minScale = Math.min(scaleX, scaleY);

  let lo = 0.01;
  let hi = minScale;
  let bestScale = minScale;

  for (let i = 0; i < 15; i++) {
    const mid = (lo + hi) / 2;
    const factor = mid / minScale;
    const newWidth = bbox.width * factor;
    const newHeight = bbox.height * factor;
    const newLeft = bbox.left + (bbox.width - newWidth) / 2;
    const newTop = bbox.top + (bbox.height - newHeight) / 2;

    const fits =
      newLeft >= area.left &&
      newTop >= area.top &&
      newLeft + newWidth <= area.left + area.width &&
      newTop + newHeight <= area.top + area.height;

    if (fits) {
      bestScale = mid;
      lo = mid;
    } else {
      hi = mid;
    }
  }

  const factor = bestScale / minScale;
  obj.set({ scaleX: scaleX * factor, scaleY: scaleY * factor });
  obj.setCoords();
  return true;
}

/**
 * Si la rotación actual provoca que el bounding box exceda el área,
 * primero intenta reposicionar; si no es suficiente, revierte al
 * ángulo anterior. Retorna true si se ajustó.
 */
export function clampRotationToArea(
  obj: any,
  savedAngle: number,
  area: PrintArea,
): boolean {
  clampObjectToArea(obj, area);

  const afterBbox = getObjectBoundingBox(obj);
  const fits =
    afterBbox.left >= area.left &&
    afterBbox.top >= area.top &&
    afterBbox.left + afterBbox.width <= area.left + area.width &&
    afterBbox.top + afterBbox.height <= area.top + area.height;

  if (fits) return false;

  obj.set({ angle: savedAngle });
  obj.setCoords();
  clampObjectToArea(obj, area);
  return true;
}

// ---------------------------------------------------------------------------
// RESOLUCIÓN DE IMAGEN DEL POLO POR LADO
// ---------------------------------------------------------------------------

/**
 * Dada la URL de la imagen frontal de un color, devuelve la URL
 * correspondiente al lado solicitado (pecho o espalda).
 * Implementa un conjunto de convenciones de nomenclatura comunes.
 */
export function getProductImageForSide(colorUrl: string, side: ProductSide): string {
  if (!colorUrl) return '/placeholder.svg';
  if (side === 'pecho') return colorUrl;

  const REPLACEMENTS: Array<{ from: string; to: string }> = [
    { from: 'frente', to: 'espalda' },
    { from: 'pecho', to: 'espalda' },
    { from: 'front', to: 'back' },
    { from: 'FRONT', to: 'BACK' },
  ];

  for (const { from, to } of REPLACEMENTS) {
    if (colorUrl.includes(from)) {
      return colorUrl.replace(from, to);
    }
  }
  return colorUrl;
}

// ---------------------------------------------------------------------------
// SERIALIZACIÓN PARA PERSISTENCIA
// ---------------------------------------------------------------------------

/**
 * Convierte un CustomizationDesign a un objeto serializable seguro para
 * guardar en sessionStorage o enviar al backend. Excluye el File binario.
 */
export function serializeDesign(design: CustomizationDesign): Omit<CustomizationDesign, 'file'> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { file, ...rest } = design;
  // Para diseños SUBIDO no enviamos el preview (DataURL) al backend
  if (design.tipo === 'SUBIDO') {
    return { ...rest, preview: '' };
  }
  return rest;
}
