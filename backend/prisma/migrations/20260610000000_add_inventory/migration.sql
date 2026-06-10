CREATE TYPE "CategoriaInsumo" AS ENUM ('Anestesia', 'Higiene', 'Materiales', 'Instrumental', 'Medicamento', 'Otro');
CREATE TYPE "UnidadMedidaInsumo" AS ENUM ('Unidad', 'Caja', 'Frasco', 'Paquete', 'Kit', 'Tubo', 'Bolsa');
CREATE TYPE "TipoMovimientoInventario" AS ENUM ('Entrada', 'Salida');

CREATE TABLE "insumo_inventario" (
  "id_insumo" SERIAL NOT NULL,
  "codigo" VARCHAR(20) NOT NULL,
  "nombre" VARCHAR(150) NOT NULL,
  "categoria" "CategoriaInsumo" NOT NULL,
  "unidad_medida" "UnidadMedidaInsumo" NOT NULL,
  "stock_actual" INTEGER NOT NULL DEFAULT 0,
  "stock_minimo" INTEGER NOT NULL DEFAULT 0,
  "precio_costo" DECIMAL(10,2) NOT NULL,
  "activo" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "insumo_inventario_pkey" PRIMARY KEY ("id_insumo")
);

CREATE TABLE "movimiento_inventario" (
  "id_movimiento" SERIAL NOT NULL,
  "id_insumo" INTEGER NOT NULL,
  "tipo" "TipoMovimientoInventario" NOT NULL,
  "cantidad" INTEGER NOT NULL,
  "fecha" DATE NOT NULL,
  "responsable" VARCHAR(120) NOT NULL,
  "observaciones" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "movimiento_inventario_pkey" PRIMARY KEY ("id_movimiento")
);

CREATE UNIQUE INDEX "insumo_inventario_codigo_key" ON "insumo_inventario"("codigo");
CREATE INDEX "insumo_inventario_categoria_idx" ON "insumo_inventario"("categoria");
CREATE INDEX "insumo_inventario_activo_idx" ON "insumo_inventario"("activo");
CREATE INDEX "movimiento_inventario_id_insumo_idx" ON "movimiento_inventario"("id_insumo");
CREATE INDEX "movimiento_inventario_fecha_idx" ON "movimiento_inventario"("fecha");

ALTER TABLE "movimiento_inventario" ADD CONSTRAINT "movimiento_inventario_id_insumo_fkey" FOREIGN KEY ("id_insumo") REFERENCES "insumo_inventario"("id_insumo") ON DELETE RESTRICT ON UPDATE CASCADE;

INSERT INTO "insumo_inventario" ("codigo", "nombre", "categoria", "unidad_medida", "stock_actual", "stock_minimo", "precio_costo", "updated_at") VALUES
('INS-001', 'Anestesia Lidocaína 2%', 'Anestesia', 'Frasco', 3, 5, 120.00, CURRENT_TIMESTAMP),
('INS-002', 'Guantes de látex M', 'Higiene', 'Caja', 0, 2, 85.00, CURRENT_TIMESTAMP),
('INS-003', 'Composite A2', 'Materiales', 'Unidad', 14, 3, 340.00, CURRENT_TIMESTAMP),
('INS-004', 'Mascarillas N95', 'Higiene', 'Caja', 6, 5, 95.00, CURRENT_TIMESTAMP),
('INS-005', 'Sonda Explorer 5/23', 'Instrumental', 'Unidad', 4, 8, 220.00, CURRENT_TIMESTAMP),
('INS-006', 'Cemento de ionómero', 'Materiales', 'Frasco', 0, 2, 185.00, CURRENT_TIMESTAMP),
('INS-007', 'Eyectores desechables', 'Higiene', 'Caja', 2, 4, 32.00, CURRENT_TIMESTAMP),
('INS-008', 'Hoja de bisturí #15', 'Instrumental', 'Caja', 8, 3, 67.00, CURRENT_TIMESTAMP);

INSERT INTO "movimiento_inventario" ("id_insumo", "tipo", "cantidad", "fecha", "responsable", "observaciones") VALUES
((SELECT "id_insumo" FROM "insumo_inventario" WHERE "codigo" = 'INS-003'), 'Entrada', 10, '2026-06-01', 'Dr. Karla Arita', 'Compra inicial'),
((SELECT "id_insumo" FROM "insumo_inventario" WHERE "codigo" = 'INS-001'), 'Salida', 2, '2026-06-03', 'Dr. Karla Arita', 'Uso en procedimiento'),
((SELECT "id_insumo" FROM "insumo_inventario" WHERE "codigo" = 'INS-004'), 'Entrada', 5, '2026-06-05', 'Recepción', 'Reposición de insumos');
