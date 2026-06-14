-- CreateEnum
CREATE TYPE "EstadoCita" AS ENUM ('programada', 'confirmada', 'cancelada', 'no_asistio', 'atendida', 'ausente', 'reprogramada');

-- CreateEnum
CREATE TYPE "Sexo" AS ENUM ('M', 'F');

-- CreateEnum
CREATE TYPE "CanalRecordatorio" AS ENUM ('WhatsApp', 'SMS', 'Correo');

-- CreateEnum
CREATE TYPE "EstadoRespuesta" AS ENUM ('pendiente', 'confirmado', 'cancelado', 'sin_respuesta', 'descartado');

-- CreateEnum
CREATE TYPE "TipoArchivo" AS ENUM ('Tomografia', 'Radiografia', 'Imagen', 'Antes', 'Después', 'Comparativa');

-- CreateEnum
CREATE TYPE "TipoMovimiento" AS ENUM ('Entrada', 'Salida');

-- CreateEnum
CREATE TYPE "TipoCierre" AS ENUM ('Diario', 'Semanal', 'Quincenal', 'Mensual');

-- CreateEnum
CREATE TYPE "MetodoPago" AS ENUM ('EFECTIVO', 'TARJETA', 'TRANSFERENCIA');

-- CreateEnum
CREATE TYPE "TratamientoEstado" AS ENUM ('ACTIVO', 'COMPLETADO', 'CANCELADO', 'DESACTIVADO');

-- CreateTable
CREATE TABLE "rol" (
    "id_rol" SERIAL NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "descripcion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,

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
    "id_departamento" SERIAL NOT NULL,
    "nombre" VARCHAR(255) NOT NULL,

    CONSTRAINT "departamento_pkey" PRIMARY KEY ("id_departamento")
);

-- CreateTable
CREATE TABLE "municipio" (
    "id_municipio" SERIAL NOT NULL,
    "nombre" VARCHAR(255) NOT NULL,
    "id_departamento" INTEGER NOT NULL,

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
    "id_municipio" INTEGER NOT NULL,
    "direccion_linea" TEXT,
    "sexo" "Sexo" NOT NULL,
    "enfermedades" TEXT,
    "otras_enfermedades" TEXT,
    "medicamentos" TEXT,
    "alergias" TEXT,
    "reaccion_anestesia" VARCHAR(20),

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
    "must_change_password" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "usuario_pkey" PRIMARY KEY ("id_usuario")
);

-- CreateTable
CREATE TABLE "consulta_pregunta" (
    "id_pregunta" SERIAL NOT NULL,
    "pregunta" VARCHAR(255) NOT NULL,
    "orden_num" INTEGER NOT NULL,
    "requiere_explicacion" BOOLEAN NOT NULL DEFAULT false,
    "obligatorio" BOOLEAN NOT NULL DEFAULT true,
    "categoria" VARCHAR(100) NOT NULL DEFAULT 'Antecedentes Médicos',

    CONSTRAINT "consulta_pregunta_pkey" PRIMARY KEY ("id_pregunta")
);

-- CreateTable
CREATE TABLE "consulta_respuesta" (
    "id_respuesta" SERIAL NOT NULL,
    "id_consulta" INTEGER NOT NULL,
    "id_pregunta" INTEGER NOT NULL,
    "respuesta_boolean" BOOLEAN,
    "explanation" TEXT,

    CONSTRAINT "consulta_respuesta_pkey" PRIMARY KEY ("id_respuesta")
);

-- CreateTable
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

-- CreateTable
CREATE TABLE "recordatorio" (
    "id" SERIAL NOT NULL,
    "id_cita" INTEGER NOT NULL,
    "canal" "CanalRecordatorio" NOT NULL,
    "estado_respuesta" "EstadoRespuesta" NOT NULL DEFAULT 'pendiente',
    "fecha_envio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_respuesta" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recordatorio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consulta" (
    "id_consulta" SERIAL NOT NULL,
    "id_cita" INTEGER,
    "id_persona" INTEGER NOT NULL,
    "id_usuario" INTEGER NOT NULL,
    "fecha_inicio" TIMESTAMP NOT NULL,
    "fecha_fin" TIMESTAMP,
    "diagnostico" TEXT,
    "tratamiento" TEXT,
    "motivo" TEXT,
    "notas" TEXT,
    "firma_paciente" TEXT,
    "firma_doctor_snapshot" TEXT,
    "consentimiento" BOOLEAN NOT NULL DEFAULT false,
    "tratamientoPacienteId" INTEGER,

    CONSTRAINT "consulta_pkey" PRIMARY KEY ("id_consulta")
);

-- CreateTable
CREATE TABLE "Archivo" (
    "id_archivo" SERIAL NOT NULL,
    "id_consulta" INTEGER NOT NULL,
    "nombre" VARCHAR(255) NOT NULL,
    "categoria" "TipoArchivo" NOT NULL,
    "url" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Archivo_pkey" PRIMARY KEY ("id_archivo")
);

-- CreateTable
CREATE TABLE "estado_historial" (
    "id_historial" SERIAL NOT NULL,
    "id_cita" INTEGER NOT NULL,
    "estado_anterior" "EstadoCita",
    "estado_nuevo" "EstadoCita" NOT NULL,
    "cambiado_por" INTEGER NOT NULL,
    "fecha_cambio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "estado_historial_pkey" PRIMARY KEY ("id_historial")
);

-- CreateTable
CREATE TABLE "estado_odontograma" (
    "id_estado" SERIAL NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "color" VARCHAR(20) NOT NULL,

    CONSTRAINT "estado_odontograma_pkey" PRIMARY KEY ("id_estado")
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
    "estado_anterior" VARCHAR(100),
    "observacion_anterior" TEXT,

    CONSTRAINT "odontograma_pkey" PRIMARY KEY ("id_odontograma")
);

-- CreateTable
CREATE TABLE "pago_paciente" (
    "id_pago" SERIAL NOT NULL,
    "id_consulta" INTEGER NOT NULL,
    "fecha" DATE NOT NULL,
    "abono" DECIMAL(10,2) NOT NULL,
    "observacion" TEXT,
    "firma_paciente" TEXT,
    "metodo_pago" VARCHAR(50) NOT NULL DEFAULT 'Efectivo',
    "estado" VARCHAR(20) NOT NULL DEFAULT 'Pagado',

    CONSTRAINT "pago_paciente_pkey" PRIMARY KEY ("id_pago")
);

-- CreateTable
CREATE TABLE "especialidad" (
    "id_especialidad" SERIAL NOT NULL,
    "nombre" VARCHAR(120) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "especialidad_pkey" PRIMARY KEY ("id_especialidad")
);

-- CreateTable
CREATE TABLE "egreso" (
    "id_egreso" SERIAL NOT NULL,
    "concepto" VARCHAR(255) NOT NULL,
    "monto" DECIMAL(10,2) NOT NULL,
    "categoria" VARCHAR(50) NOT NULL,
    "fecha" DATE NOT NULL,
    "observaciones" VARCHAR(255),
    "id_usuario_creacion" INTEGER NOT NULL,
    "id_usuario_modificacion" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "usuarioId_usuario" INTEGER,

    CONSTRAINT "egreso_pkey" PRIMARY KEY ("id_egreso")
);

-- CreateTable
CREATE TABLE "tratamiento" (
    "id_tratamiento" SERIAL NOT NULL,
    "id_especialidad" INTEGER NOT NULL,
    "nombre" VARCHAR(150) NOT NULL,
    "descripcion" TEXT,
    "impacto_odontograma" VARCHAR(60) NOT NULL,
    "precio" DECIMAL(10,2) NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tratamiento_pkey" PRIMARY KEY ("id_tratamiento")
);

-- CreateTable
CREATE TABLE "consulta_tratamiento" (
    "id_consulta_tratamiento" SERIAL NOT NULL,
    "id_tratamiento" INTEGER NOT NULL,
    "id_consulta" INTEGER NOT NULL,
    "descuento" INTEGER NOT NULL,
    "precio" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "consulta_tratamiento_pkey" PRIMARY KEY ("id_consulta_tratamiento")
);

-- CreateTable
CREATE TABLE "categoria_insumo" (
    "id_categoria" SERIAL NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categoria_insumo_pkey" PRIMARY KEY ("id_categoria")
);

-- CreateTable
CREATE TABLE "unidad_medida" (
    "id_unidad" SERIAL NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "unidad_medida_pkey" PRIMARY KEY ("id_unidad")
);

-- CreateTable
CREATE TABLE "insumo" (
    "id_insumo" SERIAL NOT NULL,
    "codigo" VARCHAR(50) NOT NULL,
    "nombre" VARCHAR(255) NOT NULL,
    "id_categoria" INTEGER NOT NULL,
    "id_unidad" INTEGER NOT NULL,
    "stock_actual" INTEGER NOT NULL DEFAULT 0,
    "stock_minimo" INTEGER NOT NULL DEFAULT 0,
    "precio_costo" DECIMAL(10,2) NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "insumo_pkey" PRIMARY KEY ("id_insumo")
);

-- CreateTable
CREATE TABLE "movimiento_inventario" (
    "id_movimiento" SERIAL NOT NULL,
    "id_insumo" INTEGER NOT NULL,
    "tipo" "TipoMovimiento" NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "fecha" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id_usuario" INTEGER NOT NULL,
    "observaciones" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "movimiento_inventario_pkey" PRIMARY KEY ("id_movimiento")
);

-- CreateTable
CREATE TABLE "cierre" (
    "id_cierre" SERIAL NOT NULL,
    "fecha" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tipo_cierre" "TipoCierre" NOT NULL,
    "ingresos" DECIMAL(10,2) NOT NULL,
    "egresos" DECIMAL(10,2) NOT NULL,
    "utilidad" DECIMAL(10,2) NOT NULL,
    "efectivo" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "tarjeta" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "transferencia" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "id_usuario" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cierre_pkey" PRIMARY KEY ("id_cierre")
);

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

-- CreateIndex
CREATE INDEX "consulta_respuesta_id_consulta_idx" ON "consulta_respuesta"("id_consulta");

-- CreateIndex
CREATE INDEX "recordatorio_id_cita_idx" ON "recordatorio"("id_cita");

-- CreateIndex
CREATE UNIQUE INDEX "consulta_id_cita_key" ON "consulta"("id_cita");

-- CreateIndex
CREATE INDEX "estado_historial_id_cita_idx" ON "estado_historial"("id_cita");

-- CreateIndex
CREATE UNIQUE INDEX "estado_odontograma_nombre_key" ON "estado_odontograma"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "odontograma_id_consulta_id_diente_key" ON "odontograma"("id_consulta", "id_diente");

-- CreateIndex
CREATE UNIQUE INDEX "especialidad_nombre_key" ON "especialidad"("nombre");

-- CreateIndex
CREATE INDEX "egreso_fecha_idx" ON "egreso"("fecha");

-- CreateIndex
CREATE INDEX "egreso_categoria_idx" ON "egreso"("categoria");

-- CreateIndex
CREATE INDEX "egreso_id_usuario_creacion_idx" ON "egreso"("id_usuario_creacion");

-- CreateIndex
CREATE INDEX "egreso_id_usuario_modificacion_idx" ON "egreso"("id_usuario_modificacion");

-- CreateIndex
CREATE UNIQUE INDEX "categoria_insumo_nombre_key" ON "categoria_insumo"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "unidad_medida_nombre_key" ON "unidad_medida"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "insumo_codigo_key" ON "insumo"("codigo");

-- CreateIndex
CREATE INDEX "insumo_id_categoria_idx" ON "insumo"("id_categoria");

-- CreateIndex
CREATE INDEX "insumo_id_unidad_idx" ON "insumo"("id_unidad");

-- CreateIndex
CREATE INDEX "insumo_activo_idx" ON "insumo"("activo");

-- CreateIndex
CREATE INDEX "movimiento_inventario_id_insumo_idx" ON "movimiento_inventario"("id_insumo");

-- CreateIndex
CREATE INDEX "movimiento_inventario_id_usuario_idx" ON "movimiento_inventario"("id_usuario");

-- CreateIndex
CREATE INDEX "movimiento_inventario_fecha_idx" ON "movimiento_inventario"("fecha");

-- CreateIndex
CREATE INDEX "cierre_id_usuario_idx" ON "cierre"("id_usuario");

-- CreateIndex
CREATE INDEX "cierre_fecha_idx" ON "cierre"("fecha");

-- AddForeignKey
ALTER TABLE "rol_privilegio" ADD CONSTRAINT "rol_privilegio_id_rol_fkey" FOREIGN KEY ("id_rol") REFERENCES "rol"("id_rol") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rol_privilegio" ADD CONSTRAINT "rol_privilegio_id_privilegio_fkey" FOREIGN KEY ("id_privilegio") REFERENCES "privilegio"("id_privilegio") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "municipio" ADD CONSTRAINT "municipio_id_departamento_fkey" FOREIGN KEY ("id_departamento") REFERENCES "departamento"("id_departamento") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "persona" ADD CONSTRAINT "persona_id_municipio_fkey" FOREIGN KEY ("id_municipio") REFERENCES "municipio"("id_municipio") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuario" ADD CONSTRAINT "usuario_id_persona_fkey" FOREIGN KEY ("id_persona") REFERENCES "persona"("id_persona") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuario" ADD CONSTRAINT "usuario_id_rol_fkey" FOREIGN KEY ("id_rol") REFERENCES "rol"("id_rol") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consulta_respuesta" ADD CONSTRAINT "consulta_respuesta_id_consulta_fkey" FOREIGN KEY ("id_consulta") REFERENCES "consulta"("id_consulta") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consulta_respuesta" ADD CONSTRAINT "consulta_respuesta_id_pregunta_fkey" FOREIGN KEY ("id_pregunta") REFERENCES "consulta_pregunta"("id_pregunta") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cita" ADD CONSTRAINT "cita_id_persona_fkey" FOREIGN KEY ("id_persona") REFERENCES "persona"("id_persona") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cita" ADD CONSTRAINT "cita_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuario"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recordatorio" ADD CONSTRAINT "recordatorio_id_cita_fkey" FOREIGN KEY ("id_cita") REFERENCES "cita"("id_cita") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consulta" ADD CONSTRAINT "consulta_id_cita_fkey" FOREIGN KEY ("id_cita") REFERENCES "cita"("id_cita") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consulta" ADD CONSTRAINT "consulta_id_persona_fkey" FOREIGN KEY ("id_persona") REFERENCES "persona"("id_persona") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consulta" ADD CONSTRAINT "consulta_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuario"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consulta" ADD CONSTRAINT "consulta_tratamientoPacienteId_fkey" FOREIGN KEY ("tratamientoPacienteId") REFERENCES "tratamiento_paciente"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Archivo" ADD CONSTRAINT "Archivo_id_consulta_fkey" FOREIGN KEY ("id_consulta") REFERENCES "consulta"("id_consulta") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estado_historial" ADD CONSTRAINT "estado_historial_id_cita_fkey" FOREIGN KEY ("id_cita") REFERENCES "cita"("id_cita") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estado_historial" ADD CONSTRAINT "estado_historial_cambiado_por_fkey" FOREIGN KEY ("cambiado_por") REFERENCES "usuario"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "odontograma" ADD CONSTRAINT "odontograma_id_consulta_fkey" FOREIGN KEY ("id_consulta") REFERENCES "consulta"("id_consulta") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "odontograma" ADD CONSTRAINT "odontograma_id_diente_fkey" FOREIGN KEY ("id_diente") REFERENCES "diente"("numero_diente") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pago_paciente" ADD CONSTRAINT "pago_paciente_id_consulta_fkey" FOREIGN KEY ("id_consulta") REFERENCES "consulta"("id_consulta") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "egreso" ADD CONSTRAINT "egreso_id_usuario_creacion_fkey" FOREIGN KEY ("id_usuario_creacion") REFERENCES "usuario"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "egreso" ADD CONSTRAINT "egreso_id_usuario_modificacion_fkey" FOREIGN KEY ("id_usuario_modificacion") REFERENCES "usuario"("id_usuario") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "egreso" ADD CONSTRAINT "egreso_usuarioId_usuario_fkey" FOREIGN KEY ("usuarioId_usuario") REFERENCES "usuario"("id_usuario") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tratamiento" ADD CONSTRAINT "tratamiento_id_especialidad_fkey" FOREIGN KEY ("id_especialidad") REFERENCES "especialidad"("id_especialidad") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consulta_tratamiento" ADD CONSTRAINT "consulta_tratamiento_id_consulta_fkey" FOREIGN KEY ("id_consulta") REFERENCES "consulta"("id_consulta") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consulta_tratamiento" ADD CONSTRAINT "consulta_tratamiento_id_tratamiento_fkey" FOREIGN KEY ("id_tratamiento") REFERENCES "tratamiento"("id_tratamiento") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "insumo" ADD CONSTRAINT "insumo_id_categoria_fkey" FOREIGN KEY ("id_categoria") REFERENCES "categoria_insumo"("id_categoria") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "insumo" ADD CONSTRAINT "insumo_id_unidad_fkey" FOREIGN KEY ("id_unidad") REFERENCES "unidad_medida"("id_unidad") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimiento_inventario" ADD CONSTRAINT "movimiento_inventario_id_insumo_fkey" FOREIGN KEY ("id_insumo") REFERENCES "insumo"("id_insumo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimiento_inventario" ADD CONSTRAINT "movimiento_inventario_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuario"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cierre" ADD CONSTRAINT "cierre_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuario"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tratamiento_paciente" ADD CONSTRAINT "tratamiento_paciente_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "persona"("id_persona") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pago_consulta" ADD CONSTRAINT "pago_consulta_consultaId_fkey" FOREIGN KEY ("consultaId") REFERENCES "consulta"("id_consulta") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tratamiento_abono" ADD CONSTRAINT "tratamiento_abono_pagoConsultaId_fkey" FOREIGN KEY ("pagoConsultaId") REFERENCES "pago_consulta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tratamiento_abono" ADD CONSTRAINT "tratamiento_abono_tratamientoPacienteId_fkey" FOREIGN KEY ("tratamientoPacienteId") REFERENCES "tratamiento_paciente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
