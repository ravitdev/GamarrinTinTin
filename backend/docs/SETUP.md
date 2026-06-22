# Guia de setup del sistema

## Requisitos

- Docker Desktop abierto y en ejecucion.
- Git.
- Node.js 20 o superior y npm, solo si se trabajara fuera de Docker.

Todos los comandos de Docker de esta guia se ejecutan desde la raiz del
repositorio:

```powershell
cd GamarrinTinTin
```

## Variables de entorno

La primera vez, crear el archivo de variables del backend desde el ejemplo:

```powershell
Copy-Item backend/.env.example backend/.env
```

El archivo `backend/.env` contiene la configuracion local y no se sube al
repositorio. Los valores incluidos en `.env.example` estan preparados para el
entorno local con Docker.

## Primera ejecucion con Docker

Estos pasos levantan la base de datos, aplican las migraciones, cargan los datos
de prueba y finalmente inician el backend y el frontend.

1. Construir las imagenes:

```powershell
docker compose --env-file backend/.env build
```

2. Levantar PostgreSQL:

```powershell
docker compose --env-file backend/.env up -d db
```

3. Aplicar las migraciones existentes:

```powershell
docker compose --env-file backend/.env run --rm backend npx prisma migrate deploy
```

4. Cargar los datos de prueba:

```powershell
docker compose --env-file backend/.env run --rm backend npm run prisma:seed
```

5. Levantar backend y frontend:

```powershell
docker compose --env-file backend/.env up -d backend frontend
```

El sistema queda disponible en:

- Frontend: `http://localhost:3001`
- Backend: `http://localhost:3000`

Para revisar los logs:

```powershell
docker compose --env-file backend/.env logs -f
```

Para salir de los logs sin apagar el sistema, presionar `Ctrl + C`.

## Uso diario con Docker

Si la base de datos ya fue creada y no se desea borrar la informacion:

```powershell
docker compose --env-file backend/.env up -d --build
```

Despues de descargar cambios que incluyan nuevas migraciones:

```powershell
docker compose --env-file backend/.env run --rm backend npx prisma migrate deploy
```

No es necesario ejecutar el seed cada vez. Se utiliza al preparar una base de
datos nueva o cuando se desea restaurar la data de prueba.

Para detener los contenedores conservando la base de datos:

```powershell
docker compose --env-file backend/.env down
```

## Reiniciar todo desde cero

Este procedimiento elimina la base de datos local y todos sus datos.

1. Detener los servicios y eliminar los volumenes:

```powershell
docker compose --env-file backend/.env down -v
```

2. Volver a construir y levantar la base de datos:

```powershell
docker compose --env-file backend/.env build
docker compose --env-file backend/.env up -d db
```

3. Aplicar migraciones y cargar los datos de prueba:

```powershell
docker compose --env-file backend/.env run --rm backend npx prisma migrate deploy
docker compose --env-file backend/.env run --rm backend npm run prisma:seed
```

4. Levantar backend y frontend:

```powershell
docker compose --env-file backend/.env up -d backend frontend
```

## Desarrollo con servicios locales

Para desarrollar con recarga automatica y ver los logs directamente, se puede
usar PostgreSQL en Docker y ejecutar backend y frontend localmente.

Desde la raiz del repositorio, levantar solo la base de datos:

```powershell
docker compose --env-file backend/.env up -d db
```

En una terminal para el backend:

```powershell
cd backend
npm install
npx prisma migrate dev
npm run prisma:generate
npm run start:dev
```

En otra terminal para el frontend:

```powershell
cd frontend
npm install
npm run dev -- -p 3001
```

En este modo:

- Frontend: `http://localhost:3001`
- Backend: `http://localhost:3000`

Si se modifica `backend/prisma/schema.prisma`, desde `backend` se debe crear una
nueva migracion con un nombre descriptivo:

```powershell
npx prisma migrate dev --name nombre_del_cambio
```

La migracion generada debe incluirse en el repositorio junto con el cambio del
schema.
