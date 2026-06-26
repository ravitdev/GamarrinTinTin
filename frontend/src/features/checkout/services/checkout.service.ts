import { ApiClient } from '@/lib/api-client';

export type TipoEntrega = 'ENVIO' | 'RECOJO_TIENDA';

export interface CheckoutItemPayload {
  idProductoVariante: number;
  idCotizacion?: number;
  cantidad: number;
}

export interface CreateOrderPayload {
  items: CheckoutItemPayload[];
  tipoEntrega: TipoEntrega;
  direccionEnvio?: string | null;
}

export class CheckoutService {
  /**
   * POST /pedidos
   * Registra un nuevo pedido a partir de las variantes y cantidades.
   */
  static async createOrder(payload: CreateOrderPayload): Promise<any> {
    return ApiClient.post('/pedidos', payload);
  }

  /**
   * POST /pedidos/:idPedido/pago
   * Procesa el pago simulado para el pedido con tarjeta.
   */
  static async processPayment(idPedido: number, tokenTarjeta: string): Promise<any> {
    return ApiClient.post(`/pedidos/${idPedido}/pago`, { tokenTarjeta });
  }

  /**
   * GET /pedidos/propios/:idPedido
   * Obtiene el detalle de un pedido del usuario logueado.
   */
  static async getOrderDetails(idPedido: number): Promise<any> {
    return ApiClient.get(`/pedidos/propios/${idPedido}`);
  }
}
