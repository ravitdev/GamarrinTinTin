'use client';

import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Shield, FileText, Scale } from 'lucide-react';

export default function TerminosPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 py-16 bg-muted/20">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="rounded-2xl border border-border bg-card p-8 md:p-12 shadow-md">
            <div className="flex items-center gap-4 mb-8">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10">
                <Scale className="h-6 w-6 text-accent" />
              </div>
              <div>
                <h1 className="font-serif text-3xl font-semibold text-foreground">
                  Términos y Condiciones
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Última actualización: 12 de Junio de 2026
                </p>
              </div>
            </div>

            <div className="prose prose-slate max-w-none space-y-6 text-muted-foreground leading-relaxed">
              <section className="space-y-3">
                <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                  <FileText className="h-5 w-5 text-accent" />
                  1. Aceptación de los Términos
                </h2>
                <p>
                  Al acceder y utilizar los servicios de GamarrinTinTin, usted acepta cumplir con todos los términos, condiciones y políticas aquí descritos. Si no está de acuerdo con alguna parte de estos términos, le solicitamos no utilizar nuestros servicios.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                  <Shield className="h-5 w-5 text-accent" />
                  2. Personalización de Prendas
                </h2>
                <p>
                  El cliente es responsable del contenido de las imágenes, logos y textos subidos para la personalización de las prendas. GamarrinTinTin se reserva el derecho de rechazar cualquier diseño que infrinja derechos de autor, propiedad intelectual o resulte ofensivo.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                  <FileText className="h-5 w-5 text-accent" />
                  3. Precios y Pagos
                </h2>
                <p>
                  Todos los precios mostrados están en Soles (S/.) e incluyen impuestos de ley salvo indicación contraria. Los pedidos requieren el pago del 100% o la aprobación del presupuesto cotizado antes del inicio de la producción.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                  <FileText className="h-5 w-5 text-accent" />
                  4. Envíos y Plazos de Entrega
                </h2>
                <p>
                  Los plazos estimados de entrega son de 3 a 5 días hábiles en Lima y varían para provincias según el destino final. GamarrinTinTin no se responsabiliza por retrasos causados por factores externos de transporte.
                </p>
              </section>
            </div>

            <div className="mt-12 pt-8 border-t border-border flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                ¿Tiene alguna duda sobre nuestros términos?
              </p>
              <Link href="/nosotros">
                <Button variant="outline">Contáctanos</Button>
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
