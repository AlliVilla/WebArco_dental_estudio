/*
  Warnings:

  - You are about to drop the column `saldo` on the `cierre` table. All the data in the column will be lost.
  - Added the required column `tipo_cierre` to the `cierre` table without a default value. This is not possible if the table is not empty.
  - Added the required column `utilidad` to the `cierre` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "TipoCierre" AS ENUM ('Diario', 'Semanal', 'Quincenal', 'Mensual');

-- CreateEnum
CREATE TYPE "MetodoPago" AS ENUM ('Efectivo', 'Tarjeta', 'Transferencia');

-- AlterTable
ALTER TABLE "cierre" DROP COLUMN "saldo",
ADD COLUMN     "efectivo" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
ADD COLUMN     "tarjeta" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
ADD COLUMN     "tipo_cierre" "TipoCierre" NOT NULL,
ADD COLUMN     "transferencia" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
ADD COLUMN     "utilidad" DECIMAL(10,2) NOT NULL;

-- AlterTable
ALTER TABLE "pago_paciente" ADD COLUMN     "metodo_pago" "MetodoPago" NOT NULL DEFAULT 'Efectivo';
