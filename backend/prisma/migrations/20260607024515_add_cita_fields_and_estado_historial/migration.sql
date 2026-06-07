-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "EstadoConsulta" ADD VALUE 'programada';
ALTER TYPE "EstadoConsulta" ADD VALUE 'confirmada';
ALTER TYPE "EstadoConsulta" ADD VALUE 'atendida';
ALTER TYPE "EstadoConsulta" ADD VALUE 'ausente';
ALTER TYPE "EstadoConsulta" ADD VALUE 'reprogramada';

-- AlterTable
ALTER TABLE "consulta" ADD COLUMN     "motivo" TEXT,
ADD COLUMN     "notas" TEXT,
ADD COLUMN     "tipo_cita" VARCHAR(100),
ALTER COLUMN "estado" SET DEFAULT 'programada';

-- CreateTable
CREATE TABLE "estado_historial" (
    "id_historial" SERIAL NOT NULL,
    "id_consulta" INTEGER NOT NULL,
    "estado_anterior" "EstadoConsulta",
    "estado_nuevo" "EstadoConsulta" NOT NULL,
    "cambiado_por" INTEGER NOT NULL,
    "fecha_cambio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "estado_historial_pkey" PRIMARY KEY ("id_historial")
);

-- CreateIndex
CREATE INDEX "estado_historial_id_consulta_idx" ON "estado_historial"("id_consulta");

-- AddForeignKey
ALTER TABLE "estado_historial" ADD CONSTRAINT "estado_historial_id_consulta_fkey" FOREIGN KEY ("id_consulta") REFERENCES "consulta"("id_consulta") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estado_historial" ADD CONSTRAINT "estado_historial_cambiado_por_fkey" FOREIGN KEY ("cambiado_por") REFERENCES "usuario"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;
