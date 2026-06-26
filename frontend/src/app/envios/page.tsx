'use client';

import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Truck, Store, Clock, PackageCheck, MapPin } from 'lucide-react';

const methods = [
  {
    icon: Truck,
    title: 'Envío a domicilio',
    detail: 'Lima Metropolitana en 3 – 5 días hábiles una vez confirmada la producción. Provincias vía agencia (Olva, Shalom) con costo según destino.',
  },
  {
    icon: Store,
    title: 'Recojo en taller',
    detail: 'Sin costo. Te avisamos por correo cuando tu pedido esté listo para recoger en Jr. Gamarra 1234, La Victoria.',
  },
];

const steps = [
  { label: 'Confirmado', detail: 'Validamos tu pago o cotización aprobada.' },
  { label: 'En producción', detail: 'Cortamos, estampamos y controlamos calidad.' },
  { label: 'Enviado', detail: 'Despachamos y te compartimos el seguimiento.' },
  { label: 'Entregado', detail: 'Recibes tus prendas listas para vestir.' },
];

export default function EnviosPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 bg-muted/20 py-16">
        <div className="container mx-auto max-w-4xl px-4">
          <div className="rounded-2xl border border-border bg-card p-8 shadow-sm md:p-12">
            <div className="mb-10 flex items-center gap-4">
              <div className="reg-frame flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10">
                <Truck className="h-6 w-6 text-accent" />
              </div>
              <div>
                <span className="eyebrow text-accent">Logística</span>
                <h1 className="mt-2 font-display text-3xl font-bold text-foreground">Información de envíos</h1>
              </div>
            </div>

            {/* Métodos */}
            <div className="grid gap-5 sm:grid-cols-2">
              {methods.map(({ icon: Icon, title, detail }) => (
                <div key={title} className="rounded-xl border border-border bg-background p-6">
                  <Icon className="h-5 w-5 text-accent" />
                  <h2 className="mt-3 font-medium text-foreground">{title}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{detail}</p>
                </div>
              ))}
            </div>

            {/* Tiempos */}
            <section className="mt-10">
              <h2 className="flex items-center gap-2 text-xl font-semibold text-foreground">
                <Clock className="h-5 w-5 text-accent" />
                Plazos de producción
              </h2>
              <p className="mt-3 leading-relaxed text-muted-foreground">
                Los pedidos personalizados entran a producción una vez confirmado el pago o aprobada la cotización.
                El tiempo depende del volumen: pedidos pequeños salen en 3 – 5 días hábiles; pedidos por volumen
                (50+ unidades) pueden tomar de 7 a 10 días hábiles. Te confirmamos la fecha exacta al cerrar el pedido.
              </p>
            </section>

            {/* Seguimiento / pasos */}
            <section className="mt-10">
              <h2 className="flex items-center gap-2 text-xl font-semibold text-foreground">
                <PackageCheck className="h-5 w-5 text-accent" />
                Seguimiento del pedido
              </h2>
              <p className="mt-3 text-muted-foreground">
                Puedes ver el estado de cada pedido en{' '}
                <Link href="/mis-pedidos" className="font-medium text-accent hover:underline">Mis pedidos</Link>. Recorre estas etapas:
              </p>
              <ol className="mt-5 grid gap-3 sm:grid-cols-2">
                {steps.map((s, i) => (
                  <li key={s.label} className="flex gap-3 rounded-lg border border-border bg-background p-4">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-accent/10 font-mono text-sm font-semibold text-accent">
                      {i + 1}
                    </span>
                    <div>
                      <p className="font-medium text-foreground">{s.label}</p>
                      <p className="text-sm text-muted-foreground">{s.detail}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </section>

            {/* Cobertura */}
            <section className="mt-10 rounded-xl border border-border bg-background p-6">
              <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
                <MapPin className="h-5 w-5 text-accent" />
                Cobertura y costos
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                El costo de envío se calcula según el distrito o destino y se confirma antes de cerrar el pedido.
                El recojo en taller siempre es gratuito.
              </p>
            </section>

            <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-border pt-8 sm:flex-row sm:items-center">
              <p className="text-sm text-muted-foreground">¿Dudas con tu envío o necesitas una fecha específica?</p>
              <Button variant="outline" asChild>
                <Link href="/nosotros">Contáctanos</Link>
              </Button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
