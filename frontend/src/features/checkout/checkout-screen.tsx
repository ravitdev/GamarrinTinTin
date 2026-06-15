'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CreditCard, User, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCheckout } from '@/features/checkout/hooks/use-checkout';
import { useCart } from '@/features/cart/hooks/use-cart';
import { useAuth } from '@/features/auth/hooks/use-auth';

type CheckoutStep = 'shipping' | 'payment' | 'confirm';
type TipoEntrega = 'ENVIO' | 'RECOJO_TIENDA';

export function CheckoutScreen() {
  const router = useRouter();
  const { isHydrating, isLoggedIn } = useAuth();
  const { isProcessing, error, order, confirmOrder } = useCheckout();
  const { cart } = useCart();

  const [step, setStep] = useState<CheckoutStep>('shipping');
  const [tipoEntrega, setTipoEntrega] = useState<TipoEntrega>('ENVIO');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    city: 'Lima',
    district: '',
    zipCode: '',
    cardName: '',
    cardNumber: '',
    expDate: '',
    cvv: '',
  });

  const steps: CheckoutStep[] = ['shipping', 'payment', 'confirm'];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setFormData((prev) => ({ ...prev, [name]: value }));

    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleContinueToPayment = () => {
    const errors: Record<string, string> = {};

    if (tipoEntrega === 'ENVIO' && !formData.address.trim()) {
      errors.address = 'La dirección de envío es obligatoria.';
    }

    setFieldErrors(errors);

    if (Object.keys(errors).length === 0) {
      setStep('payment');
    }
  };

  const handleConfirmOrder = () => {
    confirmOrder(
      formData.cardNumber || 'tarjeta_valida',
      tipoEntrega,
      tipoEntrega === 'ENVIO' ? formData.address.trim() : null,
    );
  };

  useEffect(() => {
    if (!isHydrating && !isLoggedIn) {
      router.push('/login?callback=/checkout');
    }
  }, [isHydrating, isLoggedIn, router]);

  if (isHydrating || !isLoggedIn) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-muted-foreground">
        Validando sesión...
      </div>
    );
  }

  if (order) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <CheckCircle className="mx-auto mb-4 h-16 w-16 text-green-500" />
          <h2 className="font-serif text-2xl font-semibold text-foreground mb-2">
            Pedido confirmado
          </h2>
          <p className="text-muted-foreground mb-4">Número de pedido: {order.id}</p>
          <p className="text-muted-foreground">Te enviaremos un correo con los detalles</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8">
      <h1 className="font-serif text-3xl font-semibold mb-8">Checkout</h1>

      {error && (
        <div className="mb-6 p-4 rounded-lg bg-destructive/10 text-destructive border border-destructive/20">
          {error}
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex gap-4">
            {steps.map((s, idx) => (
              <button
                type="button"
                key={s}
                className={`flex items-center gap-2 pb-2 cursor-pointer border-b-2 transition ${
                  step === s
                    ? 'border-accent text-accent'
                    : idx < steps.indexOf(step)
                      ? 'border-green-500 text-green-500'
                      : 'border-muted text-muted-foreground'
                }`}
                onClick={() => setStep(s)}
              >
                <span className="text-sm font-medium">
                  {s === 'shipping' ? 'Entrega' : s === 'payment' ? 'Pago' : 'Confirmación'}
                </span>
              </button>
            ))}
          </div>

          {step === 'shipping' && (
            <div className="space-y-6">
              <h2 className="flex items-center gap-2 font-semibold text-foreground">
                <User className="h-5 w-5" />
                Información de entrega
              </h2>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="fullName">Nombre completo</Label>
                  <Input
                    id="fullName"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="Juan Carlos Rodriguez"
                  />
                </div>

                <div>
                  <Label htmlFor="email">Correo electrónico</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="tu@correo.com"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+51 987 654 321"
                />
              </div>

              <div className="space-y-3">
                <Label>Tipo de entrega</Label>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Button
                    type="button"
                    variant={tipoEntrega === 'ENVIO' ? 'default' : 'outline'}
                    onClick={() => setTipoEntrega('ENVIO')}
                  >
                    Envío a domicilio
                  </Button>

                  <Button
                    type="button"
                    variant={tipoEntrega === 'RECOJO_TIENDA' ? 'default' : 'outline'}
                    onClick={() => {
                      setTipoEntrega('RECOJO_TIENDA');
                      setFieldErrors((prev) => ({ ...prev, address: '' }));
                    }}
                  >
                    Recojo en tienda
                  </Button>
                </div>
              </div>

              {tipoEntrega === 'ENVIO' ? (
                <div className="space-y-4 rounded-lg border border-border p-4">
                  <div>
                    <Label htmlFor="address">
                      Dirección de envío <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      placeholder="Av. Ejemplo 123"
                      className={fieldErrors.address ? 'border-destructive' : ''}
                    />
                    {fieldErrors.address && (
                      <p className="mt-1 text-xs text-destructive">{fieldErrors.address}</p>
                    )}
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <div>
                      <Label htmlFor="city">Ciudad</Label>
                      <Input
                        id="city"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        placeholder="Lima"
                      />
                    </div>

                    <div>
                      <Label htmlFor="district">Distrito</Label>
                      <Input
                        id="district"
                        name="district"
                        value={formData.district}
                        onChange={handleChange}
                        placeholder="La Victoria"
                      />
                    </div>

                    <div>
                      <Label htmlFor="zipCode">Código postal</Label>
                      <Input
                        id="zipCode"
                        name="zipCode"
                        value={formData.zipCode}
                        onChange={handleChange}
                        placeholder="15001"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border border-border bg-muted/50 p-4">
                  <p className="font-medium text-foreground">Recojo en tienda</p>
                  <p className="text-sm text-muted-foreground">
                    Podrás recoger tu pedido directamente en tienda cuando esté listo.
                  </p>
                </div>
              )}

              <Button
                className="w-full gap-2 bg-accent text-accent-foreground hover:bg-accent/90"
                onClick={handleContinueToPayment}
              >
                Continuar al pago
              </Button>
            </div>
          )}

          {step === 'payment' && (
            <div className="space-y-4">
              <h2 className="flex items-center gap-2 font-semibold text-foreground">
                <CreditCard className="h-5 w-5" />
                Información de pago
              </h2>

              <div>
                <Label htmlFor="cardName">Nombre en la tarjeta</Label>
                <Input
                  id="cardName"
                  name="cardName"
                  value={formData.cardName}
                  onChange={handleChange}
                  placeholder="Juan Carlos Rodriguez"
                />
              </div>

              <div>
                <Label htmlFor="cardNumber">Número de tarjeta</Label>
                <Input
                  id="cardNumber"
                  name="cardNumber"
                  value={formData.cardNumber}
                  onChange={handleChange}
                  placeholder="4111 1111 1111 1111"
                  maxLength={19}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="expDate">Fecha de vencimiento</Label>
                  <Input
                    id="expDate"
                    name="expDate"
                    value={formData.expDate}
                    onChange={handleChange}
                    placeholder="MM/YY"
                    maxLength={5}
                  />
                </div>

                <div>
                  <Label htmlFor="cvv">CVV</Label>
                  <Input
                    id="cvv"
                    name="cvv"
                    value={formData.cvv}
                    onChange={handleChange}
                    placeholder="123"
                    maxLength={4}
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setStep('shipping')}
                >
                  Atrás
                </Button>

                <Button
                  className="flex-1 gap-2 bg-accent text-accent-foreground hover:bg-accent/90"
                  onClick={() => setStep('confirm')}
                >
                  Revisar pedido
                </Button>
              </div>
            </div>
          )}

          {step === 'confirm' && (
            <div className="space-y-4">
              <h2 className="flex items-center gap-2 font-semibold text-foreground">
                <CheckCircle className="h-5 w-5" />
                Revisar tu pedido
              </h2>

              <div className="rounded-lg border border-border bg-muted/50 p-4 space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Entrega:</p>
                  <p className="font-medium">
                    {tipoEntrega === 'ENVIO' ? 'Envío a domicilio' : 'Recojo en tienda'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {tipoEntrega === 'ENVIO' ? formData.address : 'Recojo en tienda'}
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setStep('payment')}
                >
                  Atrás
                </Button>

                <Button
                  className="flex-1 gap-2 bg-green-600 text-white hover:bg-green-700 cursor-pointer"
                  disabled={isProcessing}
                  onClick={handleConfirmOrder}
                >
                  {isProcessing ? 'Procesando...' : 'Confirmar pedido'}
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="rounded-lg border border-border bg-card p-6 h-fit">
          <h2 className="font-semibold text-foreground mb-4">Resumen del pedido</h2>

          <div className="space-y-3 pb-4 border-b border-border">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>S/ {cart?.subtotal.toFixed(2) || '0.00'}</span>
            </div>

            {cart && cart.discountTotal > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Descuento</span>
                <span>-S/ {cart.discountTotal.toFixed(2)}</span>
              </div>
            )}
          </div>

          <div className="flex justify-between font-semibold mt-4">
            <span>Total</span>
            <span className="text-lg text-accent">S/ {cart?.total.toFixed(2) || '0.00'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}