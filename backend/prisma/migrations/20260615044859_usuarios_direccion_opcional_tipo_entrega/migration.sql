-- CreateEnum
CREATE TYPE "tipo_entrega" AS ENUM ('ENVIO', 'RECOJO_TIENDA');

-- AlterTable
ALTER TABLE "pedidos" ADD COLUMN     "tipo_entrega" "tipo_entrega" NOT NULL DEFAULT 'ENVIO';

-- AlterTable
ALTER TABLE "usuarios" ALTER COLUMN "direccion" DROP NOT NULL;
