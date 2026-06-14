const prisma = require("../config/database");

async function insertEspecialidades() {
  const especialidades = [
    { nombre: "Odontología General" },
    { nombre: "Odontología General y Preventiva" },
    { nombre: "Odontología Especializada" },
    { nombre: "Odontología Estética" },
    { nombre: "Ortodoncia" },
    { nombre: "Ortodoncia y Ortopedia Maxilar" },
    { nombre: "Cirugía Bucal e Implantología" },
    { nombre: "Prótesis" },
    { nombre: "Prótesis y Rehabilitación Oral" },
    { nombre: "Endodoncia" },
    { nombre: "Periodoncia" },
    { nombre: "Cirugía Oral" },
  ];

  await prisma.especialidad.createMany({
    data: especialidades,
    skipDuplicates: true,
  });

  console.log("Especialidades insertadas correctamente");
}

module.exports = { insertEspecialidades };
