# GamarrinTinTin

GamarrinTinTin es un sistema web académico para la gestión de productos textiles personalizables, cotizaciones, pedidos, usuarios, diseños predefinidos, carrito de compras, pagos simulados y notificaciones por correo electrónico.

El proyecto fue desarrollado como parte del curso de Ingeniería de Software. La entrega oficial del curso llegó hasta el Sprint 2. El Sprint 3 quedó fuera del alcance final de la presentación, aunque el proyecto puede continuar desarrollándose posteriormente como mejora personal.

---

## Estado del proyecto

Estado actual: **finalizado académicamente hasta Sprint 2**.

Funcionalidades principales implementadas hasta el cierre del curso:

* Gestión de usuarios.
* Roles de Cliente, Vendedor y Administrador.
* Autenticación con JWT.
* Gestión de productos.
* Gestión de variantes de producto.
* Gestión de diseños predefinidos.
* Personalización de productos.
* Solicitud y respuesta de cotizaciones.
* Carrito de compras.
* Registro y gestión de pedidos.
* Pagos simulados.
* Recuperación de contraseña por correo.
* Notificaciones por correo para cotizaciones y pedidos.
* Integración con AWS S3 para almacenamiento de imágenes.
* Configuración SMTP para envío real de correos.
* Frontend web conectado al backend.

---

## Tecnologías utilizadas

### Backend

* Node.js
* TypeScript
* NestJS
* PostgreSQL
* Prisma ORM
* Docker
* JWT
* AWS S3
* Nodemailer / SMTP

### Frontend

* React
* Next.js
* TypeScript
* Tailwind CSS
* Componentes UI reutilizables

### Infraestructura local

* Docker Compose
* PostgreSQL en contenedor
* Backend en contenedor
* Frontend ejecutado localmente con Next.js

---

## Arquitectura general

El sistema sigue una arquitectura de monolito modular, separando responsabilidades por módulos de negocio.

Módulos principales:

* Usuarios
* Productos
* Cotizaciones
* Pedidos
* Diseños predefinidos
* Notificaciones
* Prisma
* Autenticación y autorización

La solución prioriza simplicidad, mantenibilidad y separación clara entre controladores, managers, repositorios, servicios y DTOs.

---

## Roles del sistema

El sistema contempla tres roles principales:

### Cliente

Puede registrarse, iniciar sesión, navegar productos, solicitar cotizaciones, gestionar carrito, realizar pedidos, consultar sus pedidos y recuperar su contraseña.

### Vendedor

Puede gestionar solicitudes de cotización, responder cotizaciones y actualizar estados de pedidos según los permisos definidos.

### Administrador

Puede gestionar usuarios, productos, vendedores, diseños predefinidos, cotizaciones y pedidos.

---

## Variables de entorno

El backend utiliza un archivo `.env` local dentro de la carpeta `backend`.

Este archivo **no debe subirse al repositorio**.

Ejemplo de variables necesarias:

```env
DATABASE_URL=postgresql://usuario:password@db:5432/base_datos?schema=public

POSTGRES_USER=usuario
POSTGRES_PASSWORD=password
POSTGRES_DB=base_datos
POSTGRES_PORT=5433

JWT_SECRET=secret_local

AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=tu_access_key
AWS_SECRET_ACCESS_KEY=tu_secret_key
AWS_SESSION_TOKEN=tu_session_token
AWS_S3_BUCKET=nombre_bucket

MAIL_ENABLED=false
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=correo_remitente@gmail.com
MAIL_PASSWORD=app_password
MAIL_FROM="GamarrinTinTin <correo_remitente@gmail.com>"

FRONTEND_URL=http://localhost:3001
```

Para desarrollo local se puede usar:

```env
MAIL_ENABLED=false
```

Esto no envía correos reales, sino que muestra el contenido del correo en los logs del backend.

Para envío real por SMTP:

```env
MAIL_ENABLED=true
```

---

## Instalación y ejecución local

### 1. Clonar el repositorio

```bash
git clone <url-del-repositorio>
cd gamarrintintin-backend
```

---

### 2. Levantar backend y base de datos

Desde la carpeta `backend`:

```bash
cd backend
docker compose up -d
```

Verificar contenedores:

```bash
docker compose ps
```

---

### 3. Instalar dependencias del backend dentro del contenedor

```bash
docker compose exec backend npm install
```

---

### 4. Aplicar migraciones Prisma

```bash
docker compose exec backend npx prisma migrate deploy
```

---

### 5. Generar Prisma Client

```bash
docker compose exec backend npx prisma generate
```

---

### 6. Ejecutar seed

```bash
docker compose exec backend node prisma/seed.mjs
```

El seed carga datos iniciales para usuarios, productos, variantes, carrito, pedidos y cotizaciones.

Las credenciales de prueba dependen del seed vigente. En la versión utilizada durante las pruebas, las cuentas principales fueron:

```text
admin@gamarrintintin.com
vendedor@gamarrintintin.com
cliente@gamarrintintin.com
```

La contraseña de prueba debe verificarse en la salida del seed.

---

### 7. Compilar backend

```bash
docker compose exec backend npm run build
```

---

## Ejecución del frontend

Desde la carpeta `frontend`:

```bash
cd frontend
npm install
```

Para ejecutar en modo desarrollo se recomienda usar Webpack en el puerto 3001:

```bash
npm run dev -- --webpack -p 3001
```

El frontend queda disponible en:

```text
http://localhost:3001
```

El backend debe estar disponible en:

```text
http://localhost:3000
```

---

## Comandos útiles

### Ver logs del backend

```bash
cd backend
docker compose logs --tail=100 backend
```

### Ver logs en tiempo real

```bash
docker compose logs -f backend
```

### Reiniciar backend sin borrar datos

```bash
docker compose up -d --force-recreate backend
```

### Detener contenedores sin borrar datos

```bash
docker compose stop
```

### Limpiar base de datos local y reaplicar migraciones

Advertencia: este comando elimina los datos locales.

```bash
docker compose exec backend npx prisma migrate reset --force
```

Luego ejecutar nuevamente:

```bash
docker compose exec backend npx prisma generate
docker compose exec backend node prisma/seed.mjs
```

No usar:

```bash
docker compose down -v
```

salvo que se quiera eliminar también los volúmenes de Docker, incluida la base de datos local.

---

## Funcionalidades implementadas

### Usuarios y autenticación

* Registro de clientes.
* Registro de vendedores.
* Inicio de sesión.
* Refresh token.
* Cierre de sesión.
* Gestión de perfil.
* Cambio de contraseña.
* Recuperación de contraseña por correo.
* Roles y permisos.

### Productos

* Listado de productos.
* Detalle de producto.
* Gestión administrativa de productos.
* Variantes por color y talla.
* Imágenes asociadas a productos.
* Productos personalizables y no personalizables.

### Diseños predefinidos

* Registro de diseños predefinidos.
* Listado de diseños.
* Eliminación lógica.
* Carga de imágenes hacia AWS S3.

### Cotizaciones

* Solicitud de cotización por personalización o stock insuficiente.
* Listado de cotizaciones del cliente.
* Listado de solicitudes para personal autorizado.
* Respuesta de cotizaciones por vendedor o administrador.
* Cotizaciones con vencimiento.
* Notificación por correo cuando una cotización es respondida.

### Carrito

* Carrito activo por cliente.
* Ítems de producto.
* Ítems basados en cotización.
* Integración con flujo de pedido.

### Pedidos

* Creación de pedidos.
* Consulta de pedidos propios.
* Consulta y gestión de pedidos por personal.
* Actualización de estado de pedido.
* Pago simulado.
* Notificación por correo cuando cambia el estado de un pedido.

### Notificaciones

* Servicio centralizado de notificaciones.
* Servicio de correo con Nodemailer.
* Modo simulado por logs.
* Modo real mediante SMTP.
* Recuperación de contraseña.
* Notificación de cotización respondida.
* Notificación de pedido actualizado.

---

## AWS S3

El sistema utiliza AWS S3 para almacenar imágenes, principalmente relacionadas con productos y diseños predefinidos.

Variables necesarias:

```env
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_SESSION_TOKEN=...
AWS_S3_BUCKET=...
```

Si se usan credenciales temporales de AWS Academy o Vocareum, es necesario actualizar también `AWS_SESSION_TOKEN`.

Errores comunes:

```text
AccessDenied
InvalidAccessKeyId
SignatureDoesNotMatch
ExpiredToken
NoSuchBucket
not authorized to perform: s3:PutObject
```

Si aparece un `explicit deny`, el problema normalmente está en las políticas o credenciales de AWS, no en el código del backend.

---

## Correo electrónico

El sistema soporta dos modos de correo.

### Modo desarrollo

```env
MAIL_ENABLED=false
```

Los correos no se envían realmente. Se imprimen en logs del backend.

### Modo real

```env
MAIL_ENABLED=true
```

Se envían correos mediante SMTP.

Ejemplo con Gmail:

```env
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=correo@gmail.com
MAIL_PASSWORD=app_password
MAIL_FROM="GamarrinTinTin <correo@gmail.com>"
```

Para Gmail se recomienda usar App Password, no la contraseña personal de la cuenta.

---

## Rutas principales del backend

Algunas rutas disponibles:

```text
POST /usuarios/login
POST /usuarios/recuperar-contrasena
POST /usuarios/restablecer-contrasena
GET  /productos
GET  /productos/:idProducto
POST /cotizaciones
GET  /cotizaciones/propias
PATCH /cotizaciones/:idCotizacion/responder
GET  /pedidos/propios
GET  /pedidos/gestion/todos
PATCH /pedidos/gestion/:idPedido/estado
GET  /disenos-predefinidos
POST /disenos-predefinidos
```

Las rutas pueden variar según la rama o avance posterior del proyecto.

---

## Flujo de trabajo con Git

El proyecto utiliza ramas feature y Pull Requests.

Ramas principales:

```text
main
develop
feature/*
```

Ejemplo de flujo:

```bash
git checkout develop
git pull origin develop
git checkout -b feature/nombre-funcionalidad
```

Commit con Conventional Commits:

```bash
git commit -m "feat(notifications): add email notifications"
git commit -m "fix(auth): validate expired reset token"
git commit -m "chore(docker): expose mail environment variables"
```

Push:

```bash
git push origin feature/nombre-funcionalidad
```

Luego se crea Pull Request hacia `develop`.

---

## Estado académico del proyecto

El proyecto fue presentado hasta el Sprint 2.

El Sprint 3 no fue desarrollado como parte de la entrega final del curso por indicación del profesor. Sin embargo, el sistema queda preparado para continuar posteriormente con mejoras, correcciones y funcionalidades adicionales.

Posibles mejoras futuras:

* Completar funcionalidades previstas para Sprint 3.
* Mejorar cobertura de pruebas automatizadas.
* Refinar la experiencia de usuario.
* Mejorar manejo de errores.
* Agregar colas para notificaciones.
* Mejorar auditoría y trazabilidad.
* Preparar despliegue en la nube.
* Integrar una pasarela de pagos real.
* Fortalecer permisos y validaciones.
* Documentar API con Swagger/OpenAPI.

---

## Seguridad

No se deben subir al repositorio:

```text
.env
credenciales AWS
App Password de Gmail
JWT_SECRET real
tokens temporales
archivos con secretos
```

Archivos como `.env.example` sí pueden versionarse, siempre que no contengan valores reales.

---

## Autores

Proyecto desarrollado por el equipo del curso de Ingeniería de Software.

Repositorio mantenido académicamente hasta Sprint 2, con posibilidad de continuidad posterior como proyecto personal.
