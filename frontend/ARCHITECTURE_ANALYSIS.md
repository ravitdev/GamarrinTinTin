## ANÁLISIS CONTRASTIVO: Estructura Actual vs. Especificación

### MATRIZ DE CUMPLIMIENTO

#### Capa 1: Routes (`src/app/`)
**Especificación:** Solo archivos `page.tsx` y `layout.tsx` que mapean URLs y renderizan pantallas sin lógica.

| Ruta | Estado | Observación |
|------|--------|-------------|
| `src/app/layout.tsx` | ✅ Implementado | Layout global correcto |
| `src/app/page.tsx` | ✅ Implementado | Home page limpia |
| `src/app/login/page.tsx` | ✅ Refactorizado | Ahora solo renderiza `<LoginScreen />` |
| `src/app/registro/page.tsx` | ✅ Refactorizado | Ahora solo renderiza `<RegistroScreen />` |
| `src/app/catalogo/page.tsx` | ✅ Refactorizado | Solo renderiza `<CatalogoScreen />` |
| `src/app/carrito/page.tsx` | ⚠️ No refactorizado | Aún contiene lógica; necesita Screen |
| `src/app/checkout/page.tsx` | ⚠️ No refactorizado | Aún contiene lógica; necesita Screen |
| `src/app/mi-cuenta/page.tsx` | ⚠️ No refactorizado | Aún contiene lógica; necesita Screen |
| `src/app/admin/page.tsx` | ⚠️ No refactorizado | Aún contiene lógica; necesita Screen |
| `src/app/vendedor/page.tsx` | ⚠️ No refactorizado | Aún contiene lógica; necesita Screen |

---

#### Capa 2: Features (`src/features/[modulo]/`)
**Especificación:** Cada módulo debe tener: `[modulo]-screen.tsx`, `hooks/use-[modulo].ts`, `services/[modulo].service.ts`, `components/`.

| Módulo | Screen | Hook | Service | Components | Estado |
|--------|--------|------|---------|------------|--------|
| **auth** | ✅ login-screen.tsx<br/>✅ registro-screen.tsx | ✅ use-auth.ts | ✅ auth.service.ts | ❌ Falta | ⚠️ Parcial |
| **catalogo** | ✅ catalogo-screen.tsx | ✅ use-catalogo.ts | ✅ catalogo.service.ts | ✅ filter-sidebar.tsx | ✅ Completo |
| **cart** | ❌ Falta | ✅ use-cart.ts | ✅ cart.service.ts | ❌ Falta | ❌ Incompleto |
| **checkout** | ❌ Falta | ✅ use-checkout.ts | ✅ checkout.service.ts | ❌ Falta | ❌ Incompleto |
| **user** | ❌ Falta | ❌ Falta | ✅ user.service.ts | ❌ Falta | ❌ Solo Service |
| **product** | ❌ Falta | ❌ Falta | ✅ product.service.ts | ❌ Falta | ❌ Solo Service |
| **admin** | ❌ Falta | ❌ Falta | ✅ admin.service.ts | ❌ Falta | ❌ Solo Service |
| **vendedor** | ❌ Falta | ❌ Falta | ✅ vendedor.service.ts | ❌ Falta | ❌ Solo Service |
| **quotations** | ❌ Falta | ❌ Falta | ✅ quotation.service.ts | ❌ Falta | ❌ Solo Service |

---

#### Capa 3: Componentes Globales (`src/components/`)
**Especificación:** Solo componentes agnósticos del Design System (UI primarios).

| Categoría | Archivos | Estado |
|-----------|----------|--------|
| **ui/** | 40+ componentes (Button, Input, Dialog, etc.) | ✅ Correcto |
| **layout/** | Header, Footer, Sidebar | ✅ Correcto |
| **Componentes privados de módulos** | Algunos mezclados en `components/` | ⚠️ Revisar |

---

#### Capa 4: Infraestructura (`src/lib/`)
**Especificación:** `api-client.ts`, `types.ts`, `utils.ts`.

| Archivo | Contenido | Estado |
|---------|----------|--------|
| `api-client.ts` | Cliente HTTP centralizado + clase ApiClient | ✅ Implementado |
| `types.ts` | Entidades tipadas del negocio | ✅ Implementado |
| `utils.ts` | Funciones utilitarias (cn, etc.) | ✅ Implementado |

---

### DESVIACIONES IDENTIFICADAS

#### ❌ **DESVIACIÓN CRÍTICA 1: Screens en componentes/**
**Problema:**
```
src/features/auth/components/login-screen.tsx     ← INCORRECTO
src/features/auth/components/registro-screen.tsx  ← INCORRECTO
```

**Especificación correcta:**
```
src/features/auth/login-screen.tsx     ← CORRECTO
src/features/auth/registro-screen.tsx  ← CORRECTO
```

**Razón:** Los screens son la pantalla principal del módulo, no son componentes privados. El directorio `components/` debe alojar solo sub-componentes internos (como `filter-sidebar.tsx`).

---

#### ❌ **DESVIACIÓN CRÍTICA 2: Falta de Screens en Módulos Incompletos**
**Módulos sin Screen pero con Hook + Service:**
- `cart` - Tiene hook + service, pero NO tiene screen
- `checkout` - Tiene hook + service, pero NO tiene screen
- `user` - Tiene service, pero NO tiene hook ni screen
- `product` - Tiene service, pero NO tiene hook ni screen
- `admin`, `vendedor`, `quotations` - Solo services

**Impacto:** Las rutas `src/app/carrito/page.tsx`, `src/app/checkout/page.tsx` etc. aún contienen lógica que debería estar en sus respectivos screens.

---

#### ⚠️ **DESVIACIÓN MENOR: Nombramiento de Screens**
**Problema:**
```
src/features/catalogo/catalogo-screen.tsx  ← Usando nombre completo
```

**Mejor práctica sería:**
```
src/features/catalogo/screen.tsx  ← Nombre genérico
```

O mantener el patrón actual si es consistente. Lo importante es que esté en la raíz del módulo, no en `components/`.

---

### PLAN DE CORRECCIÓN

**Prioridad Alta:**
1. Mover screens de auth fuera de `components/` a raíz del módulo
2. Crear screens faltantes para cart, checkout, user, product
3. Actualizar routes en `src/app/` para que usen los nuevos screens
4. Crear hooks faltantes para user, product, admin, vendedor
5. Revisar `src/components/` para identificar componentes privados mal ubicados

**Prioridad Media:**
6. Renombrar screens a un patrón consistente (decidir entre `[modulo]-screen.tsx` o `screen.tsx`)
7. Documentar la convención en ARCHITECTURE.md
8. Estandarizar estructura en todos los módulos

---

### RESUMEN EJECUTIVO

| Métrica | Valor |
|---------|-------|
| Módulos con Structure 100% correcta | 1/9 (11%) - Solo `catalogo` |
| Módulos parcialmente implementados | 3/9 (33%) - `auth`, `cart`, `checkout` |
| Módulos solo con Service | 5/9 (56%) - `user`, `product`, `admin`, `vendedor`, `quotations` |
| Routes refactorizadas | 3/~24 (12%) |
| **Cumplimiento General** | **~35%** |

**Conclusión:** La arquitectura está en buen camino, pero necesita estandarización y completamiento de todos los módulos para alinearse perfectamente con la especificación Feature-Driven.
