import { useState, useCallback } from 'react';
import useSWR from 'swr';
import { CartService, CartItem, Cart } from '../services/cart.service';

interface UseCartReturn {
  cart: Cart | undefined;
  isLoading: boolean;
  error: string | null;
  addToCart: (item: Omit<CartItem, 'id'>) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  toggleSelection: (itemId: string, selected: boolean) => Promise<void>;
  itemCount: number;
}

export function useCart(): UseCartReturn {
  const [error, setError] = useState<string | null>(null);
  const { data: cart, isLoading, mutate } = useSWR('/cart', () => CartService.getCart() as Promise<Cart>, {
    revalidateOnFocus: false,
  });

  const addToCart = useCallback(
    async (item: Omit<CartItem, 'id'>) => {
      setError(null);
      try {
        await CartService.addToCart(item);
        mutate(); // Revalidate cart
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al agregar al carrito');
      }
    },
    [mutate]
  );

  const updateQuantity = useCallback(
    async (itemId: string, quantity: number) => {
      setError(null);
      try {
        await CartService.updateCartItem(itemId, quantity);
        mutate();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al actualizar cantidad');
      }
    },
    [mutate]
  );

  const removeItem = useCallback(
    async (itemId: string) => {
      setError(null);
      try {
        await CartService.removeFromCart(itemId);
        mutate();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al eliminar producto');
      }
    },
    [mutate]
  );

  const toggleSelection = useCallback(
    async (itemId: string, selected: boolean) => {
      setError(null);
      try {
        await CartService.toggleItemSelection(itemId, selected);
        mutate();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cambiar selección');
      }
    },
    [mutate]
  );

  const clearCart = useCallback(async () => {
    setError(null);
    try {
      await CartService.clearCart();
      mutate();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al limpiar carrito');
    }
  }, [mutate]);

  return {
    cart,
    isLoading,
    error,
    addToCart,
    updateQuantity,
    removeItem,
    clearCart,
    toggleSelection,
    itemCount: cart?.items.length || 0,
  };
}
