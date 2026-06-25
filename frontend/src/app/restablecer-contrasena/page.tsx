'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { AuthService } from '@/features/auth/services/auth.service';
import { toast } from '@/hooks/use-toast';

const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

export default function RestablecerContrasenaPage() {
  const [token, setToken] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [confirmacion, setConfirmacion] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [procesando, setProcesando] = useState(false);
  const [completado, setCompletado] = useState(false);

  useEffect(() => {
    setToken(new URLSearchParams(window.location.search).get('token') ?? '');
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!token) {
      toast({
        title: 'Enlace no válido',
        description: 'El enlace de recuperación no contiene un token.',
        variant: 'destructive',
      });
      return;
    }

    const errors: Record<string, string> = {};

    if (!contrasena.trim()) {
      errors.contrasena = 'La nueva contraseña es obligatoria.';
    } else if (!PASSWORD_REGEX.test(contrasena)) {
      errors.contrasena =
        'La contraseña debe tener al menos 8 caracteres e incluir letras y números.';
    }

    if (!confirmacion.trim()) {
      errors.confirmacion = 'Debes confirmar la nueva contraseña.';
    } else if (contrasena !== confirmacion) {
      errors.confirmacion = 'Las contraseñas no coinciden.';
    }

    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      return;
    }


    setProcesando(true);
    try {
      await AuthService.resetPassword(token, contrasena);
      setCompletado(true);
      toast({
        title: 'Contraseña actualizada correctamente',
        description: 'Ya puedes iniciar sesión con tu nueva contraseña.',
      });
    } catch (error) {
      toast({
        title: 'No se pudo restablecer la contraseña',
        description:
          error instanceof Error ? error.message : 'Inténtalo nuevamente.',
        variant: 'destructive',
      });
    } finally {
      setProcesando(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex flex-1 items-center justify-center bg-muted/20 px-4 py-16">
        <div className="w-full max-w-md rounded-lg border bg-card p-8 shadow-md">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <KeyRound className="h-6 w-6" />
            </div>
            <h1 className="font-serif text-2xl font-semibold">
              Restablecer contraseña
            </h1>
          </div>

          {completado ? (
            <div className="space-y-6 text-center">
              <p className="text-sm text-muted-foreground">
                Tu contraseña fue actualizada correctamente.
              </p>
              <Button asChild className="w-full">
                <Link href="/login">Ir al inicio de sesión</Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="contrasena">Nueva contraseña</Label>
                <Input
                  id="contrasena"
                  type="password"
                  value={contrasena}
                  onChange={(event) => {
                    setContrasena(event.target.value);
                    if (fieldErrors.contrasena) {
                      setFieldErrors((current) => ({
                        ...current,
                        contrasena: '',
                      }));
                    }
                  }}
                  className={fieldErrors.contrasena ? 'border-destructive' : ''}
                  required
                />
                {fieldErrors.contrasena && (
                  <p className="text-xs text-destructive">{fieldErrors.contrasena}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmacion">Confirmar contraseña</Label>
                <Input
                  id="confirmacion"
                  type="password"
                  value={confirmacion}
                  onChange={(event) => {
                    setConfirmacion(event.target.value);
                    if (fieldErrors.confirmacion) {
                      setFieldErrors((current) => ({
                        ...current,
                        confirmacion: '',
                      }));
                    }
                  }}
                  className={fieldErrors.confirmacion ? 'border-destructive' : ''}
                  required
                />
                {fieldErrors.confirmacion && (
                  <p className="text-xs text-destructive">{fieldErrors.confirmacion}</p>
                )}
              </div>
              <Button type="submit" className="w-full" disabled={procesando}>
                {procesando ? 'Actualizando...' : 'Actualizar contraseña'}
              </Button>
            </form>
          )}

          <div className="mt-8 border-t pt-6 text-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-sm text-accent hover:underline"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver al inicio de sesión
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
