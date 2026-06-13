/*
  Warnings:

  - You are about to drop the `antecedente_pregunta` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `antecedente_respuesta` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "antecedente_respuesta" DROP CONSTRAINT "antecedente_respuesta_id_consulta_fkey";

-- DropForeignKey
ALTER TABLE "antecedente_respuesta" DROP CONSTRAINT "antecedente_respuesta_id_pregunta_fkey";

-- DropTable
DROP TABLE "antecedente_pregunta";

-- DropTable
DROP TABLE "antecedente_respuesta";

-- CreateTable
CREATE TABLE "consulta_pregunta" (
    "id_pregunta" SERIAL NOT NULL,
    "pregunta" VARCHAR(255) NOT NULL,
    "orden_num" INTEGER NOT NULL,
    "requiere_explicacion" BOOLEAN NOT NULL DEFAULT false,
    "categoria" VARCHAR(100) NOT NULL DEFAULT 'Antecedentes Médicos',

    CONSTRAINT "consulta_pregunta_pkey" PRIMARY KEY ("id_pregunta")
);

-- CreateTable
CREATE TABLE "consulta_respuesta" (
    "id_respuesta" SERIAL NOT NULL,
    "id_consulta" INTEGER NOT NULL,
    "id_pregunta" INTEGER NOT NULL,
    "respuesta_boolean" BOOLEAN,
    "explanation" TEXT,

    CONSTRAINT "consulta_respuesta_pkey" PRIMARY KEY ("id_respuesta")
);

-- CreateIndex
CREATE INDEX "consulta_respuesta_id_consulta_idx" ON "consulta_respuesta"("id_consulta");

-- AddForeignKey
ALTER TABLE "consulta_respuesta" ADD CONSTRAINT "consulta_respuesta_id_consulta_fkey" FOREIGN KEY ("id_consulta") REFERENCES "consulta"("id_consulta") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consulta_respuesta" ADD CONSTRAINT "consulta_respuesta_id_pregunta_fkey" FOREIGN KEY ("id_pregunta") REFERENCES "consulta_pregunta"("id_pregunta") ON DELETE RESTRICT ON UPDATE CASCADE;
