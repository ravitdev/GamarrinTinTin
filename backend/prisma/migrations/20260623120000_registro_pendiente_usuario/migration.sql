-- CreateEnum
CREATE TYPE "estado_registro_pendiente" AS ENUM ('PENDIENTE', 'CONFIRMADO', 'ANULADO', 'EXPIRADO');

-- CreateTable
CREATE TABLE "registros_pendientes_usuario" (
    "id_registro" SERIAL NOT NULL,
    "nombres" TEXT NOT NULL,
    "apellidos" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "contrasena_hash" TEXT NOT NULL,
    "telefono" TEXT NOT NULL,
    "tipo_documento" "tipo_documento" NOT NULL,
    "numero_documento" TEXT NOT NULL,
    "direccion" TEXT,
    "rol" "rol_usuario" NOT NULL DEFAULT 'CLIENTE',
    "codigo_hash" TEXT NOT NULL,
    "token_anulacion_hash" TEXT NOT NULL,
    "estado" "estado_registro_pendiente" NOT NULL DEFAULT 'PENDIENTE',
    "fecha_expiracion" TIMESTAMP(3) NOT NULL,
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_actualizacion" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "registros_pendientes_usuario_pkey" PRIMARY KEY ("id_registro")
);

-- CreateIndex
CREATE UNIQUE INDEX "registros_pendientes_usuario_email_key" ON "registros_pendientes_usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "registros_pendientes_usuario_token_anulacion_hash_key" ON "registros_pendientes_usuario"("token_anulacion_hash");

-- CreateIndex
CREATE INDEX "registros_pendientes_usuario_email_estado_idx" ON "registros_pendientes_usuario"("email", "estado");

-- CreateIndex
CREATE INDEX "registros_pendientes_usuario_numero_documento_estado_idx" ON "registros_pendientes_usuario"("numero_documento", "estado");
