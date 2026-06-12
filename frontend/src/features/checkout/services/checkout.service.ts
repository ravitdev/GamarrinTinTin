import { ApiClient } from '@/lib/api-client';

export interface CheckoutItemPayload {
  idProductoVariante: number;
  idCotizacion?: number;
  cantidad: number;
}

export class CheckoutService {
  /**
   * POST /pedidos
   * Registra un nuevo pedido a partir de las variantes y cantidades.
   */
  static async createOrder(items: CheckoutItemPayload[]): Promise<any> {
    return ApiClient.post('/pedidos', { items });
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
