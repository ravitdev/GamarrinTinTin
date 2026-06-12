import { useState, useCallback } from 'react';
import { useSWRConfig } from 'swr';
import { CheckoutService, CheckoutItemPayload } from '../services/checkout.service';
import { CartService } from '@/features/cart/services/cart.service';

interface UseCheckoutReturn {
  isProcessing: boolean;
  error: string | null;
  order: any | null;
  confirmOrder: (tokenTarjeta: string) => Promise<void>;
}

export function useCheckout(): UseCheckoutReturn {
  const { mutate } = useSWRConfig();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<any | null>(null);

  const confirmOrder = useCallback(async (tokenTarjeta: string) => {
    setIsProcessing(true);
    setError(null);
    try {
      const cart = await CartService.getCart();
      const selectedItems = cart ? cart.items.filter(item => item.selected !== false) : [];
      if (selectedItems.length === 0) {
        throw new Error('No has seleccionado ningún producto para comprar.');
      }

      // Validar que todos los productos tengan variante asociada
      const itemIncompleto = selectedItems.find(item => !item.idProductoVariante && !item.idCotizacion);
      if (itemIncompleto) {
        throw new Error(`El producto "${itemIncompleto.productName}" no está completamente configurado con una variante de color/talla.`);
      }

      const itemsPayload: CheckoutItemPayload[] = selectedItems.map((item) => ({
        idProductoVariante: item.idProductoVariante!,
        idCotizacion: item.idCotizacion,
        cantidad: item.quantity,
      }));

      // 1. Registrar el pedido en el backend
      const orderResult = await CheckoutService.createOrder(itemsPayload);
      const idPedido = orderResult.idPedido;

      // 2. Procesar el pago en el backend
      // El backend de simulación acepta cualquier token que no sea "rechazado"
      const paymentSuccess = await CheckoutService.processPayment(idPedido, tokenTarjeta);

      if (paymentSuccess) {
        // Vaciar del carrito solo los elementos seleccionados
        await CartService.removeSelectedItems();
        mutate('/cart');

        setOrder(orderResult);
      } else {
        throw new Error('El pago fue rechazado. Intente con otra tarjeta o saldo.');
      }
    } catch (err: any) {
      setError(err instanceof Error ? err.message : 'Error al confirmar pedido');
      throw err;
    } finally {
      setIsProcessing(false);
    }
  }, [mutate]);

  return {
    isProcessing,
    error,
    order,
    confirmOrder,
  };
}
