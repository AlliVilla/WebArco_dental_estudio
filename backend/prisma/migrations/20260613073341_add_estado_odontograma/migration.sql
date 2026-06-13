-- CreateTable
CREATE TABLE "estado_odontograma" (
    "id_estado" SERIAL NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "color" VARCHAR(20) NOT NULL,

    CONSTRAINT "estado_odontograma_pkey" PRIMARY KEY ("id_estado")
);

-- CreateIndex
CREATE UNIQUE INDEX "estado_odontograma_nombre_key" ON "estado_odontograma"("nombre");
