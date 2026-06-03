-- AlterTable
ALTER TABLE "antecedente_pregunta" ADD COLUMN "requiere_explicacion" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "antecedente_respuesta" ADD COLUMN "respuesta_boolean" BOOLEAN;
