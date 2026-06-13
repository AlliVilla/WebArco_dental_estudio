-- Create Especialidad table
CREATE TABLE "especialidad" (
    "id_especialidad" SERIAL NOT NULL,
    "nombre" VARCHAR(120) NOT NULL,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL,
    CONSTRAINT "especialidad_pkey" PRIMARY KEY ("id_especialidad")
);

CREATE UNIQUE INDEX "especialidad_nombre_key" ON "especialidad"("nombre");

-- Insert seed especialidades (matching existing tratamiento.especialidad values)
INSERT INTO "especialidad" (nombre, updated_at) VALUES
    ('Odontología General', NOW()),
    ('Odontología General y Preventiva', NOW()),
    ('Odontología Especializada', NOW()),
    ('Odontología Estética', NOW()),
    ('Ortodoncia', NOW()),
    ('Ortodoncia y Ortopedia Maxilar', NOW()),
    ('Cirugía Bucal e Implantología', NOW()),
    ('Prótesis', NOW()),
    ('Prótesis y Rehabilitación Oral', NOW()),
    ('Endodoncia', NOW()),
    ('Periodoncia', NOW()),
    ('Cirugía Oral', NOW());

-- Add nullable FK column
ALTER TABLE "tratamiento" ADD COLUMN "id_especialidad" INTEGER;

-- Migrate existing rows by matching string names
UPDATE "tratamiento" SET "id_especialidad" = (
    SELECT e.id_especialidad FROM "especialidad" e
    WHERE e.nombre = "tratamiento"."especialidad"
);

-- Safety fallback for any unmapped rows
UPDATE "tratamiento" SET "id_especialidad" = 1 WHERE "id_especialidad" IS NULL;

-- Make column required
ALTER TABLE "tratamiento" ALTER COLUMN "id_especialidad" SET NOT NULL;

-- Drop old string column
ALTER TABLE "tratamiento" DROP COLUMN "especialidad";

-- Add FK constraint
ALTER TABLE "tratamiento" ADD CONSTRAINT "tratamiento_id_especialidad_fkey"
    FOREIGN KEY ("id_especialidad") REFERENCES "especialidad"("id_especialidad");
