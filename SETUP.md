# Guia de setup del backend

## Requisitos

- Node.js 20 o superior
- npm
- Docker Desktop

## Instalacion

Desde la carpeta del proyecto:

```powershell
npm install
```

## Variables de entorno

Copiar el archivo de ejemplo:

```powershell
Copy-Item .env.example .env
```

Para desarrollo local con Docker, los valores por defecto ya funcionan:

```env
DATABASE_URL="postgresql://gamarrintintin:gamarrintintin@localhost:5432/gamarrintintin?schema=public"
JWT_SECRET="replace-with-a-long-random-secret"
```

Cada integrante puede cambiar su `.env` local si usa otra base de datos.

## Base de datos con Docker

Levantar PostgreSQL:

```powershell
npm run db:up
```

Comando equivalente:

```powershell
docker compose up -d db
```

Apagar PostgreSQL:

```powershell
npm run db:down
```

Borrar la base local y empezar desde cero:

```powershell
npm run db:reset
```

## Migraciones de Prisma

Crear/aplicar migraciones:

```powershell
npx prisma migrate dev --name init
```

Generar cliente Prisma:

```powershell
npm run prisma:generate
```

Validar el schema:

```powershell
npx prisma validate
```

## Levantar backend

```powershell
npm run start:dev
```

La API queda en:

```text
http://localhost:3000
```

## Pruebas

Compilar:

```powershell
npm run build
```

Tests unitarios principales:

```powershell
npm run test -- usuario.manager.spec.ts pedido.manager.spec.ts
```

Tests e2e:

```powershell
npm run test:e2e
```

## Flujo recomendado

Para trabajar nuevas tareas:

```powershell
git checkout develop
git pull
git checkout -b feature/nombre-de-la-tarea
```

No subir el archivo `.env`; solo se sube `.env.example`.
