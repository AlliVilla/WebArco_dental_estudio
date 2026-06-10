const prisma = require("../config/database");

async function insertOdontograma() {
  const existing = await prisma.odontograma.count();
  if (existing > 0) {
    console.log(`Ya existen ${existing} registros odontograma — se omiten`);
    return;
  }

  const consultasConDatos = [
    {
      id_persona: 1,
      fecha_fin: null,
      items: [
        { id_diente: 16, estado: "Caries", observacion: "Caries en surco profundo. Requiere eliminación de tejido cariado." },
        { id_diente: 26, estado: "Obturación", observacion: "Obturación clase I en resina compuesta." },
        { id_diente: 11, estado: "Corona", observacion: "Corona de porcelana sobre metal. Colocada hace 2 años." },
        { id_diente: 46, estado: "Obturación", observacion: "Obturación clase II en amalgama." },
      ],
    },
    {
      id_persona: 3,
      fecha_fin: null,
      items: [
        { id_diente: 14, estado: "Endodoncia", observacion: "Conducto tratado. Pendiente corona definitiva." },
        { id_diente: 24, estado: "Endodoncia", observacion: "Retratamiento de conducto por lesión periapical." },
        { id_diente: 46, estado: "Ausente", observacion: "Pérdida por caries avanzada. Evaluar implante." },
        { id_diente: 36, estado: "Implante", observacion: "Implante osteointegrado. Carga diferida." },
      ],
    },
    {
      id_persona: 4,
      fecha_fin: null,
      items: [
        { id_diente: 15, estado: "Prótesis", observacion: "Prótesis parcial removible superior." },
        { id_diente: 25, estado: "Puente", observacion: "Puente de 3 unidades metal-cerámica." },
        { id_diente: 45, estado: "Obturación", observacion: "Obturación clase II en composite." },
      ],
    },
    {
      id_persona: 1,
      fecha_fin: { not: null },
      items: [
        { id_diente: 11, estado: "Sano", observacion: "Sin novedades en revisión general." },
        { id_diente: 16, estado: "Sano", observacion: "Leve desgaste oclusal, sin caries." },
      ],
    },
    {
      id_persona: 5,
      fecha_fin: { not: null },
      items: [
        { id_diente: 36, estado: "Prótesis", observacion: "Corona provisional sobre implante." },
        { id_diente: 37, estado: "Obturación", observacion: "Obturación clase I por caries incipiente." },
      ],
    },
  ];

  const recordsToInsert = [];

  for (const grupo of consultasConDatos) {
    const consulta = await prisma.consulta.findFirst({
      where: {
        id_persona: grupo.id_persona,
        fecha_fin: grupo.fecha_fin,
      },
      orderBy: { fecha_inicio: "desc" },
    });

    if (!consulta) {
      console.warn(`No se encontró consulta para persona ${grupo.id_persona}`);
      continue;
    }

    for (const item of grupo.items) {
      recordsToInsert.push({
        id_consulta: consulta.id_consulta,
        id_diente: item.id_diente,
        estado: item.estado,
        observacion: item.observacion,
      });
    }
  }

  if (recordsToInsert.length > 0) {
    await prisma.odontograma.createMany({ data: recordsToInsert });
  }

  console.log(`${recordsToInsert.length} registros odontograma insertados correctamente`);
}

module.exports = { insertOdontograma };
