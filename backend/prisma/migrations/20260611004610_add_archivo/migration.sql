-- CreateTable
CREATE TABLE "Archivo" (
    "id_archivo" SERIAL NOT NULL,
    "id_consulta" INTEGER NOT NULL,
    "url" TEXT NOT NULL,

    CONSTRAINT "Archivo_pkey" PRIMARY KEY ("id_archivo")
);

-- AddForeignKey
ALTER TABLE "Archivo" ADD CONSTRAINT "Archivo_id_consulta_fkey" FOREIGN KEY ("id_consulta") REFERENCES "consulta"("id_consulta") ON DELETE RESTRICT ON UPDATE CASCADE;
