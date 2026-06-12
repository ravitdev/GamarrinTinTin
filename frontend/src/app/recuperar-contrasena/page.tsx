'use client';

import { useState } from 'react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Lock, Mail, ArrowLeft, KeyRound } from 'lucide-react';

export default function RecuperarContrasenaPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast({
        title: 'Correo requerido',
        description: 'Por favor, ingresa tu correo electrónico.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    // Simular envío de correo
    setTimeout(() => {
      setIsLoading(false);
      setIsSent(true);
      toast({
        title: 'Correo enviado',
        description: 'Hemos enviado las instrucciones a tu bandeja de correo.',
      });
    }, 1500);
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 py-16 bg-muted/20 flex items-center justify-center">
        <div className="container mx-auto px-4 max-w-md">
          <div className="rounded-2xl border border-border bg-card p-8 shadow-md">
            <div className="text-center mb-8">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-primary mb-4 text-primary-foreground">
                <KeyRound className="h-6 w-6" />
              </div>
              <h1 className="font-serif text-2xl font-semibold text-foreground">
                Recuperar Contraseña
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                {isSent 
                  ? 'Revisa tu bandeja de correo electrónico' 
                  : 'Ingresa tu correo para recibir un enlace de recuperación'
                }
              </p>
            </div>

            {!isSent ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email">Correo Electrónico</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="ejemplo@correo.com"
                      className="pl-10"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
                  disabled={isLoading}
                >
                  {isLoading ? 'Enviando...' : 'Enviar Código'}
                </Button>
              </form>
            ) : (
              <div className="space-y-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Si la dirección <strong className="text-foreground">{email}</strong> está registrada, recibirás un mensaje con un enlace para restablecer tu contraseña en los próximos minutos.
                </p>
                <Button 
                  onClick={() => setIsSent(false)} 
                  variant="outline" 
                  className="w-full"
                >
                  Intentar con otro correo
                </Button>
              </div>
            )}

            <div className="mt-8 pt-6 border-t border-border text-center">
              <Link href="/login" className="inline-flex items-center gap-2 text-sm text-accent hover:underline">
                <ArrowLeft className="h-4 w-4" />
                Volver al inicio de sesión
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
