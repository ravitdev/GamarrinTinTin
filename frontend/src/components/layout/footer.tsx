import Link from 'next/link';
import { Phone, Mail, MapPin, Facebook, Instagram, MessageCircle } from 'lucide-react';

const socials = [
  { label: 'Facebook', href: 'https://www.facebook.com', Icon: Facebook },
  { label: 'Instagram', href: 'https://www.instagram.com', Icon: Instagram },
  { label: 'WhatsApp', href: 'https://wa.me/51987654321', Icon: MessageCircle },
];

export function Footer() {
  return (
    <footer className="border-t border-border bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 py-14">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="reg-frame flex h-9 w-9 items-center justify-center rounded-md bg-accent">
                <span className="font-display text-lg font-bold text-accent-foreground">G</span>
              </div>
              <span className="font-display text-lg font-bold tracking-tight">
                Gamarrin<span className="text-accent">TinTin</span>
              </span>
            </div>
            <p className="text-sm leading-relaxed text-primary-foreground/70">
              Taller de estampado en Gamarra. Polos y poleras personalizados con calidad de impresión
              para empresas, eventos y equipos.
            </p>
            <div className="flex gap-3">
              {socials.map(({ label, href, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-9 w-9 items-center justify-center rounded-md border border-primary-foreground/15 text-primary-foreground/70 transition-colors hover:border-accent hover:text-accent"
                >
                  <Icon className="h-4 w-4" />
                  <span className="sr-only">{label}</span>
                </a>
              ))}
            </div>
          </div>

          {/* Products */}
          <div className="space-y-4">
            <h3 className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-primary-foreground/50">
              Productos
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/catalogo?categoria=polo" className="text-primary-foreground/75 transition-colors hover:text-accent">
                  Polos
                </Link>
              </li>
              <li>
                <Link href="/catalogo?categoria=polera" className="text-primary-foreground/75 transition-colors hover:text-accent">
                  Poleras
                </Link>
              </li>
              <li>
                <Link href="/catalogo?tipo=personalizable" className="text-primary-foreground/75 transition-colors hover:text-accent">
                  Personalizables
                </Link>
              </li>
              <li>
                <Link href="/solicitar-cotizacion" className="text-primary-foreground/75 transition-colors hover:text-accent">
                  Cotizar por volumen
                </Link>
              </li>
            </ul>
          </div>

          {/* Links */}
          <div className="space-y-4">
            <h3 className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-primary-foreground/50">
              Información
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/nosotros" className="text-primary-foreground/75 transition-colors hover:text-accent">
                  Sobre nosotros
                </Link>
              </li>
              <li>
                <Link href="/envios" className="text-primary-foreground/75 transition-colors hover:text-accent">
                  Información de envíos
                </Link>
              </li>
              <li>
                <Link href="/terminos" className="text-primary-foreground/75 transition-colors hover:text-accent">
                  Términos y condiciones
                </Link>
              </li>
              <li>
                <Link href="/privacidad" className="text-primary-foreground/75 transition-colors hover:text-accent">
                  Política de privacidad
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h3 className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-primary-foreground/50">
              Contacto
            </h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                <span className="text-primary-foreground/75">
                  Jr. Gamarra 1234, La Victoria<br />Lima, Perú
                </span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="h-4 w-4 shrink-0 text-accent" />
                <a href="tel:+51987654321" className="text-primary-foreground/75 transition-colors hover:text-accent">
                  +51 987 654 321
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="h-4 w-4 shrink-0 text-accent" />
                <a href="mailto:gamarrintin.ventas@gmail.pe" className="text-primary-foreground/75 transition-colors hover:text-accent">
                  gamarrintin.ventas@gmail.pe
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-primary-foreground/10 pt-6">
          <div className="flex flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left">
            <p className="text-sm text-primary-foreground/50">
              © 2026 GamarrinTinTin. Todos los derechos reservados.
            </p>
            <div className="flex items-center gap-3 text-sm text-primary-foreground/50">
              <span className="font-mono text-xs uppercase tracking-wider">Pagos seguros</span>
              <div className="flex gap-2">
                {['Visa', 'Yape', 'Plin'].map((m) => (
                  <span key={m} className="rounded bg-primary-foreground/10 px-2 py-1 font-mono text-xs">{m}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
