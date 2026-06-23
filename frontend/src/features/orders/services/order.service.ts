import { apiClient } from '@/lib/api-client';
import type { Order, OrderStatus } from '@/lib/types';

type BackendPedidoEstado =
  | 'REGISTRADO'
  | 'CONFIRMADO'
  | 'PROCESANDO'
  | 'ENVIADO'
  | 'ENTREGADO'
  | 'CANCELADO';

interface BackendPedidoCliente {
  idUsuario: number;
  nombres: string;
  apellidos: string;
  email: string;
  telefono: string;
  tipoDocumento: string;
  numeroDocumento: string;
  direccion: string | null;
}

interface BackendPedidoDetalle {
  idPedidoDetalle: number;
  idProductoVariante: number;
  idCotizacion: number | null;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
  nombreProductoSnapshot: string;
  colorSnapshot: string;
  colorHex?: string;
  tallaSnapshot: string;
}

interface BackendPedido {
  idPedido: number;
  idCliente: number;
  cliente?: BackendPedidoCliente;
  fechaCreacion: string | Date;
  fechaActualizacion?: string | Date;
  estado: BackendPedidoEstado;
  subtotal: number;
  descuentoTotal: number;
  total: number;
  tipoEntrega?: 'ENVIO' | 'RECOJO_TIENDA';
  direccionSnapshot: string;
  detalles: BackendPedidoDetalle[];
}

function mapBackendEstadoToFrontend(estado: BackendPedidoEstado): OrderStatus {
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

function mapFrontendEstadoToBackend(estado: OrderStatus): BackendPedidoEstado {
  const estados: Record<OrderStatus, BackendPedidoEstado> = {
    registrado: 'REGISTRADO',
    confirmado: 'CONFIRMADO',
    en_proceso: 'PROCESANDO',
    enviado: 'ENVIADO',
    entregado: 'ENTREGADO',
    cancelado: 'CANCELADO',
  };

  return estados[estado];
}

function mapBackendOrderToFrontend(pedido: BackendPedido): Order {
  return {
    id: pedido.idPedido,
    codigo: `PED-${String(pedido.idPedido).padStart(5, '0')}`,
    cliente: {
      nombres: pedido.cliente?.nombres ?? '',
      apellidos: pedido.cliente?.apellidos ?? '',
      correo: pedido.cliente?.email ?? '',
      celular: pedido.cliente?.telefono ?? '',
      tipoDocumento: pedido.cliente?.tipoDocumento ?? '',
      documento: pedido.cliente?.numeroDocumento ?? '',
      direccion: pedido.cliente?.direccion ?? pedido.direccionSnapshot,
    },
    direccionEnvio: pedido.direccionSnapshot,
    metodoPago: 'TARJETA',
    items: pedido.detalles.map((detalle) => ({
      id: detalle.idPedidoDetalle,
      producto: {
        nombre: detalle.nombreProductoSnapshot,
        precio: detalle.precioUnitario,
      },
      colorSeleccionado: {
        nombre: detalle.colorSnapshot,
        hexCode: detalle.colorHex ?? '#E5E7EB',
      },
      tallaSeleccionada: detalle.tallaSnapshot,
      cantidad: detalle.cantidad,
      precioUnitario: detalle.precioUnitario,
    })),
    subtotal: pedido.subtotal,
    descuento: pedido.descuentoTotal,
    total: pedido.total,
    estado: mapBackendEstadoToFrontend(pedido.estado),
    createdAt: pedido.fechaCreacion,
    updatedAt: pedido.fechaActualizacion ?? pedido.fechaCreacion,
  };
}

export class OrderService {
  static async getMyOrders(): Promise<Order[]> {
    const pedidos = await apiClient<BackendPedido[]>('/pedidos/propios', {
      method: 'GET',
      auth: true,
    });

    return pedidos.map(mapBackendOrderToFrontend);
  }

  static async getOrderDetail(id: string | number): Promise<Order> {
    const pedido = await apiClient<BackendPedido>(`/pedidos/propios/${id}`, {
      method: 'GET',
      auth: true,
    });

    return mapBackendOrderToFrontend(pedido);
  }

  static async getAllOrders(params?: {
    estado?: OrderStatus | 'all';
  }): Promise<Order[]> {
    const query =
      params?.estado && params.estado !== 'all'
        ? `?estado=${encodeURIComponent(mapFrontendEstadoToBackend(params.estado))}`
        : '';

    const pedidos = await apiClient<BackendPedido[]>(`/pedidos${query}`, {
      method: 'GET',
      auth: true,
    });

    return pedidos.map(mapBackendOrderToFrontend);
  }

  static async getManagementOrderDetail(
    id: string | number,
  ): Promise<Order> {
    const pedido = await apiClient<BackendPedido>(`/pedidos/${id}`, {
      method: 'GET',
      auth: true,
    });

    return mapBackendOrderToFrontend(pedido);
  }

  static async updateOrderStatus(
    id: string | number,
    estado: OrderStatus,
  ): Promise<Order> {
    const pedido = await apiClient<BackendPedido>(`/pedidos/${id}/estado`, {
      method: 'PATCH',
      auth: true,
      body: {
        estado: mapFrontendEstadoToBackend(estado),
      },
    });

    return mapBackendOrderToFrontend(pedido);
  }

  static async cancelOrder(id: string): Promise<void> {
    await this.updateOrderStatus(id, 'cancelado');
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