/*
  Warnings:

  - Added the required column `updated_at` to the `categoria_insumo` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `insumo` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `movimiento_inventario` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `unidad_medida` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "categoria_insumo" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "insumo" ADD COLUMN     "activo" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "movimiento_inventario" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "unidad_medida" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- CreateIndex
CREATE INDEX "insumo_id_categoria_idx" ON "insumo"("id_categoria");

-- CreateIndex
CREATE INDEX "insumo_id_unidad_idx" ON "insumo"("id_unidad");
