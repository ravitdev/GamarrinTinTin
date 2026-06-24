'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, KeyRound, Lock, Mail } from 'lucide-react';

import { Footer } from '@/components/layout/footer';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { PasswordRecoveryService } from '@/features/auth/services/password-recovery.service';

export default function RecuperarContrasenaPage() {
  const [email, setEmail] = useState('');
  const [token, setToken] = useState<string | null>(null);
  const [contrasenaNueva, setContrasenaNueva] = useState('');
  const [confirmarContrasena, setConfirmarContrasena] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [isResetComplete, setIsResetComplete] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get('token');

    if (tokenParam) {
      setToken(tokenParam);
    }
  }, []);

  const isResetMode = Boolean(token);

  const handleRequestRecovery = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!email.trim()) {
      toast({
        title: 'Correo requerido',
        description: 'Por favor, ingresa tu correo electrónico.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsLoading(true);
      await PasswordRecoveryService.requestPasswordRecovery(email.trim());

      setIsSent(true);
      toast({
        title: 'Solicitud enviada',
        description:
          'Si el correo está registrado, recibirás instrucciones para recuperar tu contraseña.',
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'No fue posible solicitar la recuperación de contraseña.';

      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!token) {
      toast({
        title: 'Enlace inválido',
        description: 'El enlace de recuperación no es válido.',
        variant: 'destructive',
      });
      return;
    }

    if (!contrasenaNueva.trim() || !confirmarContrasena.trim()) {
      toast({
        title: 'Datos incompletos',
        description: 'Ingresa y confirma tu nueva contraseña.',
        variant: 'destructive',
      });
      return;
    }

    if (contrasenaNueva !== confirmarContrasena) {
      toast({
        title: 'Las contraseñas no coinciden',
        description: 'Verifica la confirmación de tu nueva contraseña.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsLoading(true);

      await PasswordRecoveryService.resetPassword({
        token,
        contrasenaNueva,
      });

      setIsResetComplete(true);
      toast({
        title: 'Contraseña restablecida',
        description: 'Ahora puedes iniciar sesión con tu nueva contraseña.',
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'No fue posible restablecer la contraseña.';

      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const title = isResetMode
    ? 'Restablecer Contraseña'
    : 'Recuperar Contraseña';

  const description = isResetMode
    ? 'Ingresa una nueva contraseña para tu cuenta'
    : isSent
      ? 'Revisa tu bandeja de correo electrónico'
      : 'Ingresa tu correo para recibir un enlace de recuperación';

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 bg-muted/20 py-16 flex items-center justify-center">
        <div className="container mx-auto max-w-md px-4">
          <div className="rounded-2xl border border-border bg-card p-8 shadow-md">
            <div className="mb-8 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                {isResetComplete ? (
                  <CheckCircle2 className="h-6 w-6" />
                ) : (
                  <KeyRound className="h-6 w-6" />
                )}
              </div>

              <h1 className="font-serif text-2xl font-semibold text-foreground">
                {title}
              </h1>

              <p className="mt-2 text-sm text-muted-foreground">
                {description}
              </p>
            </div>

            {!isResetMode && !isSent && (
              <form onSubmit={handleRequestRecovery} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email">Correo electrónico</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="ejemplo@correo.com"
                      className="pl-10"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
                  disabled={isLoading}
                >
                  {isLoading ? 'Enviando...' : 'Enviar enlace'}
                </Button>
              </form>
            )}

            {!isResetMode && isSent && (
              <div className="space-y-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Si la dirección{' '}
                  <strong className="text-foreground">{email}</strong> está
                  registrada, recibirás un mensaje con un enlace para
                  restablecer tu contraseña.
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

            {isResetMode && !isResetComplete && (
              <form onSubmit={handleResetPassword} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="contrasenaNueva">Nueva contraseña</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="contrasenaNueva"
                      type="password"
                      placeholder="Nueva contraseña"
                      className="pl-10"
                      value={contrasenaNueva}
                      onChange={(event) =>
                        setContrasenaNueva(event.target.value)
                      }
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmarContrasena">
                    Confirmar contraseña
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="confirmarContrasena"
                      type="password"
                      placeholder="Confirma tu contraseña"
                      className="pl-10"
                      value={confirmarContrasena}
                      onChange={(event) =>
                        setConfirmarContrasena(event.target.value)
                      }
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
                  disabled={isLoading}
                >
                  {isLoading ? 'Restableciendo...' : 'Restablecer contraseña'}
                </Button>
              </form>
            )}

            {isResetMode && isResetComplete && (
              <div className="space-y-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Tu contraseña fue restablecida correctamente. Ya puedes
                  iniciar sesión con tus nuevas credenciales.
                </p>

                <Button asChild className="w-full">
                  <Link href="/login">Ir al inicio de sesión</Link>
                </Button>
              </div>
            )}

            <div className="mt-8 border-t border-border pt-6 text-center">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 text-sm text-accent hover:underline"
              >
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
