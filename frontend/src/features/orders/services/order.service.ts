import { ApiClient } from '@/lib/api-client';
import { mockOrders } from '@/lib/mock-data';
import type { Order } from '@/lib/types';

export class OrderService {
  /**
   * GET /pedidos/propios
   * Lista los pedidos propios del cliente autenticado.
   */
  static async getMyOrders(): Promise<Order[]> {
    try {
      return await ApiClient.get<Order[]>('/pedidos/propios');
    } catch {
      return mockOrders;
    }
  }

  /**
   * GET /pedidos/propios/:idPedido
   * Obtiene el detalle de un pedido propio del cliente.
   */
  static async getOrderDetail(id: string): Promise<Order> {
    return ApiClient.get<Order>(`/pedidos/propios/${id}`);
  }

  static async cancelOrder(id: string): Promise<void> {
    // El backend no soporta cancelación aún, se silencia
    return;
  }

  static async getOrderTracking(id: string) {
    return {
      idPedido: Number(id),
      estado: 'REGISTRADO',
      pasos: [
        { nombre: 'Registrado', completado: true, fecha: new Date().toISOString() },
        { nombre: 'Confirmado', completado: false },
        { nombre: 'Procesando', completado: false },
        { nombre: 'Enviado', completado: false },
        { nombre: 'Entregado', completado: false },
      ],
    };
  }

  static async retryOrder(id: string) {
    return;
  }
}
