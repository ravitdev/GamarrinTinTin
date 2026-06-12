'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Eye, EyeOff, Mail, Lock, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from './hooks/use-auth';
import { useToast } from '@/hooks/use-toast';

interface LoginScreenProps {
  onSuccess?: () => void;
}

// Validaciones locales (evitan un round-trip innecesario al backend)
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(email: string, password: string): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!email.trim()) {
    errors.email = 'El correo es obligatorio';
  } else if (!EMAIL_REGEX.test(email)) {
    errors.email = 'Ingresa un correo valido (ej. juan.perez@gmail.com)';
  }
  if (!password) {
    errors.password = 'La contrasena es obligatoria';
  } else if (password.length < 8) {
    errors.password = 'La contrasena debe tener al menos 8 caracteres';
  }
  return errors;
}

export function LoginScreen({ onSuccess }: LoginScreenProps) {
  const { login, isLoading } = useAuth();
  const { toast } = useToast();

  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail]               = useState('');
  const [password, setPassword]         = useState('');
  const [fieldErrors, setFieldErrors]   = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});

    const errors = validate(email, password);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      toast({
        title: 'Datos incompletos',
        description: 'Revisa los campos marcados antes de continuar.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await login({ email, password });
      onSuccess?.();
    } catch (err) {
      toast({
        title: 'Error al iniciar sesion',
        description: err instanceof Error ? err.message : 'Credenciales incorrectas. Intenta de nuevo.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="rounded-2xl border border-border bg-card p-8 shadow-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-primary mb-4">
            <span className="font-serif text-2xl font-bold text-primary-foreground">G</span>
          </div>
          <h1 className="font-serif text-2xl font-semibold text-foreground">
            Bienvenido de vuelta
          </h1>
          <p className="mt-2 text-muted-foreground">
            Ingresa a tu cuenta de GamarrinTinTin
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {/* Email */}
          <div>
            <Label htmlFor="email">
              Correo Electronico <span className="text-destructive">*</span>
            </Label>
            <div className="relative mt-1">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="juan.perez@gmail.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (fieldErrors.email) setFieldErrors((p) => ({ ...p, email: '' }));
                }}
                className={fieldErrors.email ? 'pl-10 border-destructive' : 'pl-10'}
                autoComplete="email"
                disabled={isLoading}
              />
            </div>
            {fieldErrors.email && (
              <p className="mt-1 text-xs text-destructive">{fieldErrors.email}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <div className="flex items-center justify-between">
              <Label htmlFor="password">
                Contrasena <span className="text-destructive">*</span>
              </Label>
              <Link
                href="/recuperar-contrasena"
                className="text-xs text-accent hover:underline"
              >
                Olvidaste tu contrasena?
              </Link>
            </div>
            <div className="relative mt-1">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Min. 8 caracteres"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (fieldErrors.password) setFieldErrors((p) => ({ ...p, password: '' }));
                }}
                className={fieldErrors.password ? 'pl-10 pr-10 border-destructive' : 'pl-10 pr-10'}
                autoComplete="current-password"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                <span className="sr-only">
                  {showPassword ? 'Ocultar contrasena' : 'Mostrar contrasena'}
                </span>
              </button>
            </div>
            {fieldErrors.password && (
              <p className="mt-1 text-xs text-destructive">{fieldErrors.password}</p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Checkbox id="remember" />
            <label htmlFor="remember" className="text-sm text-muted-foreground cursor-pointer">
              Recordar mi sesion
            </label>
          </div>

          <Button
            type="submit"
            className="w-full gap-2 bg-accent text-accent-foreground hover:bg-accent/90"
            disabled={isLoading}
          >
            {isLoading ? 'Ingresando...' : 'Iniciar Sesion'}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </form>

        {/* Divider
        <div className="my-6 flex items-center gap-4">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs text-muted-foreground">O continua con</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        Social Login
        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" className="w-full" disabled={isLoading}>
            Google
          </Button>
          <Button variant="outline" className="w-full" disabled={isLoading}>
            Facebook
          </Button>
        </div>*/}

        {/* Register Link */}
        <p className="mt-6 text-center text-sm text-muted-foreground">
          No tienes una cuenta?{' '}
          <Link href="/registro" className="text-accent font-medium hover:underline">
            Registrate aqui
          </Link>
        </p>
      </div>
    </div>
  );
}
