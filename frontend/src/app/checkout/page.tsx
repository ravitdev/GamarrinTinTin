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

const CheckoutScreen = dynamic(() => import('@/features/checkout/checkout-screen').then(mod => ({ default: mod.CheckoutScreen })), {
  loading: () => <div className="flex min-h-[60vh] items-center justify-center text-muted-foreground">Cargando checkout...</div>,
  ssr: true,
});

export default function CheckoutPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <Suspense fallback={<div className="flex items-center justify-center min-h-[60vh] text-muted-foreground">Cargando checkout...</div>}>
          <CheckoutScreen />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
