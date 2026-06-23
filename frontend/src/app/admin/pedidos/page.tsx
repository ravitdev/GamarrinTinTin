import { OrderManagementScreen } from '@/features/orders/components/order-management-screen';

export default function AdminOrdersPage() {
  return (
    <OrderManagementScreen
      title="Gestión de Pedidos"
      description="Consulta pedidos confirmados, revisa su detalle y actualiza su estado."
    />
  );
}
