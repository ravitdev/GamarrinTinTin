import Link from 'next/link';
import { ArrowRight, Truck, Shield, Palette, Users, ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { ProductCard } from '@/components/product/product-card';
import { fetchCatalogo } from '@/features/catalogo/services/catalogo.service';
import type { Producto } from '@/lib/types';

const features = [
  { icon: Palette, title: 'Personalización', detail: 'Tu diseño, ubicado en el área de estampado' },
  { icon: Truck, title: 'Envío en Lima', detail: 'Despacho a Lima Metropolitana' },
  { icon: Shield, title: 'Pago seguro', detail: 'Yape, Plin y tarjeta' },
  { icon: Users, title: 'Pedidos por volumen', detail: 'Descuentos para empresas y eventos' },
];

export default async function HomePage() {
  // fetchCatalogo ya tiene fallback a mock-data, pero envolvemos
  // en try/catch como ultima barrera para que la pagina nunca explote.
  let featuredProducts: Producto[] = [];
  try {
    const { data } = await fetchCatalogo({ limit: 4 });
    featuredProducts = data.slice(0, 4);
  } catch {
    featuredProducts = [];
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1">
        {/* ===================== HERO (signature) ===================== */}
        <section className="relative overflow-hidden bg-primary text-primary-foreground">
          <div className="bg-blueprint absolute inset-0 opacity-60" />
          <div className="container relative mx-auto grid items-center gap-12 px-4 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:py-24">
            {/* Copy */}
            <div>
              <span className="eyebrow text-accent">Taller de estampado · Gamarra, Lima</span>
              <h1 className="mt-5 font-display text-4xl font-bold leading-[1.05] tracking-tight text-balance sm:text-5xl lg:text-6xl">
                Tu marca,
                <br />
                estampada con precisión.
              </h1>
              <p className="mt-6 max-w-lg text-lg leading-relaxed text-primary-foreground/70 text-pretty">
                Polos y poleras de algodón pima personalizados para empresas, eventos y equipos.
                Diseña, cotiza por volumen y recíbelos listos para vestir.
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Button size="lg" className="gap-2 bg-accent text-accent-foreground hover:bg-accent/90" asChild>
                  <Link href="/catalogo">
                    Ver catálogo
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-primary-foreground/25 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
                  asChild
                >
                  <Link href="/solicitar-cotizacion">Cotizar por volumen</Link>
                </Button>
              </div>

              {/* Trust stats en mono — datos del taller, no relleno */}
              <dl className="mt-12 grid max-w-md grid-cols-3 gap-6 border-t border-primary-foreground/15 pt-6">
                {[
                  { n: '100+', l: 'empresas' },
                  { n: '32×38', l: 'cm de estampado' },
                  { n: '4', l: 'tallas S–XL' },
                ].map((s) => (
                  <div key={s.l}>
                    <dt className="font-mono text-2xl font-semibold text-primary-foreground">{s.n}</dt>
                    <dd className="mt-1 text-xs uppercase tracking-wider text-primary-foreground/55">{s.l}</dd>
                  </div>
                ))}
              </dl>
            </div>

            {/* Signature visual: prenda + área de estampado con marcas de registro */}
            <div className="relative mx-auto w-full max-w-md">
              <div className="reg-frame rounded-2xl border border-primary-foreground/15 bg-primary-foreground/[0.04] p-6 backdrop-blur-sm">
                <div className="mb-4 flex items-center justify-between font-mono text-[11px] uppercase tracking-wider text-primary-foreground/55">
                  <span>Mesa de trabajo</span>
                  <span className="text-accent">● en vivo</span>
                </div>
                <div className="relative aspect-square rounded-xl bg-primary-foreground/5">
                  <svg viewBox="0 0 240 240" className="h-full w-full" role="img" aria-label="Vista previa de prenda con área de estampado">
                    {/* T-shirt silhouette */}
                    <path
                      d="M120 36 L86 30 C84 44 64 52 52 56 L40 92 L66 102 L66 206 L174 206 L174 102 L200 92 L188 56 C176 52 156 44 154 30 L120 36 Z"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      className="text-primary-foreground/40"
                    />
                    {/* collar */}
                    <path d="M104 33 C108 48 132 48 136 33" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-primary-foreground/40" />
                    {/* print area */}
                    <rect x="92" y="92" width="56" height="68" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="5 4" className="text-accent" />
                    {/* registration crosshairs */}
                    {[[92, 92], [148, 92], [92, 160], [148, 160]].map(([cx, cy], i) => (
                      <g key={i} className="text-accent">
                        <line x1={cx - 7} y1={cy} x2={cx + 7} y2={cy} stroke="currentColor" strokeWidth="1.5" />
                        <line x1={cx} y1={cy - 7} x2={cx} y2={cy + 7} stroke="currentColor" strokeWidth="1.5" />
                      </g>
                    ))}
                  </svg>
                </div>
                <div className="mt-4 flex items-center justify-between text-sm">
                  <span className="font-medium text-primary-foreground">Área de estampado</span>
                  <span className="font-mono text-primary-foreground/60">32 × 38 cm</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===================== FEATURES ===================== */}
        <section className="border-b border-border bg-card">
          <div className="container mx-auto grid grid-cols-2 gap-px overflow-hidden md:grid-cols-4">
            {features.map(({ icon: Icon, title, detail }) => (
              <div key={title} className="flex flex-col gap-3 px-6 py-8">
                <Icon className="h-5 w-5 text-accent" />
                <div>
                  <h3 className="font-medium text-foreground">{title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{detail}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ===================== FEATURED PRODUCTS ===================== */}
        <section className="py-16 lg:py-24">
          <div className="container mx-auto px-4">
            <div className="mb-10 flex items-end justify-between">
              <div>
                <span className="eyebrow text-accent">Lo más pedido</span>
                <h2 className="mt-3 font-display text-3xl font-bold text-foreground">Productos populares</h2>
              </div>
              <Link
                href="/catalogo"
                className="hidden items-center gap-1 text-sm font-medium text-foreground transition-colors hover:text-accent sm:flex"
              >
                Ver todos
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {featuredProducts.length > 0 ? (
                featuredProducts.map((product) => (
                  <ProductCard key={product.idProducto} product={product} />
                ))
              ) : (
                <p className="col-span-full py-12 text-center text-muted-foreground">
                  Aún no hay productos para mostrar. Vuelve pronto.
                </p>
              )}
            </div>

            <div className="mt-8 text-center sm:hidden">
              <Button variant="outline" asChild>
                <Link href="/catalogo">Ver todos los productos</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* ===================== CATEGORIES ===================== */}
        <section className="bg-muted py-16 lg:py-24">
          <div className="container mx-auto px-4">
            <div className="mb-12 text-center">
              <span className="eyebrow justify-center text-accent">Explora</span>
              <h2 className="mt-3 font-display text-3xl font-bold text-foreground">Categorías</h2>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {[
                { tag: 'polo', title: 'Polos', copy: 'Clásicos, deportivos y premium. Perfectos para uniformes y eventos.' },
                { tag: 'polera', title: 'Poleras', copy: 'Con capucha y zipper. Comodidad y estilo para toda ocasión.' },
              ].map((c) => (
                <Link
                  key={c.tag}
                  href={`/catalogo?categoria=${c.tag}`}
                  className="group reg-frame relative overflow-hidden rounded-2xl border border-border bg-card p-8 transition-all hover:border-foreground/15 hover:shadow-[0_16px_50px_-30px] hover:shadow-primary/40"
                >
                  <span className="font-mono text-xs uppercase tracking-[0.16em] text-accent">Categoría</span>
                  <h3 className="mt-2 font-display text-2xl font-bold text-foreground">{c.title}</h3>
                  <p className="mt-2 max-w-xs text-muted-foreground">{c.copy}</p>
                  <div className="mt-6 flex items-center gap-2 text-sm font-medium text-foreground transition-colors group-hover:text-accent">
                    Explorar
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ===================== VOLUME DISCOUNTS CTA ===================== */}
        <section className="py-16 lg:py-24">
          <div className="container mx-auto px-4">
            <div className="relative overflow-hidden rounded-2xl bg-primary text-primary-foreground">
              <div className="bg-blueprint absolute inset-0 opacity-50" />
              <div className="relative grid items-center gap-8 p-8 lg:grid-cols-2 lg:p-12">
                <div>
                  <span className="eyebrow text-accent">Para empresas y eventos</span>
                  <h2 className="mt-3 font-display text-3xl font-bold">Descuentos por volumen</h2>
                  <p className="mt-4 max-w-md leading-relaxed text-primary-foreground/70">
                    Cada producto tiene su propia escala de descuentos. Mientras más pides, mejor el precio:
                    ideal para merchandising, uniformes y campañas.
                  </p>
                  <Button className="mt-8 gap-2 bg-accent text-accent-foreground hover:bg-accent/90" asChild>
                    <Link href="/solicitar-cotizacion">
                      Pedir cotización
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
                {/* Mini tabla de escala — concreta, no decorativa */}
                <div className="rounded-xl border border-primary-foreground/15 bg-primary-foreground/[0.04] p-5">
                  <p className="mb-3 font-mono text-xs uppercase tracking-wider text-primary-foreground/55">
                    Ejemplo de escala
                  </p>
                  <div className="space-y-2.5 font-mono text-sm">
                    {[
                      ['1 – 9 uds', 'precio base'],
                      ['10 – 49 uds', '−10%'],
                      ['50 – 99 uds', '−18%'],
                      ['100+ uds', '−25%'],
                    ].map(([q, d]) => (
                      <div key={q} className="flex items-center justify-between border-b border-primary-foreground/10 pb-2 last:border-0 last:pb-0">
                        <span className="text-primary-foreground/70">{q}</span>
                        <span className="font-semibold text-accent">{d}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
