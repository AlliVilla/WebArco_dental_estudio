-- CreateEnum
CREATE TYPE "CanalRecordatorio" AS ENUM ('WhatsApp', 'SMS', 'Correo');

-- CreateEnum
CREATE TYPE "EstadoRespuesta" AS ENUM ('pendiente', 'confirmado', 'cancelado', 'sin_respuesta');

-- CreateTable
CREATE TABLE "recordatorio" (
    "id" SERIAL NOT NULL,
    "id_cita" INTEGER NOT NULL,
    "canal" "CanalRecordatorio" NOT NULL,
    "estado_respuesta" "EstadoRespuesta" NOT NULL DEFAULT 'pendiente',
    "fecha_envio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_respuesta" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recordatorio_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "recordatorio_id_cita_idx" ON "recordatorio"("id_cita");

-- AddForeignKey
ALTER TABLE "recordatorio" ADD CONSTRAINT "recordatorio_id_cita_fkey" FOREIGN KEY ("id_cita") REFERENCES "cita"("id_cita") ON DELETE RESTRICT ON UPDATE CASCADE;
