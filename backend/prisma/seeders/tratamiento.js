const prisma = require("../config/database");

async function insertTratamientos() {
  const tratamientos = [
    // Odontología General
    {
      especialidad: "Odontología General",
      nombre: "Limpieza dental",
      descripcion: "Remoción de placa bacteriana y cálculo dental",
      impacto_odontograma: "GENERAL",
      precio: 500.00,
    },
    {
      especialidad: "Odontología General",
      nombre: "Obturación (resina)",
      descripcion: "Restauración de diente con caries usando resina",
      impacto_odontograma: "PIEZA",
      precio: 800.00,
    },
    {
      especialidad: "Odontología General",
      nombre: "Extracción simple",
      descripcion: "Remoción de pieza dental sin cirugía",
      impacto_odontograma: "PIEZA",
      precio: 900.00,
    },

    // Endodoncia
    {
      especialidad: "Endodoncia",
      nombre: "Tratamiento de conducto",
      descripcion: "Eliminación del nervio infectado dentro del diente",
      impacto_odontograma: "PIEZA_INTERNA",
      precio: 2500.00,
    },

    // Ortodoncia
    {
      especialidad: "Ortodoncia",
      nombre: "Brackets metálicos",
      descripcion: "Colocación de brackets tradicionales",
      impacto_odontograma: "MULTIPLE",
      precio: 12000.00,
    },
    {
      especialidad: "Ortodoncia",
      nombre: "Ajuste de ortodoncia",
      descripcion: "Control y ajuste mensual de brackets",
      impacto_odontograma: "GENERAL",
      precio: 600.00,
    },

    // Periodoncia
    {
      especialidad: "Periodoncia",
      nombre: "Curetaje",
      descripcion: "Limpieza profunda debajo de las encías",
      impacto_odontograma: "ENCÍA",
      precio: 1500.00,
    },

    // Prótesis
    {
      especialidad: "Prótesis",
      nombre: "Corona dental",
      descripcion: "Restauración completa de un diente",
      impacto_odontograma: "PIEZA",
      precio: 3500.00,
    },
    {
      especialidad: "Prótesis",
      nombre: "Puente dental",
      descripcion: "Reemplazo de uno o más dientes perdidos",
      impacto_odontograma: "MULTIPLE",
      precio: 7000.00,
    },

    // Cirugía Oral
    {
      especialidad: "Cirugía Oral",
      nombre: "Extracción de cordales",
      descripcion: "Extracción quirúrgica de muelas del juicio",
      impacto_odontograma: "PIEZA",
      precio: 2000.00,
    },
  ];

  await prisma.tratamiento.createMany({
    data: tratamientos,
    skipDuplicates: true,
  });

  console.log("Tratamientos insertados correctamente");
}

module.exports = { insertTratamientos };