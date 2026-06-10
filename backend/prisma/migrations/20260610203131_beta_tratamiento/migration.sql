/*
  Warnings:

  - You are about to drop the `categoria_insumo` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `insumo` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `movimiento_inventario` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `unidad_medida` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "insumo" DROP CONSTRAINT "insumo_id_categoria_fkey";

-- DropForeignKey
ALTER TABLE "insumo" DROP CONSTRAINT "insumo_id_unidad_fkey";

-- DropForeignKey
ALTER TABLE "movimiento_inventario" DROP CONSTRAINT "movimiento_inventario_id_insumo_fkey";

-- DropForeignKey
ALTER TABLE "movimiento_inventario" DROP CONSTRAINT "movimiento_inventario_id_usuario_fkey";

-- DropTable
DROP TABLE "categoria_insumo";

-- DropTable
DROP TABLE "insumo";

-- DropTable
DROP TABLE "movimiento_inventario";

-- DropTable
DROP TABLE "unidad_medida";

-- DropEnum
DROP TYPE "TipoMovimiento";

-- CreateTable
CREATE TABLE "tratamiento" (
    "id_tratamiento" SERIAL NOT NULL,
    "especialidad" VARCHAR(120) NOT NULL,
    "nombre" VARCHAR(150) NOT NULL,
    "descripcion" TEXT,
    "impacto_odontograma" VARCHAR(60) NOT NULL,
    "precio" DECIMAL(10,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tratamiento_pkey" PRIMARY KEY ("id_tratamiento")
);

-- CreateTable
CREATE TABLE "consulta_tratamiento" (
    "id_consulta_tratamiento" SERIAL NOT NULL,
    "id_tratamiento" INTEGER NOT NULL,
    "id_consulta" INTEGER NOT NULL,
    "descuento" INTEGER NOT NULL,
    "precio" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "consulta_tratamiento_pkey" PRIMARY KEY ("id_consulta_tratamiento")
);

-- AddForeignKey
ALTER TABLE "consulta_tratamiento" ADD CONSTRAINT "consulta_tratamiento_id_consulta_fkey" FOREIGN KEY ("id_consulta") REFERENCES "consulta"("id_consulta") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consulta_tratamiento" ADD CONSTRAINT "consulta_tratamiento_id_tratamiento_fkey" FOREIGN KEY ("id_tratamiento") REFERENCES "tratamiento"("id_tratamiento") ON DELETE RESTRICT ON UPDATE CASCADE;
