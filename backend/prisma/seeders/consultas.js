const prisma = require("../config/database");

async function insertConsultas() {
  const existing = await prisma.consulta.count();
  if (existing > 0) {
    console.log(`Ya existen ${existing} consultas — se omiten`);
    return;
  }

  const today = new Date();
  const aWeekAgo = new Date();
  aWeekAgo.setDate(aWeekAgo.getDate() - 7);
  const twoWeeksAgo = new Date();
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

  const consultas = [
    {
      id_persona: 1,
      id_usuario: 1,
      fecha_inicio: today,
      fecha_fin: null,
      diagnostico: "Caries dental en molares superiores",
      tratamiento: "Eliminación de caries y obturación",
      motivo: "Dolor en muelas superiores",
      notas: "Paciente refiere dolor agudo al masticar. Se detectan caries en piezas 16 y 26.",
      consentimiento: true,
    },
    {
      id_persona: 3,
      id_usuario: 4,
      fecha_inicio: aWeekAgo,
      fecha_fin: null,
      diagnostico: "Endodoncia en premolares",
      tratamiento: "Tratamiento de conducto en piezas 14 y 24",
      motivo: "Sensibilidad al frío persistente",
      notas: "Paciente presenta sensibilidad prolongada. Se confirma necesidad de endodoncia.",
      consentimiento: true,
    },
    {
      id_persona: 4,
      id_usuario: 4,
      fecha_inicio: twoWeeksAgo,
      fecha_fin: null,
      diagnostico: "Evaluación protésica",
      tratamiento: "Toma de impresiones para prótesis parcial",
      motivo: "Pérdida dental parcial",
      notas: "Paciente requiere prótesis en sector posterior inferior.",
      consentimiento: true,
    },
    {
      id_persona: 1,
      id_usuario: 4,
      fecha_inicio: new Date("2026-01-15"),
      fecha_fin: new Date("2026-01-15T10:30:00"),
      diagnostico: "Revisión general",
      tratamiento: "Limpieza y fluorización",
      motivo: "Control de rutina",
      notas: "Paciente sin novedades. Se recomienda mantener higiene.",
      consentimiento: true,
    },
    {
      id_persona: 5,
      id_usuario: 1,
      fecha_inicio: new Date("2026-02-20"),
      fecha_fin: new Date("2026-02-20T11:00:00"),
      diagnostico: "Prótesis fija",
      tratamiento: "Colocación de implante en pieza 36",
      motivo: "Pérdida de primera molar inferior",
      notas: "Procedimiento exitoso. Pendiente corona definitiva en 3 meses.",
      consentimiento: true,
    },
  ];

  await prisma.consulta.createMany({ data: consultas });
  console.log(`${consultas.length} consultas insertadas correctamente`);
}

module.exports = { insertConsultas };
