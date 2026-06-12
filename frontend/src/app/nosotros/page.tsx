'use client';

import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  Award,
  Users,
  Truck,
  ShieldCheck,
  Target,
  Heart,
  MapPin,
  Phone,
  Mail,
  Clock
} from 'lucide-react';

const values = [
  {
    icon: Award,
    title: 'Calidad Premium',
    description: 'Utilizamos los mejores materiales y tecnicas de estampado para garantizar durabilidad y acabados perfectos.'
  },
  {
    icon: Users,
    title: 'Atencion Personalizada',
    description: 'Cada cliente es unico. Nuestro equipo te asesora para encontrar la mejor solucion para tu proyecto.'
  },
  {
    icon: Truck,
    title: 'Entrega Puntual',
    description: 'Cumplimos con los plazos acordados. Tu pedido llegara cuando lo necesites.'
  },
  {
    icon: ShieldCheck,
    title: 'Garantia Total',
    description: 'Respaldamos nuestro trabajo. Si no estas satisfecho, lo solucionamos sin costo adicional.'
  }
];

const stats = [
  { value: '10+', label: 'Anos de Experiencia' },
  { value: '5,000+', label: 'Clientes Satisfechos' },
  { value: '50,000+', label: 'Prendas Entregadas' },
  { value: '98%', label: 'Tasa de Satisfaccion' }
];

export default function NosotrosPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative bg-primary py-20 text-primary-foreground">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-3xl text-center">
              <h1 className="font-serif text-4xl font-semibold leading-tight md:text-5xl">
                Transformamos Ideas en Prendas Unicas
              </h1>
              <p className="mt-6 text-lg leading-relaxed opacity-90">
                Desde 2014, en GamarrinTinTin nos dedicamos a crear prendas personalizadas
                de alta calidad para empresas, instituciones y particulares en todo el Peru.
              </p>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="border-b border-border bg-card py-12">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-3xl font-bold text-accent md:text-4xl">
                    {stat.value}
                  </div>
                  <div className="mt-2 text-sm text-muted-foreground">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Historia Section */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
              <div>
                <span className="text-sm font-medium uppercase tracking-wider text-accent">
                  Nuestra Historia
                </span>
                <h2 className="mt-3 font-serif text-3xl font-semibold text-foreground">
                  Una Pasion por la Calidad y el Detalle
                </h2>
                <div className="mt-6 space-y-4 text-muted-foreground leading-relaxed">
                  <p>
                    GamarrinTinTin nacio de la pasion por crear prendas que cuenten historias.
                    Lo que empezo como un pequeno taller familiar en Lima se ha convertido en
                    una empresa lider en personalizacion textil.
                  </p>
                  <p>
                    Hoy, contamos con equipos de ultima generacion y un equipo de profesionales
                    comprometidos con la excelencia. Trabajamos con empresas de todos los tamanos,
                    desde startups hasta corporaciones multinacionales.
                  </p>
                  <p>
                    Nuestro compromiso sigue siendo el mismo: ofrecer productos de calidad superior,
                    precios competitivos y un servicio que supere las expectativas de nuestros clientes.
                  </p>
                </div>
              </div>
              <div className="relative">
                <div className="aspect-4/3 rounded-2xl border border-border bg-secondary">
                  <div className="flex h-full items-center justify-center">
                    <div className="text-center">
                      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary">
                        <span className="font-serif text-3xl font-bold text-primary-foreground">G</span>
                      </div>
                      <p className="mt-4 text-sm text-muted-foreground">Nuestro Taller</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="border-y border-border bg-muted/30 py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-2xl text-center">
              <span className="text-sm font-medium uppercase tracking-wider text-accent">
                Nuestros Valores
              </span>
              <h2 className="mt-3 font-serif text-3xl font-semibold text-foreground">
                Lo Que Nos Define
              </h2>
              <p className="mt-4 text-muted-foreground">
                Cada prenda que creamos refleja nuestro compromiso con la excelencia y la satisfaccion del cliente.
              </p>
            </div>

            <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {values.map((value) => (
                <div
                  key={value.title}
                  className="rounded-xl border border-border bg-card p-6 transition-shadow hover:shadow-md"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10">
                    <value.icon className="h-6 w-6 text-accent" />
                  </div>
                  <h3 className="mt-4 font-semibold text-foreground">
                    {value.title}
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                    {value.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Mission & Vision */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="grid gap-12 md:grid-cols-2">
              <div className="rounded-xl border border-border bg-card p-8">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary">
                  <Target className="h-6 w-6 text-primary-foreground" />
                </div>
                <h3 className="mt-6 font-serif text-2xl font-semibold text-foreground">
                  Nuestra Mision
                </h3>
                <p className="mt-4 text-muted-foreground leading-relaxed">
                  Brindar soluciones integrales en personalizacion textil, combinando tecnologia
                  de punta con artesania de calidad para crear prendas que superen las expectativas
                  de nuestros clientes, contribuyendo al fortalecimiento de su identidad corporativa
                  y personal.
                </p>
              </div>

              <div className="rounded-xl border border-border bg-card p-8">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent">
                  <Heart className="h-6 w-6 text-accent-foreground" />
                </div>
                <h3 className="mt-6 font-serif text-2xl font-semibold text-foreground">
                  Nuestra Vision
                </h3>
                <p className="mt-4 text-muted-foreground leading-relaxed">
                  Ser reconocidos como la empresa lider en personalizacion textil en Peru,
                  destacando por nuestra innovacion, calidad y compromiso con la sostenibilidad,
                  expandiendo nuestra presencia a nivel nacional e internacional.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Info */}
        <section className="border-t border-border bg-muted/30 py-16">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-3xl">
              <div className="text-center">
                <h2 className="font-serif text-2xl font-semibold text-foreground">
                  Visitanos o Contactanos
                </h2>
                <p className="mt-3 text-muted-foreground">
                  Estamos listos para ayudarte con tu proximo proyecto
                </p>
              </div>

              <div className="mt-10 grid gap-6 sm:grid-cols-2">
                <div className="flex items-start gap-4 rounded-xl border border-border bg-card p-5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/10">
                    <MapPin className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground">Direccion</h4>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Av. Gamarra 123, La Victoria<br />
                      Lima, Peru
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 rounded-xl border border-border bg-card p-5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/10">
                    <Clock className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground">Horario</h4>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Lunes a Viernes: 9:00 - 18:00<br />
                      Sabados: 9:00 - 14:00
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 rounded-xl border border-border bg-card p-5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/10">
                    <Phone className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground">Telefono</h4>
                    <p className="mt-1 text-sm text-muted-foreground">
                      +51 1 234 5678<br />
                      +51 999 888 777
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 rounded-xl border border-border bg-card p-5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/10">
                    <Mail className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground">Email</h4>
                    <p className="mt-1 text-sm text-muted-foreground">
                      ventas@gamarrintintin.com<br />
                      cotizaciones@gamarrintintin.com
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-10 text-center">
                <Link href="/catalogo">
                  <Button size="lg" className="gap-2 bg-accent text-accent-foreground hover:bg-accent/90">
                    Explorar Catalogo
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
