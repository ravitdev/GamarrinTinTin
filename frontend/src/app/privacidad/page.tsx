'use client';

import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ShieldCheck, Eye, Lock } from 'lucide-react';

export default function PrivacidadPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 py-16 bg-muted/20">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="rounded-2xl border border-border bg-card p-8 md:p-12 shadow-md">
            <div className="flex items-center gap-4 mb-8">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10">
                <ShieldCheck className="h-6 w-6 text-accent" />
              </div>
              <div>
                <h1 className="font-serif text-3xl font-semibold text-foreground">
                  Política de Privacidad
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Última actualización: 12 de Junio de 2026
                </p>
              </div>
            </div>

            <div className="prose prose-slate max-w-none space-y-6 text-muted-foreground leading-relaxed">
              <section className="space-y-3">
                <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                  <Eye className="h-5 w-5 text-accent" />
                  1. Recopilación de Información
                </h2>
                <p>
                  Recopilamos información personal como nombres, apellidos, correo electrónico, celular y dirección únicamente con fines de procesamiento de pedidos, cotizaciones y mejora de su experiencia de compra en nuestra tienda.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                  <Lock className="h-5 w-5 text-accent" />
                  2. Protección y Seguridad
                </h2>
                <p>
                  Implementamos medidas técnicas y de seguridad organizativa adecuadas para proteger su información de accesos no autorizados, pérdida o alteración de datos personales. Las contraseñas están almacenadas de forma encriptada.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-accent" />
                  3. Compartir Información
                </h2>
                <p>
                  GamarrinTinTin no comparte, vende ni alquila sus datos personales a terceros, excepto cuando sea necesario para cumplir con la entrega física de sus pedidos (empresas de Courier y transportistas asociados).
                </p>
              </section>
            </div>

            <div className="mt-12 pt-8 border-t border-border flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                ¿Tiene alguna duda sobre nuestra política?
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
