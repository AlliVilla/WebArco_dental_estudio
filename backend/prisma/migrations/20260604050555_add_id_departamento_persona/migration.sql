/*
  Warnings:

  - Added the required column `id_departamento` to the `persona` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "persona" ADD COLUMN     "id_departamento" INTEGER NOT NULL;

-- CreateIndex
CREATE INDEX "antecedente_respuesta_id_consulta_idx" ON "antecedente_respuesta"("id_consulta");

-- AddForeignKey
ALTER TABLE "persona" ADD CONSTRAINT "persona_id_departamento_fkey" FOREIGN KEY ("id_departamento") REFERENCES "departamento"("id_departamento") ON DELETE RESTRICT ON UPDATE CASCADE;
