import { ApiClient } from '@/lib/api-client';
import { mockOrders } from '@/lib/mock-data';
import type { Order, OrderStatus } from '@/lib/types';

type BackendPedidoEstado =
  | 'REGISTRADO'
  | 'CONFIRMADO'
  | 'PROCESANDO'
  | 'ENVIADO'
  | 'ENTREGADO'
  | 'CANCELADO';

interface BackendPedidoDetalle {
  idPedidoDetalle: number;
  idProductoVariante: number;
  idCotizacion: number | null;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
  nombreProductoSnapshot: string;
  colorSnapshot: string;
  tallaSnapshot: string;
}

interface BackendPedido {
  idPedido: number;
  idCliente: number;
  fechaCreacion: string | Date;
  estado: BackendPedidoEstado;
  subtotal: number;
  descuentoTotal: number;
  total: number;
  direccionSnapshot: string;
  detalles: BackendPedidoDetalle[];
}

function mapEstadoPedido(estado: BackendPedidoEstado): OrderStatus {
  const estados: Record<BackendPedidoEstado, OrderStatus> = {
    REGISTRADO: 'registrado',
    CONFIRMADO: 'confirmado',
    PROCESANDO: 'en_proceso',
    ENVIADO: 'enviado',
    ENTREGADO: 'entregado',
    CANCELADO: 'cancelado',
  };

  return estados[estado];
}

function mapBackendOrderToFrontend(pedido: BackendPedido): Order {
  return {
    id: pedido.idPedido,
    codigo: `PED-${String(pedido.idPedido).padStart(5, '0')}`,
    cliente: {
      nombres: '',
      apellidos: '',
      correo: '',
      celular: '',
      tipoDocumento: '',
      documento: '',
      direccion: pedido.direccionSnapshot,
    },
    direccionEnvio: pedido.direccionSnapshot,
    metodoPago: 'No especificado',
    items: pedido.detalles.map((detalle) => ({
      id: detalle.idPedidoDetalle,
      producto: {
        nombre: detalle.nombreProductoSnapshot,
        precio: detalle.precioUnitario,
      },
      colorSeleccionado: {
        nombre: detalle.colorSnapshot,
        hexCode: '#000000',
      },
      tallaSeleccionada: detalle.tallaSnapshot,
      cantidad: detalle.cantidad,
      precioUnitario: detalle.precioUnitario,
    })),
    subtotal: pedido.subtotal,
    descuento: pedido.descuentoTotal,
    total: pedido.total,
    estado: mapEstadoPedido(pedido.estado),
    createdAt: pedido.fechaCreacion,
    updatedAt: pedido.fechaCreacion,
  };
}

export class OrderService {
  static async getMyOrders(): Promise<Order[]> {
    try {
      const pedidos = await ApiClient.get<BackendPedido[]>('/pedidos/propios');
      return pedidos.map(mapBackendOrderToFrontend);
    } catch (error) {
      console.error('Error al cargar pedidos propios:', error);
      return mockOrders;
    }
  }

  static async getOrderDetail(id: string): Promise<Order> {
    const pedido = await ApiClient.get<BackendPedido>(`/pedidos/propios/${id}`);
    return mapBackendOrderToFrontend(pedido);
  }

  static async cancelOrder(id: string): Promise<void> {
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