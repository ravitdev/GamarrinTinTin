import { Suspense } from 'react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { SolicitarCotizacionScreen } from '@/features/quotations/components/solicitar-cotizacion-screen';

export default function SolicitarCotizacionPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-muted/20">
        <Suspense fallback={
          <div className="flex min-h-[50vh] items-center justify-center">
            <div className="text-center text-muted-foreground">Cargando formulario de cotización...</div>
          </div>
        }>
          <SolicitarCotizacionScreen />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
