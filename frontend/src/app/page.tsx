import Link from 'next/link';
import { ArrowRight, Truck, Shield, Palette, Users, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { ProductCard } from '@/components/product/product-card';
import { fetchCatalogo } from '@/features/catalogo/services/catalogo.service';
import type { Producto } from '@/lib/types';

export default async function HomePage() {
  // fetchCatalogo ya tiene fallback a mock-data, pero envolvemos
  // en try/catch como ultima barrera para que la pagina nunca explote.
  let featuredProducts: Producto[] = [];
  try {
    const { data } = await fetchCatalogo({ limit: 4 });
    featuredProducts = data.slice(0, 4);
  } catch {
    // Si algo falla de forma inesperada, la pagina carga sin productos
    // en lugar de mostrar un error 500.
    featuredProducts = [];
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-primary py-18 lg:py-30">
          <div className="container relative mx-auto px-4">
            <div className="mx-auto max-w-3xl text-center">
              <span className="inline-block rounded-full bg-accent/20 px-4 py-1.5 text-sm font-medium text-accent mb-6">
                Prendas de Calidad Premium
              </span>
              <h1 className="font-serif text-4xl font-bold tracking-tight text-primary-foreground sm:text-5xl lg:text-6xl text-balance">
                Personaliza tu Estilo, Destaca tu Marca
              </h1>
              <p className="mt-6 text-lg text-primary-foreground/70 leading-relaxed text-pretty">
                Polos y poleras de algodon pima peruano con opcion de personalizacion. 
                Ideal para empresas, eventos y particulares. Descuentos especiales por volumen.
              </p>
              <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link href="/catalogo">
                  <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 gap-2">
                    Ver Catalogo
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
          {/* Decorative Elements */}
          <div className="absolute -bottom-24 -left-24 h-48 w-48 rounded-full bg-accent/10 blur-3xl" />
          <div className="absolute -right-24 -top-24 h-48 w-48 rounded-full bg-accent/10 blur-3xl" />
        </section>

        {/* Features */}
        <section className="border-b border-border bg-card py-10">
          <div className="container mx-auto px-6">
            <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/10">
                  <Palette className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <h3 className="font-medium text-foreground">Personalizacion</h3>
                  <p className="mt-1 text-sm text-muted-foreground">Disenos unicos</p>
                </div>
              </div>
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/10">
                  <Truck className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <h3 className="font-medium text-foreground">Envio Rapido</h3>
                  <p className="mt-1 text-sm text-muted-foreground">Lima Metropolitana</p>
                </div>
              </div>
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/10">
                  <Shield className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <h3 className="font-medium text-foreground">Pago Seguro</h3>
                  <p className="mt-1 text-sm text-muted-foreground">Yape, Plin, Tarjeta</p>
                </div>
              </div>
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/10">
                  <Users className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <h3 className="font-medium text-foreground">Pedidos Mayoristas</h3>
                  <p className="mt-1 text-sm text-muted-foreground">Descuentos especiales</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Products */}
        <section className="py-16 lg:py-24">
          <div className="container mx-auto px-4">
            <div className="flex items-end justify-between mb-10">
              <div>
                <span className="text-sm font-medium uppercase tracking-wider text-accent">
                  Lo Mas Destacado
                </span>
                <h2 className="mt-2 font-serif text-3xl font-semibold text-foreground">
                  Productos Populares
                </h2>
              </div>
              <Link 
                href="/catalogo" 
                className="hidden items-center gap-1 text-sm font-medium text-foreground hover:text-accent transition-colors sm:flex"
              >
                Ver todos
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
            
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {featuredProducts.length > 0 ? (
                featuredProducts.map((product) => (
                  <ProductCard key={product.idProducto} product={product} />
                ))
              ) : (
                <p className="col-span-4 py-12 text-center text-muted-foreground">
                  No hay productos disponibles en este momento.
                </p>
              )}
            </div>

            <div className="mt-8 text-center sm:hidden">
              <Link href="/catalogo">
                <Button variant="outline">Ver todos los productos</Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Categories */}
        <section className="bg-muted py-16 lg:py-24">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <span className="text-sm font-medium uppercase tracking-wider text-accent">
                Explora Nuestras
              </span>
              <h2 className="mt-2 font-serif text-3xl font-semibold text-foreground">
                Categorias
              </h2>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {/* Polos */}
              <Link 
                href="/catalogo?categoria=polo"
                className="group relative overflow-hidden rounded-2xl bg-card p-8 transition-all hover:shadow-lg"
              >
                <div className="relative z-10">
                  <span className="text-sm font-medium text-accent">Categoria</span>
                  <h3 className="mt-2 font-serif text-2xl font-semibold text-foreground">
                    Polos
                  </h3>
                  <p className="mt-2 text-muted-foreground max-w-xs">
                    Polos clasicos, deportivos y premium. Perfectos para uniformes y eventos.
                  </p>
                  <div className="mt-6 flex items-center gap-2 text-sm font-medium text-foreground group-hover:text-accent transition-colors">
                    Explorar
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
                <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-accent/10 transition-transform group-hover:scale-150" />
                <div className="absolute bottom-4 right-4">
                  <div className="h-24 w-20 rounded-lg border-2 border-dashed border-border bg-secondary" />
                </div>
              </Link>

              {/* Poleras */}
              <Link 
                href="/catalogo?categoria=polera"
                className="group relative overflow-hidden rounded-2xl bg-card p-8 transition-all hover:shadow-lg"
              >
                <div className="relative z-10">
                  <span className="text-sm font-medium text-accent">Categoria</span>
                  <h3 className="mt-2 font-serif text-2xl font-semibold text-foreground">
                    Poleras
                  </h3>
                  <p className="mt-2 text-muted-foreground max-w-xs">
                    Poleras con capucha y zipper. Comodidad y estilo para toda ocasion.
                  </p>
                  <div className="mt-6 flex items-center gap-2 text-sm font-medium text-foreground group-hover:text-accent transition-colors">
                    Explorar
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
                <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-primary/10 transition-transform group-hover:scale-150" />
                <div className="absolute bottom-4 right-4">
                  <div className="h-24 w-20 rounded-lg border-2 border-dashed border-border bg-secondary" />
                </div>
              </Link>
            </div>
          </div>
        </section>

        {/* Volume Discounts CTA */}
        <section className="py-16 lg:py-24">
          <div className="container mx-auto px-4">
            <div className="overflow-hidden rounded-2xl bg-primary">
              <div className="grid items-center lg:grid-cols-2">
                <div className="p-8 lg:p-12">
                  <h2 className="mt-4 font-serif text-3xl font-semibold text-primary-foreground">
                    Descuentos por Volumen
                  </h2>
                  <p className="mt-4 text-primary-foreground/70 leading-relaxed">
                    Cada uno de nuestros productos cuenta con sus propios descuentos por volumen.
                    Obtén mejores precios al comprar en cantidad. Ideal para eventos empresariales y merchandising.
                  </p>
                  <Link href="/catalogo" className="mt-8 inline-block">
                    <Button className="bg-accent text-accent-foreground hover:bg-accent/90 gap-2">
                      Explorar Productos
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials / Trust */}
        <section className="border-t border-border bg-muted py-16">
          <div className="container mx-auto px-4">
            <div className="text-center">
              <h2 className="font-serif text-2xl font-semibold text-foreground">
                Confian en Nosotros
              </h2>
              <p className="mt-2 text-muted-foreground">
                Mas de 100 empresas han elegido GamarrinTinTin para sus eventos empresariales y merchandising.
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
