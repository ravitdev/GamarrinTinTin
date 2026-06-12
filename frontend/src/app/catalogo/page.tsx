// ============================================================================
// CAPA DE RUTAS (app/) - Enrutador limpio.
// Unica responsabilidad: importar y renderizar la pantalla de la feature.
// Sin estado, sin fetch, sin logica de negocio.
// ============================================================================

import dynamic from 'next/dynamic';
import { Suspense } from 'react';

const CatalogoScreen = dynamic(() => import('@/features/catalogo/catalogo-screen').then(mod => ({ default: mod.CatalogoScreen })), {
  loading: () => <div className="flex min-h-[60vh] items-center justify-center text-muted-foreground">Cargando catálogo...</div>,
  ssr: true,
});

export default function CatalogoPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[60vh] items-center justify-center text-muted-foreground">Cargando...</div>}>
      <CatalogoScreen />
    </Suspense>
  );
}
