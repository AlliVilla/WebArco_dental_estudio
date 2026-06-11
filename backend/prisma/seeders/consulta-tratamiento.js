const prisma = require("../config/database");

async function insertConsultaTratamientos() {
  const existing = await prisma.consulta_Tratamiento.count();
  if (existing > 0) {
    console.log(`Ya existen ${existing} consulta_tratamientos — se omiten`);
    return;
  }

  const consultaTratamientos = [
    // Consulta 1 - Caries molares superiores (id_persona: 1)
    {
      id_consulta: 1,
      id_tratamiento: 2, // Obturación (resina)
      descuento: 0,
      precio: 800.00,
    },
    {
      id_consulta: 1,
      id_tratamiento: 1, // Limpieza dental
      descuento: 10,
      precio: 450.00,
    },

    // Consulta 2 - Endodoncia premolares (id_persona: 3)
    {
      id_consulta: 2,
      id_tratamiento: 4, // Tratamiento de conducto
      descuento: 0,
      precio: 2500.00,
    },

    // Consulta 3 - Evaluación protésica (id_persona: 4)
    {
      id_consulta: 3,
      id_tratamiento: 9, // Puente dental
      descuento: 5,
      precio: 6650.00,
    },

    // Consulta 4 - Revisión general (id_persona: 1)
    {
      id_consulta: 4,
      id_tratamiento: 1, // Limpieza dental
      descuento: 0,
      precio: 500.00,
    },

    // Consulta 5 - Implante pieza 36 (id_persona: 5)
    {
      id_consulta: 5,
      id_tratamiento: 8, // Corona dental
      descuento: 0,
      precio: 3500.00,
    },
    {
      id_consulta: 5,
      id_tratamiento: 3, // Extracción simple (previa al implante)
      descuento: 15,
      precio: 765.00,
    },
  ];

  await prisma.consulta_Tratamiento.createMany({
    data: consultaTratamientos,
    skipDuplicates: true,
  });

  console.log(`${consultaTratamientos.length} consulta_tratamientos insertados correctamente`);
}

module.exports = { insertConsultaTratamientos };