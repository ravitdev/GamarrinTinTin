/*
  Warnings:

  - You are about to drop the column `id_producto` on the `pedido_detalles` table. All the data in the column will be lost.
  - You are about to drop the column `talla` on the `pedido_detalles` table. All the data in the column will be lost.
  - You are about to drop the column `fecha` on the `pedidos` table. All the data in the column will be lost.
  - You are about to drop the column `dni_ruc` on the `usuarios` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[id_cotizacion]` on the table `pedido_detalles` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[numero_documento]` on the table `usuarios` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `color_snapshot` to the `pedido_detalles` table without a default value. This is not possible if the table is not empty.
  - Added the required column `id_producto_variante` to the `pedido_detalles` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nombre_producto_snapshot` to the `pedido_detalles` table without a default value. This is not possible if the table is not empty.
  - Added the required column `subtotal` to the `pedido_detalles` table without a default value. This is not possible if the table is not empty.
  - Added the required column `talla_snapshot` to the `pedido_detalles` table without a default value. This is not possible if the table is not empty.
  - Added the required column `direccion_snapshot` to the `pedidos` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fecha_actualizacion` to the `pedidos` table without a default value. This is not possible if the table is not empty.
  - Added the required column `subtotal` to the `pedidos` table without a default value. This is not possible if the table is not empty.
  - Added the required column `numero_documento` to the `usuarios` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tipo_documento` to the `usuarios` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "tipo_documento" AS ENUM ('DNI', 'RUC');

-- CreateEnum
CREATE TYPE "lado_producto" AS ENUM ('FRONT', 'BACK');

-- CreateEnum
CREATE TYPE "razon_cotizacion" AS ENUM ('PERSONALIZACION', 'STOCK_INSUFICIENTE');

-- CreateEnum
CREATE TYPE "estado_cotizacion" AS ENUM ('PENDIENTE', 'COTIZADO', 'PAGADO', 'EXPIRADO', 'RECHAZADO');

-- CreateEnum
CREATE TYPE "tipo_item_carrito" AS ENUM ('PRODUCTO', 'COTIZACION');

-- CreateEnum
CREATE TYPE "estado_pago" AS ENUM ('PENDIENTE', 'PAGADO', 'FALLO', 'REEMBOLSADO');

-- CreateEnum
CREATE TYPE "metodo_pago" AS ENUM ('TARJETA', 'BILLETERA_DIGITAL');

-- DropForeignKey
ALTER TABLE "pedido_detalles" DROP CONSTRAINT "pedido_detalles_id_pedido_fkey";

-- DropForeignKey
ALTER TABLE "refresh_tokens" DROP CONSTRAINT "refresh_tokens_id_usuario_fkey";

-- DropIndex
DROP INDEX "usuarios_dni_ruc_key";

-- AlterTable
ALTER TABLE "pedido_detalles" DROP COLUMN "id_producto",
DROP COLUMN "talla",
ADD COLUMN     "color_snapshot" TEXT NOT NULL,
ADD COLUMN     "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "id_cotizacion" INTEGER,
ADD COLUMN     "id_producto_variante" INTEGER NOT NULL,
ADD COLUMN     "nombre_producto_snapshot" TEXT NOT NULL,
ADD COLUMN     "subtotal" DECIMAL(12,2) NOT NULL,
ADD COLUMN     "talla_snapshot" "talla" NOT NULL,
ALTER COLUMN "precio_unitario" SET DATA TYPE DECIMAL(12,2);

-- AlterTable
ALTER TABLE "pedidos" DROP COLUMN "fecha",
ADD COLUMN     "descuento_total" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "direccion_snapshot" TEXT NOT NULL,
ADD COLUMN     "fecha_actualizacion" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "subtotal" DECIMAL(12,2) NOT NULL,
ALTER COLUMN "total" SET DATA TYPE DECIMAL(12,2);

-- AlterTable
ALTER TABLE "usuarios" DROP COLUMN "dni_ruc",
ADD COLUMN     "fecha_eliminacion" TIMESTAMP(3),
ADD COLUMN     "numero_documento" TEXT NOT NULL,
ADD COLUMN     "tipo_documento" "tipo_documento" NOT NULL;

-- CreateTable
CREATE TABLE "categorias" (
    "id_categoria" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "es_activo" BOOLEAN NOT NULL DEFAULT true,
    "fecha_eliminacion" TIMESTAMP(3),
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_actualizacion" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categorias_pkey" PRIMARY KEY ("id_categoria")
);

-- CreateTable
CREATE TABLE "productos" (
    "id_producto" SERIAL NOT NULL,
    "id_categoria" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "precio_base" DECIMAL(12,2) NOT NULL,
    "es_personalizable" BOOLEAN NOT NULL DEFAULT false,
    "es_activo" BOOLEAN NOT NULL DEFAULT true,
    "fecha_eliminacion" TIMESTAMP(3),
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_actualizacion" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "productos_pkey" PRIMARY KEY ("id_producto")
);

-- CreateTable
CREATE TABLE "producto_variantes" (
    "id_producto_variante" SERIAL NOT NULL,
    "id_producto" INTEGER NOT NULL,
    "color_nombre" TEXT NOT NULL,
    "color_hex" TEXT NOT NULL,
    "talla" "talla" NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "es_activo" BOOLEAN NOT NULL DEFAULT true,
    "fecha_eliminacion" TIMESTAMP(3),
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_actualizacion" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "producto_variantes_pkey" PRIMARY KEY ("id_producto_variante")
);

-- CreateTable
CREATE TABLE "producto_imagenes" (
    "id_producto_imagen" SERIAL NOT NULL,
    "id_producto" INTEGER NOT NULL,
    "color_hex" TEXT NOT NULL,
    "lado" "lado_producto" NOT NULL,
    "url_imagen" TEXT NOT NULL,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "es_activo" BOOLEAN NOT NULL DEFAULT true,
    "fecha_eliminacion" TIMESTAMP(3),
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_actualizacion" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "producto_imagenes_pkey" PRIMARY KEY ("id_producto_imagen")
);

-- CreateTable
CREATE TABLE "descuentos_volumen" (
    "id_descuento_volumen" SERIAL NOT NULL,
    "id_producto" INTEGER NOT NULL,
    "cantidad_minima" INTEGER NOT NULL,
    "porcentaje_descuento" DECIMAL(5,2) NOT NULL,
    "es_activo" BOOLEAN NOT NULL DEFAULT true,
    "fecha_eliminacion" TIMESTAMP(3),
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_actualizacion" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "descuentos_volumen_pkey" PRIMARY KEY ("id_descuento_volumen")
);

-- CreateTable
CREATE TABLE "disenos_predefinidos" (
    "id_diseno_predefinido" SERIAL NOT NULL,
    "creado_por_id" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "url_imagen" TEXT NOT NULL,
    "es_activo" BOOLEAN NOT NULL DEFAULT true,
    "fecha_eliminacion" TIMESTAMP(3),
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_actualizacion" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "disenos_predefinidos_pkey" PRIMARY KEY ("id_diseno_predefinido")
);

-- CreateTable
CREATE TABLE "cotizaciones" (
    "id_cotizacion" SERIAL NOT NULL,
    "id_cliente" INTEGER NOT NULL,
    "atendido_por_id" INTEGER,
    "id_producto_variante" INTEGER NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "razon" "razon_cotizacion" NOT NULL,
    "estado" "estado_cotizacion" NOT NULL DEFAULT 'PENDIENTE',
    "precio_cotizado" DECIMAL(12,2),
    "fecha_cotizacion" TIMESTAMP(3),
    "fecha_expiracion" TIMESTAMP(3),
    "nombre_producto_snapshot" TEXT NOT NULL,
    "color_snapshot" TEXT NOT NULL,
    "talla_snapshot" "talla" NOT NULL,
    "precio_base_snapshot" DECIMAL(12,2) NOT NULL,
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_actualizacion" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cotizaciones_pkey" PRIMARY KEY ("id_cotizacion")
);

-- CreateTable
CREATE TABLE "personalizaciones" (
    "id_personalizacion" SERIAL NOT NULL,
    "id_cotizacion" INTEGER NOT NULL,
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_actualizacion" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "personalizaciones_pkey" PRIMARY KEY ("id_personalizacion")
);

-- CreateTable
CREATE TABLE "imagenes_personalizadas" (
    "id_imagen_personalizada" SERIAL NOT NULL,
    "id_personalizacion" INTEGER NOT NULL,
    "id_diseno_predefinido" INTEGER,
    "url_imagen" TEXT NOT NULL,
    "lado" "lado_producto" NOT NULL,
    "x_posicion" DECIMAL(5,2) NOT NULL,
    "y_posicion" DECIMAL(5,2) NOT NULL,
    "ancho_porcentaje" DECIMAL(5,2) NOT NULL,
    "alto_porcentaje" DECIMAL(5,2) NOT NULL,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_actualizacion" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "imagenes_personalizadas_pkey" PRIMARY KEY ("id_imagen_personalizada")
);

-- CreateTable
CREATE TABLE "carritos" (
    "id_carrito" SERIAL NOT NULL,
    "id_usuario" INTEGER NOT NULL,
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_actualizacion" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "carritos_pkey" PRIMARY KEY ("id_carrito")
);

-- CreateTable
CREATE TABLE "items_carrito" (
    "id_item_carrito" SERIAL NOT NULL,
    "id_carrito" INTEGER NOT NULL,
    "tipo_item" "tipo_item_carrito" NOT NULL,
    "id_producto_variante" INTEGER,
    "id_cotizacion" INTEGER,
    "cantidad" INTEGER NOT NULL,
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_actualizacion" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "items_carrito_pkey" PRIMARY KEY ("id_item_carrito")
);

-- CreateTable
CREATE TABLE "pagos" (
    "id_pago" SERIAL NOT NULL,
    "id_pedido" INTEGER NOT NULL,
    "monto" DECIMAL(12,2) NOT NULL,
    "metodo_pago" "metodo_pago" NOT NULL,
    "estado" "estado_pago" NOT NULL DEFAULT 'PENDIENTE',
    "id_transaccion_externa" TEXT,
    "referencia_externa" TEXT,
    "gateway_response" JSONB,
    "fecha_pago" TIMESTAMP(3),
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_actualizacion" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pagos_pkey" PRIMARY KEY ("id_pago")
);

-- CreateIndex
CREATE UNIQUE INDEX "categorias_nombre_key" ON "categorias"("nombre");

-- CreateIndex
CREATE INDEX "productos_id_categoria_es_activo_idx" ON "productos"("id_categoria", "es_activo");

-- CreateIndex
CREATE INDEX "productos_nombre_idx" ON "productos"("nombre");

-- CreateIndex
CREATE INDEX "producto_variantes_id_producto_idx" ON "producto_variantes"("id_producto");

-- CreateIndex
CREATE UNIQUE INDEX "producto_variantes_id_producto_color_hex_talla_key" ON "producto_variantes"("id_producto", "color_hex", "talla");

-- CreateIndex
CREATE INDEX "producto_imagenes_id_producto_color_hex_idx" ON "producto_imagenes"("id_producto", "color_hex");

-- CreateIndex
CREATE UNIQUE INDEX "producto_imagenes_id_producto_color_hex_lado_key" ON "producto_imagenes"("id_producto", "color_hex", "lado");

-- CreateIndex
CREATE INDEX "descuentos_volumen_id_producto_cantidad_minima_idx" ON "descuentos_volumen"("id_producto", "cantidad_minima");

-- CreateIndex
CREATE UNIQUE INDEX "descuentos_volumen_id_producto_cantidad_minima_key" ON "descuentos_volumen"("id_producto", "cantidad_minima");

-- CreateIndex
CREATE INDEX "disenos_predefinidos_creado_por_id_idx" ON "disenos_predefinidos"("creado_por_id");

-- CreateIndex
CREATE INDEX "disenos_predefinidos_es_activo_idx" ON "disenos_predefinidos"("es_activo");

-- CreateIndex
CREATE INDEX "cotizaciones_id_cliente_estado_idx" ON "cotizaciones"("id_cliente", "estado");

-- CreateIndex
CREATE INDEX "cotizaciones_atendido_por_id_idx" ON "cotizaciones"("atendido_por_id");

-- CreateIndex
CREATE INDEX "cotizaciones_id_producto_variante_idx" ON "cotizaciones"("id_producto_variante");

-- CreateIndex
CREATE UNIQUE INDEX "personalizaciones_id_cotizacion_key" ON "personalizaciones"("id_cotizacion");

-- CreateIndex
CREATE INDEX "imagenes_personalizadas_id_personalizacion_idx" ON "imagenes_personalizadas"("id_personalizacion");

-- CreateIndex
CREATE INDEX "imagenes_personalizadas_id_diseno_predefinido_idx" ON "imagenes_personalizadas"("id_diseno_predefinido");

-- CreateIndex
CREATE UNIQUE INDEX "carritos_id_usuario_key" ON "carritos"("id_usuario");

-- CreateIndex
CREATE UNIQUE INDEX "items_carrito_id_cotizacion_key" ON "items_carrito"("id_cotizacion");

-- CreateIndex
CREATE INDEX "items_carrito_id_carrito_idx" ON "items_carrito"("id_carrito");

-- CreateIndex
CREATE INDEX "items_carrito_id_producto_variante_idx" ON "items_carrito"("id_producto_variante");

-- CreateIndex
CREATE INDEX "items_carrito_id_cotizacion_idx" ON "items_carrito"("id_cotizacion");

-- CreateIndex
CREATE INDEX "items_carrito_tipo_item_idx" ON "items_carrito"("tipo_item");

-- CreateIndex
CREATE UNIQUE INDEX "pagos_id_transaccion_externa_key" ON "pagos"("id_transaccion_externa");

-- CreateIndex
CREATE INDEX "pagos_id_pedido_idx" ON "pagos"("id_pedido");

-- CreateIndex
CREATE INDEX "pagos_estado_idx" ON "pagos"("estado");

-- CreateIndex
CREATE UNIQUE INDEX "pedido_detalles_id_cotizacion_key" ON "pedido_detalles"("id_cotizacion");

-- CreateIndex
CREATE INDEX "pedido_detalles_id_pedido_idx" ON "pedido_detalles"("id_pedido");

-- CreateIndex
CREATE INDEX "pedido_detalles_id_producto_variante_idx" ON "pedido_detalles"("id_producto_variante");

-- CreateIndex
CREATE INDEX "pedido_detalles_id_cotizacion_idx" ON "pedido_detalles"("id_cotizacion");

-- CreateIndex
CREATE INDEX "pedidos_id_cliente_fecha_creacion_idx" ON "pedidos"("id_cliente", "fecha_creacion");

-- CreateIndex
CREATE INDEX "pedidos_estado_idx" ON "pedidos"("estado");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_numero_documento_key" ON "usuarios"("numero_documento");

-- CreateIndex
CREATE INDEX "usuarios_rol_estado_idx" ON "usuarios"("rol", "estado");

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuarios"("id_usuario") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "productos" ADD CONSTRAINT "productos_id_categoria_fkey" FOREIGN KEY ("id_categoria") REFERENCES "categorias"("id_categoria") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "producto_variantes" ADD CONSTRAINT "producto_variantes_id_producto_fkey" FOREIGN KEY ("id_producto") REFERENCES "productos"("id_producto") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "producto_imagenes" ADD CONSTRAINT "producto_imagenes_id_producto_fkey" FOREIGN KEY ("id_producto") REFERENCES "productos"("id_producto") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "descuentos_volumen" ADD CONSTRAINT "descuentos_volumen_id_producto_fkey" FOREIGN KEY ("id_producto") REFERENCES "productos"("id_producto") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disenos_predefinidos" ADD CONSTRAINT "disenos_predefinidos_creado_por_id_fkey" FOREIGN KEY ("creado_por_id") REFERENCES "usuarios"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cotizaciones" ADD CONSTRAINT "cotizaciones_id_cliente_fkey" FOREIGN KEY ("id_cliente") REFERENCES "usuarios"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cotizaciones" ADD CONSTRAINT "cotizaciones_atendido_por_id_fkey" FOREIGN KEY ("atendido_por_id") REFERENCES "usuarios"("id_usuario") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cotizaciones" ADD CONSTRAINT "cotizaciones_id_producto_variante_fkey" FOREIGN KEY ("id_producto_variante") REFERENCES "producto_variantes"("id_producto_variante") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "personalizaciones" ADD CONSTRAINT "personalizaciones_id_cotizacion_fkey" FOREIGN KEY ("id_cotizacion") REFERENCES "cotizaciones"("id_cotizacion") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "imagenes_personalizadas" ADD CONSTRAINT "imagenes_personalizadas_id_personalizacion_fkey" FOREIGN KEY ("id_personalizacion") REFERENCES "personalizaciones"("id_personalizacion") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "imagenes_personalizadas" ADD CONSTRAINT "imagenes_personalizadas_id_diseno_predefinido_fkey" FOREIGN KEY ("id_diseno_predefinido") REFERENCES "disenos_predefinidos"("id_diseno_predefinido") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "carritos" ADD CONSTRAINT "carritos_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuarios"("id_usuario") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items_carrito" ADD CONSTRAINT "items_carrito_id_carrito_fkey" FOREIGN KEY ("id_carrito") REFERENCES "carritos"("id_carrito") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items_carrito" ADD CONSTRAINT "items_carrito_id_producto_variante_fkey" FOREIGN KEY ("id_producto_variante") REFERENCES "producto_variantes"("id_producto_variante") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items_carrito" ADD CONSTRAINT "items_carrito_id_cotizacion_fkey" FOREIGN KEY ("id_cotizacion") REFERENCES "cotizaciones"("id_cotizacion") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedido_detalles" ADD CONSTRAINT "pedido_detalles_id_pedido_fkey" FOREIGN KEY ("id_pedido") REFERENCES "pedidos"("id_pedido") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedido_detalles" ADD CONSTRAINT "pedido_detalles_id_producto_variante_fkey" FOREIGN KEY ("id_producto_variante") REFERENCES "producto_variantes"("id_producto_variante") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedido_detalles" ADD CONSTRAINT "pedido_detalles_id_cotizacion_fkey" FOREIGN KEY ("id_cotizacion") REFERENCES "cotizaciones"("id_cotizacion") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagos" ADD CONSTRAINT "pagos_id_pedido_fkey" FOREIGN KEY ("id_pedido") REFERENCES "pedidos"("id_pedido") ON DELETE RESTRICT ON UPDATE CASCADE;
