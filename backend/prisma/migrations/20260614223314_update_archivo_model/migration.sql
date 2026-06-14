/*
  Warnings:

  - Added the required column `updated_at` to the `Archivo` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "TipoArchivo" ADD VALUE 'Antes';
ALTER TYPE "TipoArchivo" ADD VALUE 'Despues';
ALTER TYPE "TipoArchivo" ADD VALUE 'Comparativa';

-- AlterTable
ALTER TABLE "Archivo" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;
