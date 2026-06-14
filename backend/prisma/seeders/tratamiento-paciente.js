const prisma = require("../config/database");

async function insertTratamientosPaciente() {
  console.log("[seed] TratamientosPaciente — insertando datos semilla");

  const juan = await prisma.persona.findFirst({ where: { numero_identidad: "0000000000001" } });
  if (!juan) {
    console.log("[seed] No se encontró paciente Juan, saltando TratamientosPaciente");
    return;
  }

  const tratamientos = [
    {
      pacienteId: juan.id_persona,
      nombre: "Brackets superiores e inferiores",
      costoTotal: 18000,
      estado: "ACTIVO",
      fechaInicio: new Date("2026-01-15"),
    },
    {
      pacienteId: juan.id_persona,
      nombre: "Limpieza dental profunda",
      costoTotal: 1500,
      estado: "COMPLETADO",
      fechaInicio: new Date("2026-02-01"),
      fechaFin: new Date("2026-02-01"),
    },
    {
      pacienteId: juan.id_persona,
      nombre: "Blanqueamiento dental",
      costoTotal: 3500,
      estado: "ACTIVO",
      fechaInicio: new Date("2026-03-10"),
    },
  ];

  for (const t of tratamientos) {
    await prisma.tratamientoPaciente.create({ data: t });
  }

  console.log(`[seed] ${tratamientos.length} TratamientosPaciente insertados`);
}

module.exports = { insertTratamientosPaciente };
