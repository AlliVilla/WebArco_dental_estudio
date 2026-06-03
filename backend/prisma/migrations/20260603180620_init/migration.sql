-- CreateEnum
CREATE TYPE "EstadoConsulta" AS ENUM ('agendada', 'completada', 'cancelada', 'no_asistio');

-- CreateTable
CREATE TABLE "rol" (
    "id_rol" SERIAL NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,

    CONSTRAINT "rol_pkey" PRIMARY KEY ("id_rol")
);

-- CreateTable
CREATE TABLE "privilegio" (
    "id_privilegio" SERIAL NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,

    CONSTRAINT "privilegio_pkey" PRIMARY KEY ("id_privilegio")
);

-- CreateTable
CREATE TABLE "rol_privilegio" (
    "id_rol" INTEGER NOT NULL,
    "id_privilegio" INTEGER NOT NULL,

    CONSTRAINT "rol_privilegio_pkey" PRIMARY KEY ("id_rol","id_privilegio")
);

-- CreateTable
CREATE TABLE "departamento" (
    "id_departamento" INTEGER NOT NULL,
    "nombre" VARCHAR(255) NOT NULL,

    CONSTRAINT "departamento_pkey" PRIMARY KEY ("id_departamento")
);

-- CreateTable
CREATE TABLE "municipio" (
    "id_municipio" INTEGER NOT NULL,
    "nombre" VARCHAR(255) NOT NULL,

    CONSTRAINT "municipio_pkey" PRIMARY KEY ("id_municipio")
);

-- CreateTable
CREATE TABLE "persona" (
    "id_persona" SERIAL NOT NULL,
    "numero_identidad" CHAR(13) NOT NULL,
    "primer_nombre" VARCHAR(50) NOT NULL,
    "segundo_nombre" VARCHAR(50),
    "primer_apellido" VARCHAR(50) NOT NULL,
    "segundo_apellido" VARCHAR(50),
    "fecha_nacimiento" DATE NOT NULL,
    "telefono" VARCHAR(20) NOT NULL,
    "correo_electronico" VARCHAR(255),
    "id_departamento" INTEGER NOT NULL,
    "id_ciudad" INTEGER NOT NULL,
    "direccion_linea" TEXT,

    CONSTRAINT "persona_pkey" PRIMARY KEY ("id_persona")
);

-- CreateTable
CREATE TABLE "usuario" (
    "id_usuario" SERIAL NOT NULL,
    "id_persona" INTEGER NOT NULL,
    "username" VARCHAR(100) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "id_rol" INTEGER NOT NULL,
    "firma" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "usuario_pkey" PRIMARY KEY ("id_usuario")
);

-- CreateTable
CREATE TABLE "antecedente_pregunta" (
    "id_pregunta" SERIAL NOT NULL,
    "pregunta" VARCHAR(255) NOT NULL,
    "orden_num" INTEGER NOT NULL,

    CONSTRAINT "antecedente_pregunta_pkey" PRIMARY KEY ("id_pregunta")
);

-- CreateTable
CREATE TABLE "antecedente_respuesta" (
    "id_respuesta" SERIAL NOT NULL,
    "id_consulta" INTEGER NOT NULL,
    "id_pregunta" INTEGER NOT NULL,
    "explanation" TEXT,

    CONSTRAINT "antecedente_respuesta_pkey" PRIMARY KEY ("id_respuesta")
);

-- CreateTable
CREATE TABLE "consulta" (
    "id_consulta" SERIAL NOT NULL,
    "id_persona" INTEGER NOT NULL,
    "id_usuario" INTEGER NOT NULL,
    "fecha_inicio" TIMESTAMP NOT NULL,
    "fecha_fin" TIMESTAMP,
    "diagnostico" TEXT,
    "tratamiento" TEXT,
    "firma_paciente" TEXT,
    "consentimiento" BOOLEAN NOT NULL DEFAULT false,
    "estado" "EstadoConsulta" NOT NULL DEFAULT 'agendada',
    "recordatorio_enviado" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "consulta_pkey" PRIMARY KEY ("id_consulta")
);

-- CreateTable
CREATE TABLE "diente" (
    "numero_diente" INTEGER NOT NULL,
    "nombre" VARCHAR(50),

    CONSTRAINT "diente_pkey" PRIMARY KEY ("numero_diente")
);

-- CreateTable
CREATE TABLE "odontograma" (
    "id_odontograma" SERIAL NOT NULL,
    "id_consulta" INTEGER NOT NULL,
    "id_diente" INTEGER NOT NULL,
    "estado" VARCHAR(100),
    "observacion" TEXT,

    CONSTRAINT "odontograma_pkey" PRIMARY KEY ("id_odontograma")
);

-- CreateTable
CREATE TABLE "pago_paciente" (
    "id_pago" SERIAL NOT NULL,
    "id_consulta" INTEGER NOT NULL,
    "fecha" DATE NOT NULL,
    "abono" DECIMAL(10,2) NOT NULL,
    "saldo" DECIMAL(10,2) NOT NULL,
    "observacion" TEXT,
    "firma_paciente" TEXT,

    CONSTRAINT "pago_paciente_pkey" PRIMARY KEY ("id_pago")
);

-- CreateIndex
CREATE UNIQUE INDEX "rol_nombre_key" ON "rol"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "privilegio_nombre_key" ON "privilegio"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "persona_numero_identidad_key" ON "persona"("numero_identidad");

-- CreateIndex
CREATE UNIQUE INDEX "persona_correo_electronico_key" ON "persona"("correo_electronico");

-- CreateIndex
CREATE UNIQUE INDEX "usuario_username_key" ON "usuario"("username");

-- AddForeignKey
ALTER TABLE "rol_privilegio" ADD CONSTRAINT "rol_privilegio_id_rol_fkey" FOREIGN KEY ("id_rol") REFERENCES "rol"("id_rol") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rol_privilegio" ADD CONSTRAINT "rol_privilegio_id_privilegio_fkey" FOREIGN KEY ("id_privilegio") REFERENCES "privilegio"("id_privilegio") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "persona" ADD CONSTRAINT "persona_id_departamento_fkey" FOREIGN KEY ("id_departamento") REFERENCES "departamento"("id_departamento") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "persona" ADD CONSTRAINT "persona_id_ciudad_fkey" FOREIGN KEY ("id_ciudad") REFERENCES "municipio"("id_municipio") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuario" ADD CONSTRAINT "usuario_id_persona_fkey" FOREIGN KEY ("id_persona") REFERENCES "persona"("id_persona") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuario" ADD CONSTRAINT "usuario_id_rol_fkey" FOREIGN KEY ("id_rol") REFERENCES "rol"("id_rol") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "antecedente_respuesta" ADD CONSTRAINT "antecedente_respuesta_id_consulta_fkey" FOREIGN KEY ("id_consulta") REFERENCES "consulta"("id_consulta") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "antecedente_respuesta" ADD CONSTRAINT "antecedente_respuesta_id_pregunta_fkey" FOREIGN KEY ("id_pregunta") REFERENCES "antecedente_pregunta"("id_pregunta") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consulta" ADD CONSTRAINT "consulta_id_persona_fkey" FOREIGN KEY ("id_persona") REFERENCES "persona"("id_persona") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consulta" ADD CONSTRAINT "consulta_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuario"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "odontograma" ADD CONSTRAINT "odontograma_id_consulta_fkey" FOREIGN KEY ("id_consulta") REFERENCES "consulta"("id_consulta") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "odontograma" ADD CONSTRAINT "odontograma_id_diente_fkey" FOREIGN KEY ("id_diente") REFERENCES "diente"("numero_diente") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pago_paciente" ADD CONSTRAINT "pago_paciente_id_consulta_fkey" FOREIGN KEY ("id_consulta") REFERENCES "consulta"("id_consulta") ON DELETE RESTRICT ON UPDATE CASCADE;
