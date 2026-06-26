import Link from 'next/link';
import { Phone, Mail, MapPin, Facebook, Instagram, MessageCircle } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-border bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent">
                <span className="font-serif text-xl font-bold text-accent-foreground">G</span>
              </div>
              <span className="font-serif text-xl font-semibold">GamarrinTinTin</span>
            </div>
            <p className="text-sm text-primary-foreground/70 leading-relaxed">
              Tu aliado en prendas personalizadas. Calidad premium para empresas y particulares desde Lima, Peru.
            </p>
            <div className="flex gap-4">
              <a href="#" className="text-primary-foreground/70 hover:text-accent transition-colors">
                <Facebook className="h-5 w-5" />
                <span className="sr-only">Facebook</span>
              </a>
              <a href="#" className="text-primary-foreground/70 hover:text-accent transition-colors">
                <Instagram className="h-5 w-5" />
                <span className="sr-only">Instagram</span>
              </a>
              <a href="#" className="text-primary-foreground/70 hover:text-accent transition-colors">
                <MessageCircle className="h-5 w-5" />
                <span className="sr-only">WhatsApp</span>
              </a>
            </div>
          </div>

          {/* Products */}
          <div className="space-y-4">
            <h3 className="font-semibold">Productos</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/catalogo?categoria=polo" className="text-primary-foreground/70 hover:text-accent transition-colors">
                  Polos
                </Link>
              </li>
              <li>
                <Link href="/catalogo?categoria=polera" className="text-primary-foreground/70 hover:text-accent transition-colors">
                  Poleras
                </Link>
              </li>
              <li>
                <Link href="/catalogo?tipo=personalizable" className="text-primary-foreground/70 hover:text-accent transition-colors">
                  Personalizables
                </Link>
              </li>
            </ul>
          </div>

          {/* Links */}
          <div className="space-y-4">
            <h3 className="font-semibold">Enlaces</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/nosotros" className="text-primary-foreground/70 hover:text-accent transition-colors">
                  Sobre Nosotros
                </Link>
              </li>
              <li>
                <Link href="/terminos" className="text-primary-foreground/70 hover:text-accent transition-colors">
                  Terminos y Condiciones
                </Link>
              </li>
              <li>
                <Link href="/privacidad" className="text-primary-foreground/70 hover:text-accent transition-colors">
                  Politica de Privacidad
                </Link>
              </li>
              <li>
                <Link href="/envios" className="text-primary-foreground/70 hover:text-accent transition-colors">
                  Informacion de Envios
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h3 className="font-semibold">Contacto</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-0.5 text-accent shrink-0" />
                <span className="text-primary-foreground/70">
                  Jr. Gamarra 1234, La Victoria<br />Lima, Peru
                </span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-accent shrink-0" />
                <a href="tel:+51987654321" className="text-primary-foreground/70 hover:text-accent transition-colors">
                  +51 987 654 321
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-accent shrink-0" />
                <a href="mailto:gamarrintin.ventas@gmail.pe" className="text-primary-foreground/70 hover:text-accent transition-colors">
                  gamarrintin.ventas@gmail.pe
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-primary-foreground/10 pt-6">
          <div className="flex flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left">
            <p className="text-sm text-primary-foreground/50">
              2026 GamarrinTinTin. Todos los derechos reservados.
            </p>
            <div className="flex items-center gap-4 text-sm text-primary-foreground/50">
              <span>Pagos seguros:</span>
              <div className="flex gap-2">
                <span className="rounded bg-primary-foreground/10 px-2 py-1 text-xs">Visa</span>
                <span className="rounded bg-primary-foreground/10 px-2 py-1 text-xs">Yape</span>
                <span className="rounded bg-primary-foreground/10 px-2 py-1 text-xs">Plin</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
