-- CreateEstadoCita enum
CREATE TYPE "EstadoCita" AS ENUM ('programada', 'confirmada', 'cancelada', 'no_asistio', 'atendida', 'ausente', 'reprogramada');

-- Drop FK on estado_historial pointing to consulta
ALTER TABLE "estado_historial" DROP CONSTRAINT IF EXISTS "estado_historial_id_consulta_fkey";

-- Create cita table
CREATE TABLE "cita" (
    "id_cita" SERIAL NOT NULL,
    "id_persona" INTEGER NOT NULL,
    "id_usuario" INTEGER NOT NULL,
    "fecha_inicio" TIMESTAMP NOT NULL,
    "fecha_fin" TIMESTAMP,
    "tipo_cita" VARCHAR(100),
    "motivo" TEXT,
    "estado" "EstadoCita" NOT NULL DEFAULT 'programada',
    "recordatorio_enviado" BOOLEAN NOT NULL DEFAULT false,
    "notas" TEXT,
    CONSTRAINT "cita_pkey" PRIMARY KEY ("id_cita")
);

-- Migrate data from consulta to cita (map old estado values)
INSERT INTO "cita" (id_persona, id_usuario, fecha_inicio, fecha_fin, tipo_cita, motivo, estado, recordatorio_enviado, notas)
SELECT
    id_persona, id_usuario, fecha_inicio, fecha_fin, tipo_cita, motivo,
    CASE estado::text
        WHEN 'programada' THEN 'programada'::"EstadoCita"
        WHEN 'confirmada' THEN 'confirmada'::"EstadoCita"
        WHEN 'cancelada' THEN 'cancelada'::"EstadoCita"
        WHEN 'no_asistio' THEN 'no_asistio'::"EstadoCita"
        WHEN 'atendida' THEN 'atendida'::"EstadoCita"
        WHEN 'ausente' THEN 'ausente'::"EstadoCita"
        WHEN 'reprogramada' THEN 'reprogramada'::"EstadoCita"
        WHEN 'agendada' THEN 'programada'::"EstadoCita"
        WHEN 'completada' THEN 'atendida'::"EstadoCita"
        ELSE 'programada'::"EstadoCita"
    END,
    recordatorio_enviado, notas
FROM "consulta"
ORDER BY id_consulta;

-- Add id_cita to consulta and link to cita
ALTER TABLE "consulta" ADD COLUMN "id_cita" INTEGER;

WITH numbered_consulta AS (
    SELECT id_consulta, ROW_NUMBER() OVER (ORDER BY id_consulta) AS rn FROM "consulta"
),
numbered_cita AS (
    SELECT id_cita, ROW_NUMBER() OVER (ORDER BY id_cita) AS rn FROM "cita"
)
UPDATE "consulta" c
SET id_cita = nc2.id_cita
FROM numbered_consulta nc1
JOIN numbered_cita nc2 ON nc1.rn = nc2.rn
WHERE c.id_consulta = nc1.id_consulta;

ALTER TABLE "consulta" ADD CONSTRAINT "consulta_id_cita_key" UNIQUE ("id_cita");
ALTER TABLE "consulta" ADD CONSTRAINT "consulta_id_cita_fkey" FOREIGN KEY ("id_cita") REFERENCES "cita"("id_cita") ON DELETE SET NULL ON UPDATE CASCADE;

-- Drop old columns from consulta
ALTER TABLE "consulta" DROP COLUMN "tipo_cita";
ALTER TABLE "consulta" DROP COLUMN "recordatorio_enviado";
ALTER TABLE "consulta" DROP COLUMN "estado";

-- Update estado_historial: convert estado columns to EstadoCita
ALTER TABLE "estado_historial" ALTER COLUMN "estado_anterior" TYPE "EstadoCita" USING estado_anterior::text::"EstadoCita";
ALTER TABLE "estado_historial" ALTER COLUMN "estado_nuevo" TYPE "EstadoCita" USING estado_nuevo::text::"EstadoCita";
ALTER TABLE "estado_historial" ALTER COLUMN "estado_nuevo" SET NOT NULL;

-- Rename id_consulta to id_cita in estado_historial
ALTER TABLE "estado_historial" RENAME COLUMN "id_consulta" TO "id_cita";

-- Drop old index and create new
DROP INDEX IF EXISTS "estado_historial_id_consulta_idx";
CREATE INDEX "estado_historial_id_cita_idx" ON "estado_historial"("id_cita");

-- Add FK from estado_historial to cita
ALTER TABLE "estado_historial" ADD CONSTRAINT "estado_historial_id_cita_fkey" FOREIGN KEY ("id_cita") REFERENCES "cita"("id_cita") ON DELETE CASCADE ON UPDATE CASCADE;

-- Drop old EstadoConsulta type
DROP TYPE IF EXISTS "EstadoConsulta";

-- Add FK for cita.persona and cita.usuario
ALTER TABLE "cita" ADD CONSTRAINT "cita_id_persona_fkey" FOREIGN KEY ("id_persona") REFERENCES "persona"("id_persona") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "cita" ADD CONSTRAINT "cita_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuario"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Add unique constraint to odontograma (remove duplicates first)
DELETE FROM "odontograma" o1 USING "odontograma" o2
WHERE o1.id_odontograma < o2.id_odontograma
AND o1.id_consulta = o2.id_consulta
AND o1.id_diente = o2.id_diente;
ALTER TABLE "odontograma" ADD CONSTRAINT "odontograma_id_consulta_id_diente_key" UNIQUE ("id_consulta", "id_diente");

-- Remove saldo from pago_paciente
ALTER TABLE "pago_paciente" DROP COLUMN IF EXISTS "saldo";
