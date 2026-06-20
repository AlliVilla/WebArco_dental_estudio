-- CreateTable
CREATE TABLE "cuenta_destino_config" (
    "id" SERIAL NOT NULL,
    "tipo" VARCHAR(20) NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "cuenta_destino_config_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "cuenta_destino_config_tipo_nombre_key" ON "cuenta_destino_config"("tipo", "nombre");
