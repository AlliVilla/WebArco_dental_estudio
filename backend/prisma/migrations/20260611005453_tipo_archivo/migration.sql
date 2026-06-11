/*
  Warnings:

  - Added the required column `categoria` to the `Archivo` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "TipoArchivo" AS ENUM ('Tomografia', 'Radiografia', 'Imagen');

-- AlterTable
ALTER TABLE "Archivo" ADD COLUMN     "categoria" "TipoArchivo" NOT NULL;
