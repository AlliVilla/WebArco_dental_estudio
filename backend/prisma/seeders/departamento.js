const prisma = require("../config/database");

async function insertDepartamentos() {
  const departamentos = [
    { nombre: "Atlántida" },
    { nombre: "Choluteca" },
    { nombre: "Colón" },
    { nombre: "Comayagua" },
    { nombre: "Copán" },
    { nombre: "Cortés" },
    { nombre: "El Paraíso" },
    { nombre: "Francisco Morazán" },
    { nombre: "Gracias a Dios" },
    { nombre: "Intibucá" },
    { nombre: "Islas de la Bahía" },
    { nombre: "La Paz" },
    { nombre: "Lempira" },
    { nombre: "Ocotepeque" },
    { nombre: "Olancho" },
    { nombre: "Santa Bárbara" },
    { nombre: "Valle" },
    { nombre: "Yoro" },
  ];

  await prisma.departamento.createMany({
    data: departamentos,
    skipDuplicates: true,
  });

  console.log("Departamentos insertados correctamente");
}

module.exports = { insertDepartamentos };
