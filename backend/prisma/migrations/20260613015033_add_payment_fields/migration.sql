-- AlterTable
ALTER TABLE "pago_paciente" ADD COLUMN     "estado" VARCHAR(20) NOT NULL DEFAULT 'Pagado',
ADD COLUMN     "metodo_pago" VARCHAR(50) NOT NULL DEFAULT 'Efectivo';
