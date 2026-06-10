# Guia de setup del backend

## Variables de entorno

Crear el archivo `.env` desde el ejemplo:

```powershell
Copy-Item .env.example .env
```

Ese archivo no se sube al repositorio. Para desarrollo local, los valores de `.env.example` ya funcionan.

## Desarrollo recomendado

Para programar en el dia a dia se recomienda levantar solo la base de datos con Docker y correr el backend localmente. Asi cada uno puede ver los logs de NestJS directamente en su terminal y trabajar con recarga automatica.

Requisitos:

- Node.js 20 o superior
- npm
- Docker Desktop

Instalar dependencias cuando se clona el proyecto por primera vez o cuando cambian `package.json` / `package-lock.json`:

```powershell
npm install
```

Levantar PostgreSQL:

```powershell
npm run db:up
```

Aplicar migraciones:

```powershell
npx prisma migrate dev --name init
```

Si las migraciones ya existen, tambien se puede usar:

```powershell
npx prisma migrate dev
```

Generar cliente Prisma cuando sea necesario, por ejemplo despues de cambios en `prisma/schema.prisma`:

```powershell
npm run prisma:generate
```

Levantar backend:

```powershell
npm run start:dev
```

La API queda en:

```text
http://localhost:3000
```

## Validacion con Docker completo

Cuando terminen un cambio importante, se recomienda validar que todo levante tambien con Docker completo. Esto ayuda a confirmar que el backend y la base de datos corren de forma consistente en otras PCs.

Levantar backend y base de datos:

```powershell
docker compose up --build
```

Comando equivalente si tienes Node/npm instalado:

```powershell
npm run docker:up
```

La primera vez, aplicar el esquema de Prisma en otra terminal:

```powershell
docker compose exec backend npx prisma migrate dev --name init
```

Si las migraciones ya existen, usar:

```powershell
docker compose exec backend npx prisma migrate dev
```

La API queda en:

```text
http://localhost:3000
```

Apagar los servicios:

```powershell
docker compose down
```

Reiniciar la base de datos local desde cero:

```powershell
docker compose down -v
```
