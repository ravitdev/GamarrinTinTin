'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Eye, EyeOff, Mail, Lock, User, Phone, MapPin, FileText, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useAuth } from './hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { TipoDocumento } from '@/lib/types';
import { cn } from '@/lib/utils';

interface RegistroScreenProps {
  onSuccess?: () => void;
}

// ---------------------------------------------------------------------------
// Reglas de validación
// ---------------------------------------------------------------------------
const EMAIL_REGEX    = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CELULAR_DIGITOS_REGEX = /^[0-9]{9}$/;
const DNI_REGEX      = /^[0-9]{8}$/;
const RUC_DIGITOS_REGEX = /^[0-9]{11}$/;
const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

type FormData = {
  nombres:         string;
  apellidos:       string;
  tipoDocumento:   TipoDocumento;
  numeroDocumento: string;
  celular:         string;
  email:           string;
  direccion:       string;
  password:        string;
  confirmPassword: string;
};

function validateForm(data: FormData): Record<string, string> {
  const e: Record<string, string> = {};

  if (!data.nombres.trim())
    e.nombres = 'El nombre es obligatorio';

  if (!data.apellidos.trim())
    e.apellidos = 'Los apellidos son obligatorios';

  if (!data.numeroDocumento.trim()) {
    e.numeroDocumento = `El ${data.tipoDocumento} es obligatorio`;
  } else if (data.tipoDocumento === TipoDocumento.DNI && !DNI_REGEX.test(data.numeroDocumento)) {
    e.numeroDocumento = 'El DNI debe tener exactamente 8 digitos';
  } else if (data.tipoDocumento === TipoDocumento.RUC && !RUC_DIGITOS_REGEX.test(data.numeroDocumento)) {
    e.numeroDocumento = 'El RUC debe tener exactamente 11 digitos';
  } else if (
    data.tipoDocumento === TipoDocumento.RUC &&
    !data.numeroDocumento.startsWith('10') &&
    !data.numeroDocumento.startsWith('20')
  ) {
    e.numeroDocumento = 'El RUC debe empezar con 10 o 20';
  }

  if (!data.celular.trim()) {
    e.celular = 'El celular es obligatorio';
  } else if (!CELULAR_DIGITOS_REGEX.test(data.celular)) {
    e.celular = 'El celular debe tener exactamente 9 digitos numericos';
  } else if (!data.celular.startsWith('9')) {
    e.celular = 'El celular debe empezar con 9';
  }

  if (!data.email.trim()) {
    e.email = 'El correo es obligatorio';
  } else if (!EMAIL_REGEX.test(data.email)) {
    e.email = 'Ingresa un correo valido (ej. juan.perez@gmail.com)';
  }

  if (!data.direccion.trim())
    e.direccion = 'La direccion es obligatoria';

  if (!data.password) {
    e.password = 'La contrasena es obligatoria';
  } else if (!PASSWORD_REGEX.test(data.password)) {
    e.password = 'Minimo 8 caracteres, incluyendo letras y numeros';
  }

  if (!data.confirmPassword) {
    e.confirmPassword = 'Debes confirmar la contrasena';
  } else if (data.password !== data.confirmPassword) {
    e.confirmPassword = 'Las contrasenas no coinciden';
  }

  return e;
}

// ---------------------------------------------------------------------------
// Componente
// ---------------------------------------------------------------------------
export function RegistroScreen({ onSuccess }: RegistroScreenProps) {
  const { register, isLoading } = useAuth();
  const { toast }               = useToast();

  const [showPassword, setShowPassword] = useState(false);
  const [acceptTerms, setAcceptTerms]   = useState(false);
  const [fieldErrors, setFieldErrors]   = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<FormData>({
    nombres:         '',
    apellidos:       '',
    tipoDocumento:   TipoDocumento.DNI,
    numeroDocumento: '',
    celular:         '',
    email:           '',
    direccion:       '',
    password:        '',
    confirmPassword: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
    // Limpiar error del campo al editar
    if (fieldErrors[id]) setFieldErrors((prev) => ({ ...prev, [id]: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!acceptTerms) {
      toast({
        title: 'Terminos requeridos',
        description: 'Debes aceptar los terminos y condiciones para continuar.',
        variant: 'destructive',
      });
      return;
    }

    const errors = validateForm(formData);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      toast({
        title: 'Datos incompletos o incorrectos',
        description: 'Revisa los campos marcados antes de continuar.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await register({
        nombres:         formData.nombres,
        apellidos:       formData.apellidos,
        tipoDocumento:   formData.tipoDocumento,
        numeroDocumento: formData.numeroDocumento,
        celular:         formData.celular,
        email:           formData.email,
        password:        formData.password,
        confirmPassword: formData.confirmPassword,
        direccion:       formData.direccion,
      });
      onSuccess?.();
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Ocurrio un error inesperado. Intenta de nuevo.';

      const normalizedMessage = message.toLowerCase();

      if (normalizedMessage.includes('email') || normalizedMessage.includes('correo')) {
        setFieldErrors((prev) => ({
          ...prev,
          email: message,
        }));
      }

      if (
        normalizedMessage.includes('documento') ||
        normalizedMessage.includes('dni') ||
        normalizedMessage.includes('ruc')
      ) {
        setFieldErrors((prev) => ({
          ...prev,
          numeroDocumento: message,
        }));
      }

      toast({
        title: 'Error al crear la cuenta',
        description: message,
        variant: 'destructive',
      });
    }
  };

  /** Helper: shortcut para limpiar error al editar un campo específico */
  const clearErr = (key: string) =>
    fieldErrors[key] ? setFieldErrors((p) => ({ ...p, [key]: '' })) : undefined;

  const docPlaceholder = formData.tipoDocumento === TipoDocumento.DNI ? '12345678' : '20123456781';
  const docLabel       = formData.tipoDocumento === TipoDocumento.DNI ? 'Numero de DNI' : 'Numero de RUC';

  return (
    <div className="w-full max-w-2xl">
      <div className="rounded-2xl border border-border bg-card p-8 shadow-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-primary mb-4">
            <span className="font-serif text-2xl font-bold text-primary-foreground">G</span>
          </div>
          <h1 className="font-serif text-2xl font-semibold text-foreground">
            Crea tu cuenta
          </h1>
          <p className="mt-2 text-muted-foreground">
            Registrate para acceder a todas las funcionalidades
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-6">

          {/* ── Información Personal ── */}
          <div className="space-y-4">
            <h3 className="font-medium text-foreground flex items-center gap-2">
              <User className="h-4 w-4 text-accent" />
              Informacion Personal
            </h3>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="nombres">
                  Nombres <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="nombres"
                  placeholder="Juan Carlos"
                  value={formData.nombres}
                  onChange={handleChange}
                  disabled={isLoading}
                  className={fieldErrors.nombres ? 'border-destructive' : ''}
                />
                {fieldErrors.nombres && (
                  <p className="mt-1 text-xs text-destructive">{fieldErrors.nombres}</p>
                )}
              </div>
              <div>
                <Label htmlFor="apellidos">
                  Apellidos <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="apellidos"
                  placeholder="Rodriguez Mendoza"
                  value={formData.apellidos}
                  onChange={handleChange}
                  disabled={isLoading}
                  className={fieldErrors.apellidos ? 'border-destructive' : ''}
                />
                {fieldErrors.apellidos && (
                  <p className="mt-1 text-xs text-destructive">{fieldErrors.apellidos}</p>
                )}
              </div>
            </div>

            {/* Tipo de documento */}
            <div>
              <Label>
                Tipo de Documento <span className="text-destructive">*</span>
              </Label>
              <RadioGroup
                value={formData.tipoDocumento}
                onValueChange={(v) => {
                  setFormData((prev) => ({
                    ...prev,
                    tipoDocumento:   v as TipoDocumento,
                    numeroDocumento: '',
                  }));
                  clearErr('numeroDocumento');
                }}
                className="flex gap-4 mt-2"
              >
                {[TipoDocumento.DNI, TipoDocumento.RUC].map((tipo) => (
                  <label
                    key={tipo}
                    className={cn(
                      'flex items-center gap-2 rounded-lg border px-4 py-2 cursor-pointer transition-colors',
                      formData.tipoDocumento === tipo
                        ? 'border-accent bg-accent/5'
                        : 'border-border hover:border-accent/50'
                    )}
                  >
                    <RadioGroupItem value={tipo} id={tipo} />
                    <span className="text-sm">{tipo === TipoDocumento.RUC ? 'RUC (Empresa)' : 'DNI'}</span>
                  </label>
                ))}
              </RadioGroup>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="numeroDocumento">
                  {docLabel} <span className="text-destructive">*</span>
                </Label>
                <div className="relative mt-1">
                  <FileText className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="numeroDocumento"
                    placeholder={docPlaceholder}
                    maxLength={formData.tipoDocumento === TipoDocumento.DNI ? 8 : 11}
                    className={cn('pl-10', fieldErrors.numeroDocumento && 'border-destructive')}
                    value={formData.numeroDocumento}
                    onChange={handleChange}
                    disabled={isLoading}
                  />
                </div>
                {fieldErrors.numeroDocumento && (
                  <p className="mt-1 text-xs text-destructive">{fieldErrors.numeroDocumento}</p>
                )}
              </div>
              <div>
                <Label htmlFor="celular">
                  Celular <span className="text-destructive">*</span>
                </Label>
                <div className="relative mt-1">
                  <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="celular"
                    type="tel"
                    placeholder="987654321"
                    maxLength={9}
                    className={cn('pl-10', fieldErrors.celular && 'border-destructive')}
                    value={formData.celular}
                    onChange={handleChange}
                    disabled={isLoading}
                  />
                </div>
                {fieldErrors.celular && (
                  <p className="mt-1 text-xs text-destructive">{fieldErrors.celular}</p>
                )}
              </div>
            </div>
          </div>

          {/* ── Información de Contacto ── */}
          <div className="space-y-4 border-t border-border pt-6">
            <h3 className="font-medium text-foreground flex items-center gap-2">
              <Mail className="h-4 w-4 text-accent" />
              Informacion de Contacto
            </h3>

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
                  className={cn('pl-10', fieldErrors.email && 'border-destructive')}
                  value={formData.email}
                  onChange={handleChange}
                  autoComplete="email"
                  disabled={isLoading}
                />
              </div>
              {fieldErrors.email && (
                <p className="mt-1 text-xs text-destructive">{fieldErrors.email}</p>
              )}
            </div>

            <div>
              <Label htmlFor="direccion">
                Direccion <span className="text-destructive">*</span>
              </Label>
              <div className="relative mt-1">
                <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="direccion"
                  placeholder="Av. Los Olivos 345"
                  className={cn('pl-10', fieldErrors.direccion && 'border-destructive')}
                  value={formData.direccion}
                  onChange={handleChange}
                  disabled={isLoading}
                />
              </div>
              {fieldErrors.direccion && (
                <p className="mt-1 text-xs text-destructive">{fieldErrors.direccion}</p>
              )}
            </div>
          </div>

          {/* ── Seguridad ── */}
          <div className="space-y-4 border-t border-border pt-6">
            <h3 className="font-medium text-foreground flex items-center gap-2">
              <Lock className="h-4 w-4 text-accent" />
              Seguridad
            </h3>

            <div>
              <Label htmlFor="password">
                Contrasena <span className="text-destructive">*</span>
              </Label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Min. 8 caracteres con al menos 1 numero"
                  className={cn('pl-10 pr-10', fieldErrors.password && 'border-destructive')}
                  value={formData.password}
                  onChange={handleChange}
                  autoComplete="new-password"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  <span className="sr-only">{showPassword ? 'Ocultar' : 'Mostrar'} contrasena</span>
                </button>
              </div>
              {fieldErrors.password && (
                <p className="mt-1 text-xs text-destructive">{fieldErrors.password}</p>
              )}
            </div>

            <div>
              <Label htmlFor="confirmPassword">
                Confirmar Contrasena <span className="text-destructive">*</span>
              </Label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Repite tu contrasena"
                  className={cn('pl-10', fieldErrors.confirmPassword && 'border-destructive')}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  autoComplete="new-password"
                  disabled={isLoading}
                />
              </div>
              {fieldErrors.confirmPassword && (
                <p className="mt-1 text-xs text-destructive">{fieldErrors.confirmPassword}</p>
              )}
            </div>
          </div>

          {/* ── Términos ── */}
          <div className="border-t border-border pt-6">
            <label className="flex items-start gap-3 cursor-pointer">
              <Checkbox
                checked={acceptTerms}
                onCheckedChange={(v) => setAcceptTerms(v as boolean)}
                className="mt-0.5"
                disabled={isLoading}
              />
              <span className="text-sm text-muted-foreground">
                Acepto los{' '}
                <Link href="/terminos" className="text-accent hover:underline">
                  Terminos y Condiciones
                </Link>
                {' '}y la{' '}
                <Link href="/privacidad" className="text-accent hover:underline">
                  Politica de Privacidad
                </Link>
                {' '}de GamarrinTinTin
              </span>
            </label>
          </div>

          <Button
            type="submit"
            className="w-full gap-2 bg-accent text-accent-foreground hover:bg-accent/90"
            disabled={isLoading}
          >
            {isLoading ? 'Creando cuenta...' : 'Crear Cuenta'}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </form>

        {/* Login Link */}
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Ya tienes una cuenta?{' '}
          <Link href="/login" className="text-accent font-medium hover:underline">
            Inicia sesion aqui
          </Link>
        </p>
      </div>
    </div>
  );
}
