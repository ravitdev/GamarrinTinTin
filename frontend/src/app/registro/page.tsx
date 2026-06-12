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

const RegistroScreen = dynamic(() => import('@/features/auth/registro-screen').then(mod => ({ default: mod.RegistroScreen })), {
  loading: () => <div className="flex min-h-[60vh] items-center justify-center text-muted-foreground">Cargando...</div>,
  ssr: true,
});

export default function RegistroPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex flex-1 items-center justify-center py-12 px-4">
        <Suspense fallback={<div className="flex min-h-[60vh] items-center justify-center text-muted-foreground">Cargando...</div>}>
          <RegistroScreen />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
