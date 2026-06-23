CREATE TABLE "tokens_recuperacion_contrasena" (
    "id_token" SERIAL NOT NULL,
    "id_usuario" INTEGER NOT NULL,
    "token_hash" TEXT NOT NULL,
    "fecha_expiracion" TIMESTAMP(3) NOT NULL,
    "fecha_uso" TIMESTAMP(3),
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tokens_recuperacion_contrasena_pkey" PRIMARY KEY ("id_token")
);

CREATE UNIQUE INDEX "tokens_recuperacion_contrasena_token_hash_key"
ON "tokens_recuperacion_contrasena"("token_hash");

CREATE INDEX "tokens_recuperacion_contrasena_id_usuario_fecha_expiracion_idx"
ON "tokens_recuperacion_contrasena"("id_usuario", "fecha_expiracion");

ALTER TABLE "tokens_recuperacion_contrasena"
ADD CONSTRAINT "tokens_recuperacion_contrasena_id_usuario_fkey"
FOREIGN KEY ("id_usuario") REFERENCES "usuarios"("id_usuario")
ON DELETE CASCADE ON UPDATE CASCADE;
