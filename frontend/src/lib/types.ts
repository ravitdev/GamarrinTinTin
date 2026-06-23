// ============================================================================
// TIPOS GLOBALES — sincronizados con el schema Prisma del backend NestJS
// Fuente de verdad: schema.prisma (GamarrinTinTin)
// Reglas:
//   - enum Prisma  →  export enum TypeScript
//   - tabla Prisma →  export interface TypeScript
//   - Decimal      →  number
//   - relaciones   →  propiedad opcional (?)
// ============================================================================

// ---------------------------------------------------------------------------
// ENUMS (Prisma → TypeScript)
// ---------------------------------------------------------------------------

export enum RolUsuario {
  CLIENTE       = 'CLIENTE',
  VENDEDOR      = 'VENDEDOR',
  ADMINISTRADOR = 'ADMINISTRADOR',
}

export enum EstadoUsuario {
  ACTIVO   = 'ACTIVO',
  INACTIVO = 'INACTIVO',
}

export enum TipoDocumento {
  DNI = 'DNI',
  RUC = 'RUC',
}

/** Solo 4 tallas: S, M, L, XL (según schema Prisma) */
export enum Talla {
  S  = 'S',
  M  = 'M',
  L  = 'L',
  XL = 'XL',
}

export enum LadoProducto {
  FRONT = 'FRONT',
  BACK  = 'BACK',
}

export enum RazonCotizacion {
  PERSONALIZACION    = 'PERSONALIZACION',
  STOCK_INSUFICIENTE = 'STOCK_INSUFICIENTE',
}

export enum EstadoCotizacion {
  PENDIENTE = 'PENDIENTE',
  COTIZADO  = 'COTIZADO',
  PAGADO    = 'PAGADO',
  EXPIRADO  = 'EXPIRADO',
  RECHAZADO = 'RECHAZADO',
}

export enum TipoItemCarrito {
  PRODUCTO   = 'PRODUCTO',
  COTIZACION = 'COTIZACION',
}

export enum EstadoPedido {
  REGISTRADO = 'REGISTRADO',
  CONFIRMADO = 'CONFIRMADO',
  PROCESANDO = 'PROCESANDO',
  ENVIADO    = 'ENVIADO',
  ENTREGADO  = 'ENTREGADO',
  CANCELADO  = 'CANCELADO',
}

export enum EstadoPago {
  PENDIENTE    = 'PENDIENTE',
  PAGADO       = 'PAGADO',
  FALLO        = 'FALLO',
  REEMBOLSADO  = 'REEMBOLSADO',
}

export enum MetodoPago {
  TARJETA          = 'TARJETA',
  BILLETERA_DIGITAL = 'BILLETERA_DIGITAL',
}

// ---------------------------------------------------------------------------
// INTERFACES (tablas Prisma → interfaces TypeScript)
// ---------------------------------------------------------------------------

/**
 * Usuario — modelo principal de autenticación.
 * Mapeo: idUsuario(Int) → idUsuario, etc.
 */
export interface Usuario {
  idUsuario:       number;
  nombres:         string;
  apellidos:       string;
  email:           string;
  contrasenaHash:  string;
  telefono:        string;
  tipoDocumento:   TipoDocumento;
  numeroDocumento: string;
  direccion?:       string | null;
  rol:             RolUsuario;
  estado:          EstadoUsuario;
  fechaRegistro:   string; // DateTime ISO
  fechaEliminacion?: string | null;

  // Relaciones opcionales (respuestas anidadas)
  refreshTokens?:         RefreshToken[];
  carrito?:               Carrito | null;
  pedidos?:               Pedido[];
  cotizacionesCliente?:   Cotizacion[];
  cotizacionesAtendidas?: Cotizacion[];
  disenosPredefinidos?:   DisenoPredefinido[];
}

/**
 * RefreshToken — para la renovación de sesiones JWT.
 */
export interface RefreshToken {
  idRefreshToken: number;
  idUsuario:      number;
  tokenHash:      string;
  fechaCreacion:  string;
  fechaExpiracion: string;
  revocado:       boolean;

  usuario?: Usuario;
}

/**
 * Categoria — clasificación de productos.
 */
export interface Categoria {
  idCategoria:       number;
  nombre:            string;
  descripcion?:      string | null;
  esActivo?:         boolean;
  fechaCreacion?:    string | Date | null;
  fechaActualizacion?: string | Date | null;
  fechaEliminacion?:  string | Date | null;

  productos?: Producto[];
}

/**
 * Producto — artículo base (polo, polera, etc).
 */
export interface Producto {
  idProducto:         number;
  idCategoria:        number;
  nombre:             string;
  descripcion:        string; // Text
  precioBase:         number; // Decimal(12,2)
  esPersonalizable:   boolean;
  esActivo:           boolean;
  fechaCreacion:      string | Date;
  fechaActualizacion: string | Date;
  fechaEliminacion?:  string | Date | null;

  // Relaciones opcionales
  categoria?:          Categoria;
  variantes?:          ProductoVariante[];
  imagenes?:           ProductoImagen[];
  descuentosVolumen?:  DescuentoVolumen[];

  // Campos adaptados para UI v0
  colores?:            ColorProducto[];
  tallas?:             string[];
  precio?:             number;
  stock?:              number;
  imagenPrincipal?:    string | null;
  disenosPredefinidos?: any[];
  tipoDiseno?:         string;
  codigo?:             string;
  estado?:             string;
}

/**
 * ProductoVariante — combinación de color, talla y stock.
 * Ej: Polo_Rojo_S, Polo_Rojo_M, Polo_Azul_S, etc.
 */
export interface ProductoVariante {
  idProductoVariante: number;
  idProducto:         number;
  colorNombre:        string;
  colorHex:           string;
  talla:              Talla;
  stock:              number;
  esActivo:           boolean;
  fechaCreacion:      string;
  fechaActualizacion: string;
  fechaEliminacion?:  string | null;

  // Relaciones opcionales
  producto?:      Producto;
  cotizaciones?:  Cotizacion[];
  itemsCarrito?:  ItemCarrito[];
  detallesPedido?: PedidoDetalle[];
}

/**
 * ProductoImagen — imágenes del producto por color y lado (frente/espalda).
 */
export interface ProductoImagen {
  idProductoImagen?:  number;
  idImagen?:          number;
  idProducto?:        number;
  colorHex?:          string;
  lado?:              LadoProducto;
  ladoProducto?:      string;
  urlImagen:          string;
  displayOrder?:      number;
  esActivo?:          boolean;
  fechaCreacion?:     string | Date;
  fechaActualizacion?: string | Date;
  fechaEliminacion?:  string | Date | null;

  producto?: Producto;
}

/**
 * DescuentoVolumen — descuentos por cantidad comprada.
 * Ej: 10+ unidades → 5% desc, 50+ → 10% desc, etc.
 */
export interface DescuentoVolumen {
  idDescuentoVolumen?: number;
  idDescuento?:        number;
  idProducto?:         number;
  cantidadMinima:      number;
  porcentajeDescuento: number; // Decimal(5,2)
  esActivo?:           boolean;
  fechaCreacion?:      string | Date;
  fechaActualizacion?: string | Date;
  fechaEliminacion?:   string | Date | null;

  producto?: Producto;
}

/**
 * DisenoPredefinido — templates de diseños que puede elegir el usuario.
 * Creados por vendedor/admin.
 */
export interface DisenoPredefinido {
  idDisenoPredefinido?: number;
  idDiseno?:            number;
  creadoPorId?:         number;
  nombre:               string;
  urlImagen?:           string;
  imagen?:              string;
  ladoProducto?:        string;
  esActivo?:            boolean;
  fechaCreacion?:       string | Date;
  fechaActualizacion?:  string | Date;
  fechaEliminacion?:    string | Date | null;

  creadoPor?:                    Usuario;
  imagenesPersonalizadas?:       ImagenPersonalizada[];
}

/**
 * Cotizacion — solicitud de presupuesto (por cantidad, personalización, etc).
 * Estados: PENDIENTE → COTIZADO → PAGADO / EXPIRADO / RECHAZADO
 */
export interface Cotizacion {
  idCotizacion:           number;
  idCliente:              number;
  atendidoPorId?:         number | null;
  idProductoVariante:     number;
  cantidad:               number;
  razon:                  RazonCotizacion;
  estado:                 EstadoCotizacion;
  precioCotizado?:        number | null; // Decimal(12,2)
  fechaCotizacion?:       string | null;
  fechaExpiracion?:       string | null;
  nombreProductoSnapshot: string;
  colorSnapshot:          string;
  tallaSnapshot:          Talla;
  precioBaseSnapshot:     number; // Decimal(12,2)
  fechaCreacion:          string;
  fechaActualizacion:     string;

  // Relaciones opcionales
  cliente?:               Usuario;
  atendidoPor?:           Usuario | null;
  productoVariante?:      ProductoVariante;
  personalizacion?:       Personalizacion | null;
  itemsCarrito?:          ItemCarrito[];
  detallesPedido?:        PedidoDetalle[];
}

/**
 * Personalizacion — diseños personalizados dentro de una cotización.
 * Se puede tener 0..1 Personalizacion por Cotizacion.
 */
export interface Personalizacion {
  idPersonalizacion:  number;
  idCotizacion:       number;
  fechaCreacion:      string;
  fechaActualizacion: string;

  cotizacion?:        Cotizacion;
  imagenes?:          ImagenPersonalizada[];
}

/**
 * ImagenPersonalizada — imagen ubicada en el diseño personalizado.
 * Puede ser un diseño predefinido o una imagen subida por el usuario.
 */
export interface ImagenPersonalizada {
  idImagenPersonalizada: number;
  idPersonalizacion:    number;
  idDisenoPredefinido?:  number | null;
  urlImagen:            string;
  lado:                 LadoProducto;
  xPosicion:            number; // Decimal(5,2)
  yPosicion:            number; // Decimal(5,2)
  anchoPorcentaje:      number; // Decimal(5,2)
  altoPorcentaje:       number; // Decimal(5,2)
  displayOrder:         number;
  fechaCreacion:        string;
  fechaActualizacion:   string;

  personalizacion?:    Personalizacion;
  disenoPredefinido?:  DisenoPredefinido | null;
}

/**
 * Carrito — carrito de compras asociado a un usuario.
 * Solo uno por usuario; se borra al crear pedido.
 */
export interface Carrito {
  idCarrito:          number;
  idUsuario:          number;
  fechaCreacion:      string;
  fechaActualizacion: string;

  usuario?: Usuario;
  items?:   ItemCarrito[];
}

/**
 * ItemCarrito — elemento en el carrito (producto o cotización).
 * tipoItem = PRODUCTO o COTIZACION
 */
export interface ItemCarrito {
  idItemCarrito:      number;
  idCarrito:          number;
  tipoItem:           TipoItemCarrito;
  idProductoVariante?: number | null;
  idCotizacion?:      number | null;
  cantidad:           number;
  fechaCreacion:      string;
  fechaActualizacion: string;

  carrito?:          Carrito;
  productoVariante?: ProductoVariante | null;
  cotizacion?:       Cotizacion | null;
}

/**
 * Pedido — orden completada y listo para procesar/enviar.
 * Estados: REGISTRADO → CONFIRMADO → PROCESANDO → ENVIADO → ENTREGADO / CANCELADO
 */
export interface Pedido {
  idPedido:           number;
  idCliente:          number;
  estado:             EstadoPedido;
  subtotal:           number; // Decimal(12,2)
  descuentoTotal:     number; // Decimal(12,2)
  total:              number; // Decimal(12,2)
  direccionSnapshot:  string; // Text
  fechaCreacion:      string;
  fechaActualizacion: string;

  cliente?:   Usuario;
  detalles?:  PedidoDetalle[];
}

/**
 * PedidoDetalle — línea en el pedido (1 variante + cantidad + precio).
 */
export interface PedidoDetalle {
  idPedidoDetalle:       number;
  idPedido:              number;
  idProductoVariante:    number;
  idCotizacion?:         number | null;
  cantidad:              number;
  precioUnitario:        number; // Decimal(12,2)
  subtotal:              number; // Decimal(12,2)
  nombreProductoSnapshot: string;
  colorSnapshot:         string;
  tallaSnapshot:         Talla;
  fechaCreacion:         string;

  pedido?:               Pedido;
  productoVariante?:     ProductoVariante;
  cotizacion?:           Cotizacion | null;
}

/**
 * Pago — transacción de pago asociada a un pedido.
 * Estados: PENDIENTE → PAGADO / FALLO / REEMBOLSADO
 */
export interface Pago {
  idPago:               number;
  idPedido:             number;
  monto:                number; // Decimal(12,2)
  metodoPago:           MetodoPago;
  estado:               EstadoPago;
  idTransaccionExterna?: string | null;
  referenciaExterna?:    string | null;
  gatewayResponse?:      Record<string, unknown> | null; // Json
  fechaPago?:            string | null;
  fechaCreacion:        string;
  fechaActualizacion:   string;
}

// ---------------------------------------------------------------------------
// TIPOS AUXILIARES DE FRONTEND (auth, forms, etc)
// ---------------------------------------------------------------------------

export interface AuthCredentials {
  email:       string;
  password:    string;
  rememberMe?: boolean;
}

/**
 * Datos que captura el formulario de registro (frontend).
 */
export interface RegistroData {
  nombres:         string;
  apellidos:       string;
  tipoDocumento:   TipoDocumento;
  numeroDocumento: string;
  celular:         string;
  email:           string;
  direccion?:       string | null;
  password:        string;
  confirmPassword: string;
}

/**
 * AuthResponse — respuesta del backend en POST /usuarios/login.
 */
export interface AuthResponse {
  usuario:      Usuario;
  access_token: string;
}

// ---------------------------------------------------------------------------
// BACKWARD-COMPAT ALIASES (para no romper imports existentes)
// ---------------------------------------------------------------------------

/** @deprecated usar Usuario */
export type User = Usuario;

/** @deprecated usar RolUsuario */
export type UserRole = RolUsuario;

/** @deprecated usar Talla */
export type ProductSize = Talla;

/** @deprecated usar EstadoPedido */
export type OrderStatus = 'registrado' | 'confirmado' | 'en_proceso' | 'enviado' | 'entregado' | 'cancelado';
export type QuotationStatus = 'pendiente' | 'cotizado' | 'pagado' | 'rechazado' | 'vencido';

export interface OrderItem {
  id: number;
  producto: {
    nombre: string;
    precio: number;
  };
  colorSeleccionado: {
    nombre: string;
    hexCode: string;
  };
  tallaSeleccionada: string;
  cantidad: number;
  precioUnitario: number;
}

export interface Order {
  id: string | number;
  codigo: string;
  cliente: {
    nombres: string;
    apellidos: string;
    correo: string;
    celular: string;
    tipoDocumento: string;
    documento: string;
    direccion?: string | null;
  };
  direccionEnvio: string;
  metodoPago: string;
  items: OrderItem[];
  subtotal: number;
  descuento: number;
  total: number;
  estado: OrderStatus;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface Quotation {
  id: string | number;
  codigo: string;
  cliente: {
    nombres: string;
    apellidos: string;
    correo: string;
    celular: string;
    tipoDocumento: string;
    documento: string;
    direccion: string;
  };
  producto: {
    id: number;
    nombre: string;
    precio: number;
    descripcion: string;
    categoria: string;
    descuentosVolumen: {
      idDescuentoVolumen?: number;
      idDescuento?: number;
      cantidadMinima: number;
      porcentajeDescuento: number;
    }[];
  };
  colorSeleccionado: {
    nombre: string;
    hexCode: string;
  };
  tallaSeleccionada: string;
  cantidad: number;
  estado: QuotationStatus;
  createdAt: string | Date;
  updatedAt: string | Date;
  precioSugerido?: number;
  fechaVencimiento?: string | Date;
  disenoPecho?: string | null;
  disenoEspalda?: string | null;
}

/** @deprecated usar MetodoPago */
export type PaymentMethod = MetodoPago;

/** @deprecated usar EstadoPago */
export type PaymentStatus = EstadoPago;

// ---------------------------------------------------------------------------
// V0 FRONTEND ALIASES & COMPATIBILITY TYPES
// ---------------------------------------------------------------------------
export type ProductCategory = string;
export type DesignType = string;
export type TipoProducto = string;

export interface ColorProducto {
  idColor: number;
  nombre: string;
  codigoHex: string;
  urlImagen: string;
}

export interface PredefinedDesign {
  id: number;
  idDisenoPredefinido?: number;
  nombre: string;
  urlImagen: string;
  imagen?: string;
}
