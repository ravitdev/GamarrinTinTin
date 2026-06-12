'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';

const Header = dynamic(() => import('@/components/layout/header').then(mod => ({ default: mod.Header })), {
  loading: () => null,
  ssr: true,
});

const Footer = dynamic(() => import('@/components/layout/footer').then(mod => ({ default: mod.Footer })), {
  loading: () => null,
  ssr: true,
});

const CartScreen = dynamic(() => import('@/features/cart/cart-screen').then(mod => ({ default: mod.CartScreen })), {
  loading: () => <div className="flex min-h-[60vh] items-center justify-center text-muted-foreground">Cargando carrito...</div>,
  ssr: true,
});

export default function CarritoPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <Suspense fallback={<div className="flex items-center justify-center min-h-[60vh] text-muted-foreground">Cargando carrito...</div>}>
          <CartScreen />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
