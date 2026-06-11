/*
  Warnings:

  - Added the required column `nombre` to the `Archivo` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Archivo" ADD COLUMN     "nombre" VARCHAR(255) NOT NULL;
