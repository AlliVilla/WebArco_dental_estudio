-- DropForeignKey
ALTER TABLE "tratamiento" DROP CONSTRAINT "tratamiento_id_especialidad_fkey";

-- AlterTable
ALTER TABLE "especialidad" ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "tratamiento" ADD COLUMN     "activo" BOOLEAN NOT NULL DEFAULT true;

-- AddForeignKey
ALTER TABLE "tratamiento" ADD CONSTRAINT "tratamiento_id_especialidad_fkey" FOREIGN KEY ("id_especialidad") REFERENCES "especialidad"("id_especialidad") ON DELETE RESTRICT ON UPDATE CASCADE;
