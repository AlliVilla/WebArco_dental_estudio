CREATE TABLE "egreso" (
    "id_egreso" SERIAL NOT NULL,
    "concepto" VARCHAR(255) NOT NULL,
    "monto" DECIMAL(10,2) NOT NULL,
    "categoria" VARCHAR(50) NOT NULL,
    "fecha" DATE NOT NULL,

    "observaciones" VARCHAR(255),

    "id_usuario_creacion" INTEGER NOT NULL,
    "id_usuario_modificacion" INTEGER,

    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "egreso_pkey" PRIMARY KEY ("id_egreso")
);

CREATE INDEX "egreso_fecha_idx" ON "egreso"("fecha");
CREATE INDEX "egreso_categoria_idx" ON "egreso"("categoria");
CREATE INDEX "egreso_id_usuario_creacion_idx" ON "egreso"("id_usuario_creacion");
CREATE INDEX "egreso_id_usuario_modificacion_idx" ON "egreso"("id_usuario_modificacion");

ALTER TABLE "egreso"
ADD CONSTRAINT "egreso_id_usuario_creacion_fkey"
FOREIGN KEY ("id_usuario_creacion") REFERENCES "usuario"("id_usuario")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "egreso"
ADD CONSTRAINT "egreso_id_usuario_modificacion_fkey"
FOREIGN KEY ("id_usuario_modificacion") REFERENCES "usuario"("id_usuario")
ON DELETE SET NULL ON UPDATE CASCADE;