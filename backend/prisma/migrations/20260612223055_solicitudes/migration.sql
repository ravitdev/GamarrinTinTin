-- CreateEnum
CREATE TYPE "estado_solicitud" AS ENUM ('PENDIENTE', 'APROBADA', 'RECHAZADA', 'PROCESADA');

-- CreateTable
CREATE TABLE "solicitudes_cambio_documento" (
    "id_solicitud" SERIAL NOT NULL,
    "id_usuario" INTEGER NOT NULL,
    "tipo_documento" "tipo_documento" NOT NULL,
    "numero_documento" TEXT NOT NULL,
    "estado" "estado_solicitud" NOT NULL DEFAULT 'PENDIENTE',
    "fecha_solicitud" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_resolucion" TIMESTAMP(3),
    "id_admin_resolvio" INTEGER,

    CONSTRAINT "solicitudes_cambio_documento_pkey" PRIMARY KEY ("id_solicitud")
);

-- CreateTable
CREATE TABLE "solicitudes_desactivacion" (
    "id_solicitud" SERIAL NOT NULL,
    "id_usuario" INTEGER NOT NULL,
    "estado" "estado_solicitud" NOT NULL DEFAULT 'PENDIENTE',
    "fecha_solicitud" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_resolucion" TIMESTAMP(3),
    "id_admin_resolvio" INTEGER,

    CONSTRAINT "solicitudes_desactivacion_pkey" PRIMARY KEY ("id_solicitud")
);

-- CreateIndex
CREATE INDEX "solicitudes_cambio_documento_id_usuario_estado_idx" ON "solicitudes_cambio_documento"("id_usuario", "estado");

-- CreateIndex
CREATE INDEX "solicitudes_desactivacion_id_usuario_estado_idx" ON "solicitudes_desactivacion"("id_usuario", "estado");

-- AddForeignKey
ALTER TABLE "solicitudes_cambio_documento" ADD CONSTRAINT "solicitudes_cambio_documento_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuarios"("id_usuario") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitudes_desactivacion" ADD CONSTRAINT "solicitudes_desactivacion_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuarios"("id_usuario") ON DELETE CASCADE ON UPDATE CASCADE;
