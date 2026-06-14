const prisma = require("../config/database");

async function insertConsultaPreguntas() {
  const preguntas = [
    {
      pregunta: "Enfermedad De Base",
      orden_num: 1,
      requiere_explicacion: true,
      categoria: "Antecedentes Médicos"
    },
    {
      pregunta: "Toma Algún Medicamento",
      orden_num: 2,
      requiere_explicacion: true,
      categoria: "Antecedentes Médicos"
    },
    {
      pregunta: "Alergias A Medicamentos O Comidas",
      orden_num: 3,
      requiere_explicacion: true,
      categoria: "Antecedentes Médicos"
    },
    {
      pregunta: "Actualmente Se Encuentra Bajo Tratamiento Médico",
      orden_num: 4,
      requiere_explicacion: true,
      categoria: "Antecedentes Médicos"
    },
    {
      pregunta: "Cuándo fue su última visita al odontólogo",
      orden_num: 5,
      requiere_explicacion: false,
      categoria: "Antecedentes Odontológicos"
    },
    {
      pregunta: "Motivo de consulta",
      orden_num: 6,
      requiere_explicacion: false,
      categoria: "Antecedentes Odontológicos"
    },
  ];

  for (const p of preguntas) {
    await prisma.consultaPregunta.upsert({
      where: { id_pregunta: p.orden_num },
      update: { pregunta: p.pregunta, requiere_explicacion: p.requiere_explicacion, categoria: p.categoria },
      create: {
        id_pregunta: p.orden_num,
        pregunta: p.pregunta,
        orden_num: p.orden_num,
        requiere_explicacion: p.requiere_explicacion,
        categoria: p.categoria
      },
    });
  }

  console.log(`[seed] Consulta-Preguntas: ${preguntas.length} preguntas insertadas`);

  // Reset sequence
  await prisma.$executeRawUnsafe(`SELECT setval('consulta_pregunta_id_pregunta_seq', (SELECT MAX(id_pregunta) FROM consulta_pregunta));`);
  console.log(`[seed] Consulta-Preguntas sequence reset`);
}

module.exports = { insertConsultaPreguntas };
