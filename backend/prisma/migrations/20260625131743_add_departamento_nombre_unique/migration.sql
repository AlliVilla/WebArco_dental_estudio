-- Clean up duplicate departments before adding unique constraint
-- Keep the record with the smallest id_departamento for each nombre

-- Step 1: Update municipios that reference duplicate departments to point to the kept ID
UPDATE "municipio" m
SET id_departamento = keep.id_departamento
FROM (
  SELECT nombre, MIN(id_departamento) AS id_departamento
  FROM "departamento"
  GROUP BY nombre
) keep
WHERE m.id_departamento IN (
  SELECT d.id_departamento
  FROM "departamento" d
  WHERE d.id_departamento NOT IN (
    SELECT MIN(d2.id_departamento)
    FROM "departamento" d2
    WHERE d2.nombre = d.nombre
    GROUP BY d2.nombre
  )
);

-- Step 2: Delete duplicate departments (those not kept)
DELETE FROM "departamento" d
WHERE d.id_departamento NOT IN (
  SELECT MIN(d2.id_departamento)
  FROM "departamento" d2
  GROUP BY d2.nombre
);

-- Step 3: Add unique constraint
CREATE UNIQUE INDEX "departamento_nombre_key" ON "departamento"("nombre");
