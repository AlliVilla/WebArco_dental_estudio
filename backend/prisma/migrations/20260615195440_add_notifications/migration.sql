-- CreateEnum
CREATE TYPE "TipoNotificacion" AS ENUM ('cita_proxima', 'cita_confirmada', 'cita_cancelada');

-- CreateTable
CREATE TABLE "notificacion" (
    "id" SERIAL NOT NULL,
    "id_usuario" INTEGER NOT NULL,
    "tipo" "TipoNotificacion" NOT NULL,
    "titulo" VARCHAR(200) NOT NULL,
    "mensaje" TEXT NOT NULL,
    "id_cita" INTEGER,
    "leida" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notificacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "configuracion_notificaciones" (
    "id_usuario" INTEGER NOT NULL,
    "minutos_anticipacion" INTEGER NOT NULL DEFAULT 60,
    "email_notificaciones" BOOLEAN NOT NULL DEFAULT true,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "configuracion_notificaciones_pkey" PRIMARY KEY ("id_usuario")
);

-- CreateIndex
CREATE INDEX "notificacion_id_usuario_leida_idx" ON "notificacion"("id_usuario", "leida");

-- CreateIndex
CREATE INDEX "notificacion_created_at_idx" ON "notificacion"("created_at");

-- AddForeignKey
ALTER TABLE "notificacion" ADD CONSTRAINT "notificacion_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuario"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificacion" ADD CONSTRAINT "notificacion_id_cita_fkey" FOREIGN KEY ("id_cita") REFERENCES "cita"("id_cita") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "configuracion_notificaciones" ADD CONSTRAINT "configuracion_notificaciones_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuario"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;
