import type { Metadata, Viewport } from 'next'
import { Space_Grotesk, Inter, JetBrains_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

// Display: grotesca tecnica (apparel/print), no serif editorial.
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: '--font-display'
});

const inter = Inter({
  subsets: ["latin"],
  variable: '--font-sans'
});

// Mono utilitaria para datos: precios, codigos, numeros de pedido/cotizacion.
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: '--font-mono'
});

export const metadata: Metadata = {
  title: 'GamarrinTinTin | Prendas Personalizadas',
  description: 'Tienda de polos y poleras personalizadas. Diseños únicos para empresas y particulares. Cotizaciones por volumen disponibles.',
  generator: 'v0.app',
  keywords: ['polos personalizados', 'poleras', 'estampados', 'ropa corporativa', 'Lima', 'Perú'],
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#1b2640',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className={`${spaceGrotesk.variable} ${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="font-sans antialiased bg-background text-foreground">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
