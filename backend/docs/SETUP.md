# Guia de setup del backend

## Variables de entorno

Todos los comandos de esta guia se ejecutan desde la carpeta del backend:

```powershell
cd GamarrinTinTin/backend
```

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
npx prisma migrate dev
```

Si alguien modifica `prisma/schema.prisma`, debe crear una nueva migracion con un nombre descriptivo:

```powershell
npx prisma migrate dev --name nombre_del_cambio
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

Cuando terminen un cambio importante, se recomienda validar con Docker completo para comprobar que el proyecto levanta desde cero usando la configuracion del repositorio y las variables del `.env`.

Levantar backend y base de datos:

```powershell
docker compose up --build
```

Comando equivalente si tienes Node/npm instalado:

```powershell
npm run docker:up
```

Aplicar migraciones en otra terminal:

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
