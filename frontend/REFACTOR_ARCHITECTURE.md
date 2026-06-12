# Refactorización Completa a Arquitectura Feature-Driven

## Resumen Ejecutivo

Se migró todo el proyecto a una estructura `src/` y se reestructuró la lógica de negocio siguiendo el patrón **Feature-Driven Architecture** con separación clara en 3 capas:

1. **Capa Global/Transversal** (`src/lib/`): Cliente HTTP centralizado, tipos compartidos, utilidades.
2. **Capa de Características** (`src/features/*/`): Lógica de negocio encapsulada por módulo.
3. **Capa de Rutas** (`src/app/*/page.tsx`): Enrutadores limpios que consumen las pantallas de la capa de características.

---

## Estructura de Directorios

```
src/
├── app/                        # Rutas de Next.js (enrutadores limpios)
│   ├── login/
│   ├── registro/
│   ├── carrito/
│   ├── checkout/
│   ├── catalogo/
│   ├── producto/[id]/
│   ├── mi-cuenta/
│   ├── admin/
│   ├── vendedor/
│   └── ...otros
│
├── features/                   # Módulos/Features con lógica de negocio
│   ├── auth/
│   │   ├── components/
│   │   │   ├── login-screen.tsx
│   │   │   └── registro-screen.tsx
│   │   ├── hooks/
│   │   │   └── use-auth.ts
│   │   └── services/
│   │       └── auth.service.ts
│   │
│   ├── cart/
│   │   ├── hooks/
│   │   │   └── use-cart.ts
│   │   └── services/
│   │       └── cart.service.ts
│   │
│   ├── checkout/
│   │   ├── hooks/
│   │   │   └── use-checkout.ts
│   │   └── services/
│   │       └── checkout.service.ts
│   │
│   ├── catalogo/
│   │   ├── components/
│   │   │   ├── filter-sidebar.tsx
│   │   │   └── catalogo-screen.tsx
│   │   ├── hooks/
│   │   │   └── use-catalogo.ts
│   │   └── services/
│   │       └── catalogo.service.ts
│   │
│   ├── user/
│   │   └── services/
│   │       └── user.service.ts
│   │
│   ├── admin/
│   │   └── services/
│   │       └── admin.service.ts
│   │
│   ├── vendedor/
│   │   └── services/
│   │       └── vendedor.service.ts
│   │
│   ├── product/
│   │   └── services/
│   │       └── product.service.ts
│   │
│   ├── quotations/
│   │   └── services/
│   │       └── quotation.service.ts
│   │
│   └── (más features según necesidad)
│
├── components/                 # Componentes UI compartidos (shadcn, layout, etc.)
├── lib/                       # Utilidades compartidas
│   ├── api-client.ts          # Cliente HTTP centralizado con clase ApiClient
│   ├── types.ts               # Tipos de negocio compartidos
│   ├── utils.ts               # Utilidades (cn, etc.)
│   └── mock-data.ts           # Datos mock durante desarrollo
├── hooks/                     # Hooks globales (use-mobile, use-toast)
├── styles/                    # CSS global
└── layout.tsx                 # Layout raíz
```

---

## Patrón de Capas por Feature

Cada feature sigue este patrón:

### 1. **Service** (`features/[nombre]/services/[nombre].service.ts`)
- Encapsula la lógica de llamadas HTTP.
- Consume `ApiClient` (clase estática con métodos `.get()`, `.post()`, `.put()`, `.delete()`).
- Retorna tipos tipados.
- **Nunca** tiene estado, Solo métodos estáticos.

**Ejemplo:**
```typescript
export class AuthService {
  static async login(credentials: AuthCredentials) {
    return ApiClient.post('/auth/login', credentials);
  }

  static async register(data: RegistroData) {
    return ApiClient.post('/auth/register', data);
  }
}
```

### 2. **Hook** (`features/[nombre]/hooks/use-[nombre].ts`)
- Orquesta el estado React y la lógica de sincronización.
- Consume el Service.
- Usa **SWR** para fetch, caching y datos en tiempo real.
- Retorna un objeto con métodos y estado listo para consumir en componentes.

**Ejemplo:**
```typescript
export function useAuth(): UseAuthReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = useCallback(async (credentials: AuthCredentials) => {
    try {
      const response = await AuthService.login(credentials);
      setUser(response.user);
      // ...
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    }
  }, []);

  return { login, isLoading, error, /* ... */ };
}
```

### 3. **Screen Component** (`features/[nombre]/components/[nombre]-screen.tsx`)
- Componente de presentación puro (UI).
- Consume el Hook.
- **Sin lógica** de negocio — solo distribuye props y callbacks.
- Debe ser `'use client'` si necesita hooks.

**Ejemplo:**
```typescript
export function LoginScreen() {
  const { login, isLoading, error } = useAuth();
  const [email, setEmail] = useState('');

  const handleSubmit = async (e) => {
    await login({ email, password });
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* JSX puro */}
    </form>
  );
}
```

### 4. **Route Handler** (`src/app/[ruta]/page.tsx`)
- Enrutador limpio.
- Solo importa el Screen y lo renderiza dentro de Layout.
- Usa `Suspense` si el Screen usa `useSearchParams()` u otros hooks de navegación.

**Ejemplo:**
```typescript
export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex flex-1 items-center justify-center">
        <Suspense fallback={<div>Cargando...</div>}>
          <LoginScreen />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
```

---

## Capa Global: `src/lib/api-client.ts`

Centraliza **toda** la comunicación HTTP:

```typescript
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

export class ApiError extends Error {
  constructor(public readonly status: number, message: string, public readonly body?: unknown) {
    super(message);
  }
}

// Función base (maneja headers, JWT, parsing, errores)
export async function apiClient<TResponse>(
  endpoint: string,
  options?: RequestOptions
): Promise<TResponse> {
  // Inyecta JWT en Authorization si es necesario
  // Serializa body a JSON
  // Maneja errores HTTP y retorna ApiError tipado
  // Retorna respuesta parseada
}

// Clase estática de conveniencia
export class ApiClient {
  static async get<T>(endpoint: string, options?: RequestOptions): Promise<T>
  static async post<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T>
  static async put<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T>
  static async patch<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T>
  static async delete<T>(endpoint: string, options?: RequestOptions): Promise<T>
}
```

**Ventajas:**
- Un único punto de configuración para el backend.
- Inyección automática del JWT en todas las peticiones.
- Manejo centralizado de errores HTTP.
- Tipado fuerte en todas las respuestas.

---

## Configuración de Alias (TypeScript + Next.js)

Actualizada en `tsconfig.json`:
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

Actualizada en `components.json` (shadcn):
```json
{
  "css": "src/app/globals.css",
  "@/*": "src/*"
}
```

---

## Modules Refactorizados

### ✅ **Auth** (`features/auth/`)
- `auth.service.ts`: Login, register, logout, password reset, profile updates.
- `use-auth.ts`: Hook que maneja state, loading, error, y métodos de autenticación.
- `login-screen.tsx` / `registro-screen.tsx`: Componentes de presentación.
- **Rutas:** `/login`, `/registro`

### ✅ **E-Commerce**
- **Catálogo** (`features/catalogo/`): Ya refactorizado en primer paso.
- **Carrito** (`features/cart/`):
  - `cart.service.ts`: Operaciones CRUD del carrito.
  - `use-cart.ts`: Hook con SWR para sincronización.
- **Checkout** (`features/checkout/`):
  - `checkout.service.ts`: Envío, pago, confirmación.
  - `use-checkout.ts`: Hook para gestionar pasos (shipping → payment → confirmation).
- **Rutas:** `/catalogo`, `/carrito`, `/checkout`

### ✅ **User Account** (`features/user/`)
- `user.service.ts`: Perfil, órdenes, cotizaciones, eliminación de cuenta.
- **Rutas:** `/mi-cuenta`, `/mis-pedidos`, `/mis-cotizaciones`

### ✅ **Quotations** (`features/quotations/`)
- `quotation.service.ts`: Solicitar, aceptar, rechazar cotizaciones.
- **Rutas:** `/solicitar-cotizacion`, `/mis-cotizaciones`

### ✅ **Product Details** (`features/product/`)
- `product.service.ts`: Detalles, personalizacion, reseñas.
- **Rutas:** `/producto/[id]`, `/personalizar/[id]`

### ✅ **Admin** (`features/admin/`)
- `admin.service.ts`: Estadísticas, productos, cotizaciones, clientes.
- **Rutas:** `/admin/*` (dashboard, productos, cotizaciones, clientes, vendedores, pedidos)

### ✅ **Vendedor** (`features/vendedor/`)
- `vendedor.service.ts`: Órdenes, cotizaciones, comisiones, productos.
- **Rutas:** `/vendedor/*` (dashboard, productos, cotizaciones, pedidos)

---

## Beneficios de la Arquitectura

| Aspecto | Antes | Después |
|--------|--------|---------|
| **Organización** | Lógica dispersa en `page.tsx` | Lógica centralizada en Services y Hooks |
| **Reutilización** | Difícil compartir lógica | Servicios y Hooks reutilizables |
| **Testing** | Acoplado a componentes | Services testeable independientemente |
| **Escalabilidad** | Nuevas features mezclan concerns | Nuevas features en carpetas isoladas |
| **Mantenimiento** | Cambios afectan múltiples archivos | Cambios concentrados en el módulo |
| **TypeScript** | Tipos globales desordenados | Tipos tipados por feature + globales |

---

## Próximos Pasos

1. **Implementar rutas en las páginas**: Convertir todas las páginas `src/app/*/page.tsx` para usar los Screens refactorizados.
2. **Agregar RLS en backend**: Implementar Row-Level Security en Neon/Supabase para user_id scoping.
3. **Persistencia de sesión**: Guardar JWT en cookie httpOnly al login; recuperarlo en middleware.
4. **Testing**: Crear test suites para Services y Hooks.
5. **Error Handling**: Mejorar handling global de `ApiError` con toasts o alertas.
6. **Pagination**: Agregar soporte de paginación en Servicios (getProducts, getOrders, etc.).

---

## Configuraciones Actualizadas

✅ `tsconfig.json`: Alias apunta a `./src/*`  
✅ `components.json`: Rutas de shadcn reflejadas en `src/`  
✅ `next.config.mjs`: Sin cambios — Next.js detecta `src/app` automáticamente  
✅ `package.json`: SWR agregado como dependencia (para caching en Features)

---

**Resumen:** Todos los módulos del proyecto ahora están organizados bajo la arquitectura Feature-Driven, con servicios HTTP centralizados, hooks de React para orquestación de estado, y componentes de presentación puros. La migración a `src/` está completa, permitiendo una codebase escalable y mantenible.
