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

const LoginScreen = dynamic(() => import('@/features/auth/login-screen').then(mod => ({ default: mod.LoginScreen })), {
  loading: () => <div className="flex min-h-[60vh] items-center justify-center text-muted-foreground">Cargando...</div>,
  ssr: true,
});

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex flex-1 items-center justify-center py-12 px-4">
        <Suspense fallback={<div className="flex min-h-[60vh] items-center justify-center text-muted-foreground">Cargando...</div>}>
          <LoginScreen />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
