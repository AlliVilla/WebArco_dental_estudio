-- CreateTable
CREATE TABLE "egreso" (
    "id_egreso" SERIAL NOT NULL,
    "concepto" VARCHAR(255) NOT NULL,
    "monto" DECIMAL(10,2) NOT NULL,
    "fecha" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "categoria" VARCHAR(100) NOT NULL,
    "id_usuario" INTEGER NOT NULL,

    CONSTRAINT "egreso_pkey" PRIMARY KEY ("id_egreso")
);

-- CreateTable
CREATE TABLE "cierre" (
    "id_cierre" SERIAL NOT NULL,
    "fecha" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ingresos" DECIMAL(10,2) NOT NULL,
    "egresos" DECIMAL(10,2) NOT NULL,
    "saldo" DECIMAL(10,2) NOT NULL,
    "id_usuario" INTEGER NOT NULL,

    CONSTRAINT "cierre_pkey" PRIMARY KEY ("id_cierre")
);

-- AddForeignKey
ALTER TABLE "egreso" ADD CONSTRAINT "egreso_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuario"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cierre" ADD CONSTRAINT "cierre_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuario"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;
