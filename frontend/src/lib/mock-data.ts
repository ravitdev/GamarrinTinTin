import type { 
  Producto, 
  ProductoImagen,
  DescuentoVolumen, 
  DisenoPredefinido, 
  Categoria,
  ColorProducto,
  Quotation,
  Order
} from './types';

// ============================================================================
// CATEGORÍAS
// ============================================================================
export const categorias: Categoria[] = [
  { idCategoria: 1, nombre: 'Polos', descripcion: 'Polos de diferentes estilos' },
  { idCategoria: 2, nombre: 'Poleras', descripcion: 'Poleras cómodas' },
];

// ============================================================================
// DESCUENTOS DE VOLUMEN
// ============================================================================
export const descuentosVolumenPolos: DescuentoVolumen[] = [
  { idDescuento: 1, cantidadMinima: 10, porcentajeDescuento: 5 },
  { idDescuento: 2, cantidadMinima: 25, porcentajeDescuento: 10 },
  { idDescuento: 3, cantidadMinima: 50, porcentajeDescuento: 15 },
  { idDescuento: 4, cantidadMinima: 100, porcentajeDescuento: 20 },
];

export const descuentosVolumenPoleras: DescuentoVolumen[] = [
  { idDescuento: 5, cantidadMinima: 10, porcentajeDescuento: 5 },
  { idDescuento: 6, cantidadMinima: 25, porcentajeDescuento: 12 },
  { idDescuento: 7, cantidadMinima: 50, porcentajeDescuento: 18 },
];

// ============================================================================
// DISEÑOS PREDEFINIDOS
// ============================================================================
export const disenosPredefinidos: DisenoPredefinido[] = [
  { 
    idDiseno: 1, 
    nombre: 'Logo Minimalista', 
    imagen: '/designs/minimal-logo.png', 
    ladoProducto: 'PECHO',
    esActivo: true 
  },
  { 
    idDiseno: 2, 
    nombre: 'Texto Corporativo', 
    imagen: '/designs/corporate-text.png', 
    ladoProducto: 'PECHO',
    esActivo: true 
  },
  { 
    idDiseno: 3, 
    nombre: 'Ilustración Arte', 
    imagen: '/designs/art-illustration.png', 
    ladoProducto: 'ESPALDA',
    esActivo: true 
  },
  { 
    idDiseno: 4, 
    nombre: 'Patrón Geométrico', 
    imagen: '/designs/geometric-pattern.png', 
    ladoProducto: 'ESPALDA',
    esActivo: true 
  },
];

// ============================================================================
// IMÁGENES DE PRODUCTOS
// ============================================================================
export const productImages: ProductoImagen[] = [
  { idImagen: 1, urlImagen: '/products/polo-blanco-frente.jpg', ladoProducto: 'PECHO' },
  { idImagen: 2, urlImagen: '/products/polo-blanco-espalda.jpg', ladoProducto: 'ESPALDA' },
  { idImagen: 3, urlImagen: '/products/polo-negro-frente.jpg', ladoProducto: 'PECHO' },
  { idImagen: 4, urlImagen: '/products/polo-negro-espalda.jpg', ladoProducto: 'ESPALDA' },
];

// ============================================================================
// COLORES DE PRODUCTOS
// ============================================================================
export const coloresProducto: ColorProducto[] = [
  { 
    idColor: 1, 
    nombre: 'Blanco', 
    codigoHex: '#FFFFFF',
    urlImagen: '/products/polo-blanco-frente.jpg'
  },
  { 
    idColor: 2, 
    nombre: 'Negro', 
    codigoHex: '#1a1a1a',
    urlImagen: '/products/polo-negro-frente.jpg'
  },
  { 
    idColor: 3, 
    nombre: 'Azul Marino', 
    codigoHex: '#1a1f3d',
    urlImagen: '/products/polo-azul-frente.jpg'
  },
];

// ============================================================================
// PRODUCTOS
// ============================================================================
export const products: Producto[] = [
  {
    idProducto: 1,
    nombre: 'Polo Clásico Algodón',
    descripcion: 'Polo de algodón pima peruano de alta calidad. Ideal para uso diario y personalizar con tu marca o diseño.',
    idCategoria: 1,
    precioBase: 45.00,
    esPersonalizable: true,
    stock: 200,
    esActivo: true,
    fechaCreacion: new Date('2024-01-15'),
    fechaActualizacion: new Date('2024-01-15'),
    tallas: ['S', 'M', 'L', 'XL'],
    colores: coloresProducto.slice(0, 3),
    descuentosVolumen: descuentosVolumenPolos,
    disenosPredefinidos: disenosPredefinidos.slice(0, 2),
    imagenes: productImages.slice(0, 2),
  },
  {
    idProducto: 2,
    nombre: 'Polo Sport Dry-Fit',
    descripcion: 'Polo deportivo con tecnología dry-fit. Perfecto para equipos deportivos y eventos corporativos.',
    idCategoria: 1,
    precioBase: 55.00,
    esPersonalizable: true,
    stock: 150,
    esActivo: true,
    fechaCreacion: new Date('2024-02-20'),
    fechaActualizacion: new Date('2024-02-20'),
    tallas: ['S', 'M', 'L', 'XL'],
    colores: coloresProducto,
    descuentosVolumen: descuentosVolumenPolos,
    disenosPredefinidos: disenosPredefinidos,
    imagenes: productImages,
  },
  {
    idProducto: 3,
    nombre: 'Polera Básica Unisex',
    descripcion: 'Polera de algodón suave con capucha. Diseño unisex con bolsillo canguro.',
    idCategoria: 2,
    precioBase: 85.00,
    esPersonalizable: true,
    stock: 100,
    esActivo: true,
    fechaCreacion: new Date('2024-03-10'),
    fechaActualizacion: new Date('2024-03-10'),
    tallas: ['S', 'M', 'L', 'XL'],
    colores: coloresProducto.slice(0, 2),
    descuentosVolumen: descuentosVolumenPoleras,
    disenosPredefinidos: disenosPredefinidos,
    imagenes: productImages.slice(0, 2),
  },
];

// ============================================================================
// FUNCIONES AUXILIARES
// ============================================================================
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
  }).format(price);
}

export function checkStock(
  producto: Producto,
  color: ColorProducto,
  talla: string
): number {
  return Math.floor((producto.stock || 0) / ((producto.colores?.length || 1) * (producto.tallas?.length || 1)));
}

export function calculateDiscount(
  cantidad: number,
  descuentos: DescuentoVolumen[]
): number {
  const aplicable = descuentos
    .filter(d => cantidad >= d.cantidadMinima)
    .sort((a, b) => b.cantidadMinima - a.cantidadMinima);
  return aplicable[0]?.porcentajeDescuento ?? 0;
}

export function getQuotationStatusColor(
  status: 'PENDIENTE' | 'COTIZADO' | 'PAGADO' | 'RECHAZADO' | 'EXPIRADO' | 'pendiente' | 'cotizado' | 'pagado' | 'rechazado' | 'vencido'
): string {
  const colors: Record<string, string> = {
    PENDIENTE: 'bg-yellow-100 text-yellow-800',
    COTIZADO: 'bg-blue-100 text-blue-800',
    PAGADO: 'bg-green-100 text-green-800',
    RECHAZADO: 'bg-red-100 text-red-800',
    EXPIRADO: 'bg-gray-100 text-gray-800',
    pendiente: 'bg-yellow-100 text-yellow-800',
    cotizado: 'bg-blue-100 text-blue-800',
    pagado: 'bg-green-100 text-green-800',
    rechazado: 'bg-red-100 text-red-800',
    vencido: 'bg-gray-100 text-gray-800',
  };
  return colors[status] ?? 'bg-gray-100 text-gray-800';
}

export function getOrderStatusColor(
  status: 'PENDIENTE' | 'PROCESANDO' | 'ENVIADO' | 'ENTREGADO' | 'CANCELADO' | 'registrado' | 'confirmado' | 'en_proceso' | 'enviado' | 'entregado' | 'cancelado'
): string {
  const colors: Record<string, string> = {
    PENDIENTE: 'bg-yellow-100 text-yellow-800',
    PROCESANDO: 'bg-blue-100 text-blue-800',
    ENVIADO: 'bg-purple-100 text-purple-800',
    ENTREGADO: 'bg-green-100 text-green-800',
    CANCELADO: 'bg-red-100 text-red-800',
    registrado: 'bg-yellow-100 text-yellow-800',
    confirmado: 'bg-blue-100 text-blue-800',
    en_proceso: 'bg-purple-100 text-purple-800',
    enviado: 'bg-blue-100 text-blue-800',
    entregado: 'bg-green-100 text-green-800',
    cancelado: 'bg-red-100 text-red-800',
  };
  return colors[status] ?? 'bg-gray-100 text-gray-800';
}

// ============================================================================
// COTIZACIONES DE MOCK
// ============================================================================
export const mockQuotations: Quotation[] = [
  {
    id: 1,
    codigo: 'COT-001',
    cliente: {
      nombres: 'Juan',
      apellidos: 'Rodriguez',
      correo: 'juan.rodriguez@email.com',
      celular: '987654321',
      tipoDocumento: 'DNI',
      documento: '12345678',
      direccion: 'Av. Larco 123, Miraflores',
    },
    producto: {
      id: 1,
      nombre: 'Polo Clásico Algodón',
      precio: 45.00,
      descripcion: 'Polo de algodón pima peruano de alta calidad.',
      categoria: 'Polos',
      descuentosVolumen: [
        { cantidadMinima: 10, porcentajeDescuento: 5 },
        { cantidadMinima: 25, porcentajeDescuento: 10 }
      ]
    },
    colorSeleccionado: {
      nombre: 'Blanco',
      hexCode: '#FFFFFF'
    },
    tallaSeleccionada: 'M',
    cantidad: 50,
    estado: 'pendiente',
    createdAt: new Date('2024-03-10T10:00:00Z'),
    updatedAt: new Date('2024-03-10T10:00:00Z'),
  },
  {
    id: 2,
    codigo: 'COT-002',
    cliente: {
      nombres: 'María',
      apellidos: 'Gomez',
      correo: 'maria.gomez@email.com',
      celular: '912345678',
      tipoDocumento: 'RUC',
      documento: '20123456789',
      direccion: 'Calle Las Flores 456, San Isidro',
    },
    producto: {
      id: 2,
      nombre: 'Polo Sport Dry-Fit',
      precio: 55.00,
      descripcion: 'Polo deportivo con tecnología dry-fit.',
      categoria: 'Polos',
      descuentosVolumen: [
        { cantidadMinima: 10, porcentajeDescuento: 5 },
        { cantidadMinima: 25, porcentajeDescuento: 10 }
      ]
    },
    colorSeleccionado: {
      nombre: 'Negro',
      hexCode: '#1a1a1a'
    },
    tallaSeleccionada: 'L',
    cantidad: 100,
    estado: 'cotizado',
    createdAt: new Date('2024-03-08T09:00:00Z'),
    updatedAt: new Date('2024-03-08T15:00:00Z'),
    precioSugerido: 46.75,
    fechaVencimiento: new Date('2024-03-23T23:59:59Z'),
  }
];

// ============================================================================
// PEDIDOS DE MOCK
// ============================================================================
export const mockOrders: Order[] = [
  {
    id: 1,
    codigo: 'PED-001',
    cliente: {
      nombres: 'Juan',
      apellidos: 'Rodriguez',
      correo: 'juan.rodriguez@email.com',
      celular: '987654321',
      tipoDocumento: 'DNI',
      documento: '12345678',
      direccion: 'Av. Larco 123, Miraflores',
    },
    direccionEnvio: 'Av. Larco 123, Miraflores',
    metodoPago: 'tarjeta',
    items: [
      {
        id: 1,
        producto: {
          nombre: 'Polo Clásico Algodón',
          precio: 45.00,
        },
        colorSeleccionado: {
          nombre: 'Blanco',
          hexCode: '#FFFFFF',
        },
        tallaSeleccionada: 'M',
        cantidad: 5,
        precioUnitario: 45.00,
      }
    ],
    subtotal: 225.00,
    descuento: 0,
    total: 225.00,
    estado: 'registrado',
    createdAt: new Date('2024-03-10T14:30:00Z'),
    updatedAt: new Date('2024-03-10T14:30:00Z'),
  },
  {
    id: 2,
    codigo: 'PED-002',
    cliente: {
      nombres: 'María',
      apellidos: 'Gomez',
      correo: 'maria.gomez@email.com',
      celular: '912345678',
      tipoDocumento: 'RUC',
      documento: '20123456789',
      direccion: 'Calle Las Flores 456, San Isidro',
    },
    direccionEnvio: 'Calle Las Flores 456, San Isidro',
    metodoPago: 'tarjeta',
    items: [
      {
        id: 2,
        producto: {
          nombre: 'Polera Básica Unisex',
          precio: 85.00,
        },
        colorSeleccionado: {
          nombre: 'Negro',
          hexCode: '#1a1a1a',
        },
        tallaSeleccionada: 'L',
        cantidad: 2,
        precioUnitario: 85.00,
      }
    ],
    subtotal: 170.00,
    descuento: 10.00,
    total: 160.00,
    estado: 'confirmado',
    createdAt: new Date('2024-03-09T11:00:00Z'),
    updatedAt: new Date('2024-03-09T16:00:00Z'),
  }
];
