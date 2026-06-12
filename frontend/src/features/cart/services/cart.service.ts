export interface CartItem {
  id: string; // ID único en el carrito (ej. "1-M-rojo" o "cotizacion-5")
  productId: string;
  productName: string;
  colorId: string;
  colorHex: string;
  size: string;
  quantity: number;
  price: number;
  imageUrl?: string;
  idProductoVariante?: number; // Variant ID from backend
  idCotizacion?: number;
  selected?: boolean; // Selección parcial para conformar pedido
  descuentosVolumen?: { cantidadMinima: number; porcentajeDescuento: number; }[];
}

export interface Cart {
  items: CartItem[];
  subtotal: number;
  total: number;
  discountTotal: number;
}

const LOCAL_STORAGE_KEY = 'gtt_cart';

const DEFAULT_CART: Cart = {
  items: [],
  subtotal: 0,
  total: 0,
  discountTotal: 0,
};

export class CartService {
  /**
   * Obtiene el carrito del localStorage.
   */
  static async getCart(): Promise<Cart> {
    if (typeof window === 'undefined') return DEFAULT_CART;
    try {
      const raw = window.localStorage.getItem(LOCAL_STORAGE_KEY);
      if (!raw) return DEFAULT_CART;
      const cart = JSON.parse(raw) as Cart;
      // Recalcular por si acaso
      return this.recalculateTotals(cart.items);
    } catch {
      return DEFAULT_CART;
    }
  }

  /**
   * Guarda el carrito en localStorage.
   */
  static saveCart(cart: Cart): void {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(cart));
  }

  /**
   * Agrega un elemento al carrito.
   */
  static async addToCart(item: Omit<CartItem, 'id'>): Promise<void> {
    const cart = await this.getCart();
    const id = item.idCotizacion 
      ? `cotizacion-${item.idCotizacion}` 
      : `${item.productId}-${item.size}-${item.colorHex}`;

    const existingIndex = cart.items.findIndex((i) => i.id === id);

    if (existingIndex > -1) {
      cart.items[existingIndex].quantity += item.quantity;
    } else {
      cart.items.push({
        ...item,
        id,
        selected: true, // Por defecto seleccionado
      });
    }

    const updatedCart = this.recalculateTotals(cart.items);
    this.saveCart(updatedCart);
  }

  /**
   * Cambia el estado de selección de un elemento.
   */
  static async toggleItemSelection(itemId: string, selected: boolean): Promise<void> {
    const cart = await this.getCart();
    const index = cart.items.findIndex((i) => i.id === itemId);
    if (index > -1) {
      cart.items[index].selected = selected;
      const updatedCart = this.recalculateTotals(cart.items);
      this.saveCart(updatedCart);
    }
  }

  /**
   * Actualiza la cantidad de un elemento.
   */
  static async updateCartItem(itemId: string, quantity: number): Promise<void> {
    const cart = await this.getCart();
    const index = cart.items.findIndex((i) => i.id === itemId);

    if (index > -1) {
      if (quantity <= 0) {
        cart.items.splice(index, 1);
      } else {
        cart.items[index].quantity = quantity;
      }
      const updatedCart = this.recalculateTotals(cart.items);
      this.saveCart(updatedCart);
    }
  }

  /**
   * Elimina un elemento del carrito.
   */
  static async removeFromCart(itemId: string): Promise<void> {
    const cart = await this.getCart();
    cart.items = cart.items.filter((i) => i.id !== itemId);
    const updatedCart = this.recalculateTotals(cart.items);
    this.saveCart(updatedCart);
  }

  /**
   * Vacía el carrito.
   */
  static async clearCart(): Promise<void> {
    this.saveCart(DEFAULT_CART);
  }

  /**
   * Elimina del carrito los elementos seleccionados.
   */
  static async removeSelectedItems(): Promise<void> {
    const cart = await this.getCart();
    cart.items = cart.items.filter((i) => i.selected === false);
    const updatedCart = this.recalculateTotals(cart.items);
    this.saveCart(updatedCart);
  }

  /**
   * Retorna los totales del carrito.
   */
  static async getCartTotals() {
    const cart = await this.getCart();
    return {
      subtotal: cart.subtotal,
      total: cart.total,
      discountTotal: cart.discountTotal,
    };
  }

  /**
   * Recalcula subtotales y totales.
   */
  private static recalculateTotals(items: CartItem[]): Cart {
    // Inicializar selected = true si no está definido
    items.forEach(item => {
      if (item.selected === undefined) {
        item.selected = true;
      }
    });

    const selectedItems = items.filter(item => item.selected !== false);

    // Agrupar cantidades por productId para el cálculo de descuentos por volumen (excluyendo cotizaciones)
    const productQuantities: Record<string, number> = {};
    selectedItems.forEach(item => {
      if (!item.idCotizacion) {
        productQuantities[item.productId] = (productQuantities[item.productId] || 0) + item.quantity;
      }
    });

    let subtotal = 0;
    let discountTotal = 0;

    selectedItems.forEach(item => {
      const itemSubtotal = item.price * item.quantity;
      subtotal += itemSubtotal;

      if (item.idCotizacion) {
        // Las cotizaciones mantienen su precio definitivo
        return;
      }

      if (item.descuentosVolumen && item.descuentosVolumen.length > 0) {
        const totalQty = productQuantities[item.productId] || 0;
        const aplicable = [...item.descuentosVolumen]
          .filter((d) => totalQty >= d.cantidadMinima)
          .sort((a, b) => b.cantidadMinima - a.cantidadMinima);
        
        const pct = aplicable[0]?.porcentajeDescuento ?? 0;
        if (pct > 0) {
          discountTotal += itemSubtotal * (pct / 100);
        }
      }
    });

    const total = subtotal - discountTotal;

    return {
      items,
      subtotal,
      total,
      discountTotal,
    };
  }
}
