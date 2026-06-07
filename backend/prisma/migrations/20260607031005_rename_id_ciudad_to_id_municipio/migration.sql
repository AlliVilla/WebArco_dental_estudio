-- Drop FK constraints
ALTER TABLE "persona" DROP CONSTRAINT IF EXISTS "persona_id_departamento_fkey";
ALTER TABLE "persona" DROP CONSTRAINT IF EXISTS "persona_id_ciudad_fkey";

-- Rename id_ciudad to id_municipio (preserves data)
ALTER TABLE "persona" RENAME COLUMN "id_ciudad" TO "id_municipio";

-- Drop id_departamento
ALTER TABLE "persona" DROP COLUMN "id_departamento";

-- Re-add FK constraint with new column name
ALTER TABLE "persona" ADD CONSTRAINT "persona_id_municipio_fkey" FOREIGN KEY ("id_municipio") REFERENCES "municipio"("id_municipio") ON DELETE RESTRICT ON UPDATE CASCADE;
