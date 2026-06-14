-- AlterEnum
ALTER TYPE "TratamientoEstado" ADD VALUE 'DESACTIVADO';

-- AlterTable
ALTER TABLE "odontograma" ADD COLUMN     "estado_anterior" VARCHAR(100),
ADD COLUMN     "observacion_anterior" TEXT;
