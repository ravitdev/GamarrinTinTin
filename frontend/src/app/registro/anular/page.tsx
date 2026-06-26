'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AuthService } from '@/features/auth/services/auth.service';

export default function AnularRegistroPage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>(
    'loading',
  );
  const [message, setMessage] = useState('Anulando intento de registro...');

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get('token');

    if (!token) {
      setStatus('error');
      setMessage('El enlace de anulacion no es valido.');
      return;
    }

    AuthService.cancelRegistration(token)
      .then(() => {
        setStatus('success');
        setMessage('El intento de registro fue anulado correctamente.');
      })
      .catch((error) => {
        setStatus('error');
        setMessage(
          error instanceof Error
            ? error.message
            : 'No se pudo anular el intento de registro.',
        );
      });
  }, []);

  const Icon = status === 'success' ? CheckCircle2 : XCircle;

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <section className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-lg">
        {status === 'loading' ? (
          <div className="mx-auto mb-5 h-10 w-10 animate-spin rounded-full border-2 border-muted border-t-primary" />
        ) : (
          <Icon
            className={`mx-auto mb-5 h-12 w-12 ${
              status === 'success' ? 'text-green-600' : 'text-destructive'
            }`}
          />
        )}

        <h1 className="font-serif text-2xl font-semibold text-foreground">
          Registro de cuenta
        </h1>
        <p className="mt-3 text-muted-foreground">{message}</p>

        <Button asChild className="mt-6">
          <Link href="/">Volver al inicio</Link>
        </Button>
      </section>
    </main>
  );
}
