-- CreateEnum
CREATE TYPE "TipoMovimiento" AS ENUM ('Entrada', 'Salida');

-- CreateTable
CREATE TABLE "categoria_insumo" (
    "id_categoria" SERIAL NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categoria_insumo_pkey" PRIMARY KEY ("id_categoria")
);

-- CreateTable
CREATE TABLE "unidad_medida" (
    "id_unidad" SERIAL NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "unidad_medida_pkey" PRIMARY KEY ("id_unidad")
);

-- CreateTable
CREATE TABLE "insumo" (
    "id_insumo" SERIAL NOT NULL,
    "codigo" VARCHAR(50) NOT NULL,
    "nombre" VARCHAR(255) NOT NULL,
    "id_categoria" INTEGER NOT NULL,
    "id_unidad" INTEGER NOT NULL,
    "stock_actual" INTEGER NOT NULL DEFAULT 0,
    "stock_minimo" INTEGER NOT NULL DEFAULT 0,
    "precio_costo" DECIMAL(10,2) NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "insumo_pkey" PRIMARY KEY ("id_insumo")
);

-- CreateTable
CREATE TABLE "movimiento_inventario" (
    "id_movimiento" SERIAL NOT NULL,
    "id_insumo" INTEGER NOT NULL,
    "tipo" "TipoMovimiento" NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "fecha" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id_usuario" INTEGER NOT NULL,
    "observaciones" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "movimiento_inventario_pkey" PRIMARY KEY ("id_movimiento")
);

-- CreateIndex
CREATE UNIQUE INDEX "categoria_insumo_nombre_key" ON "categoria_insumo"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "unidad_medida_nombre_key" ON "unidad_medida"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "insumo_codigo_key" ON "insumo"("codigo");

-- CreateIndex
CREATE INDEX "insumo_id_categoria_idx" ON "insumo"("id_categoria");

-- CreateIndex
CREATE INDEX "insumo_id_unidad_idx" ON "insumo"("id_unidad");

-- CreateIndex
CREATE INDEX "insumo_activo_idx" ON "insumo"("activo");

-- CreateIndex
CREATE INDEX "movimiento_inventario_id_insumo_idx" ON "movimiento_inventario"("id_insumo");

-- CreateIndex
CREATE INDEX "movimiento_inventario_id_usuario_idx" ON "movimiento_inventario"("id_usuario");

-- CreateIndex
CREATE INDEX "movimiento_inventario_fecha_idx" ON "movimiento_inventario"("fecha");

-- AddForeignKey
ALTER TABLE "insumo" ADD CONSTRAINT "insumo_id_categoria_fkey" FOREIGN KEY ("id_categoria") REFERENCES "categoria_insumo"("id_categoria") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "insumo" ADD CONSTRAINT "insumo_id_unidad_fkey" FOREIGN KEY ("id_unidad") REFERENCES "unidad_medida"("id_unidad") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimiento_inventario" ADD CONSTRAINT "movimiento_inventario_id_insumo_fkey" FOREIGN KEY ("id_insumo") REFERENCES "insumo"("id_insumo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimiento_inventario" ADD CONSTRAINT "movimiento_inventario_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuario"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;
