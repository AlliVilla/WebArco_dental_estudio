-- CreateEnum
CREATE TYPE "TratamientoEstado" AS ENUM ('ACTIVO', 'COMPLETADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "MetodoPago" AS ENUM ('EFECTIVO', 'TARJETA', 'TRANSFERENCIA');

-- AlterTable
ALTER TABLE "consulta" ADD COLUMN     "tratamientoPacienteId" INTEGER;

-- CreateTable
CREATE TABLE "tratamiento_paciente" (
    "id" SERIAL NOT NULL,
    "pacienteId" INTEGER NOT NULL,
    "nombre" VARCHAR(200) NOT NULL,
    "costoTotal" DECIMAL(10,2) NOT NULL,
    "estado" "TratamientoEstado" NOT NULL DEFAULT 'ACTIVO',
    "fechaInicio" DATE NOT NULL,
    "fechaFin" DATE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tratamiento_paciente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pago_consulta" (
    "id" SERIAL NOT NULL,
    "consultaId" INTEGER NOT NULL,
    "monto" DECIMAL(10,2) NOT NULL,
    "metodoPago" "MetodoPago" NOT NULL DEFAULT 'EFECTIVO',
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "observacion" TEXT,

    CONSTRAINT "pago_consulta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tratamiento_abono" (
    "id" SERIAL NOT NULL,
    "pagoConsultaId" INTEGER NOT NULL,
    "tratamientoPacienteId" INTEGER NOT NULL,
    "montoAbonado" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "tratamiento_abono_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "consulta" ADD CONSTRAINT "consulta_tratamientoPacienteId_fkey" FOREIGN KEY ("tratamientoPacienteId") REFERENCES "tratamiento_paciente"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tratamiento_paciente" ADD CONSTRAINT "tratamiento_paciente_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "persona"("id_persona") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pago_consulta" ADD CONSTRAINT "pago_consulta_consultaId_fkey" FOREIGN KEY ("consultaId") REFERENCES "consulta"("id_consulta") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tratamiento_abono" ADD CONSTRAINT "tratamiento_abono_pagoConsultaId_fkey" FOREIGN KEY ("pagoConsultaId") REFERENCES "pago_consulta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tratamiento_abono" ADD CONSTRAINT "tratamiento_abono_tratamientoPacienteId_fkey" FOREIGN KEY ("tratamientoPacienteId") REFERENCES "tratamiento_paciente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
