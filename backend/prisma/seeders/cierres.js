const prisma = require("../config/database");

async function insertCierres() {
  const cierres = [
    {
      fecha: new Date("2026-06-01T00:00:00Z"),
      ingresos: 8000.00,
      egresos: 2000.00,
      saldo: 6000.00,
      id_usuario: 2,
    },
    {
      fecha: new Date("2026-06-02T00:00:00Z"),
      ingresos: 5500.00,
      egresos: 1500.00,
      saldo: 4000.00,
      id_usuario: 2,
    },
    {
      fecha: new Date("2026-06-03T00:00:00Z"),
      ingresos: 3200.00,
      egresos: 500.00,
      saldo: 2700.00,
      id_usuario: 2,
    },
  ];

  await prisma.cierre.createMany({
    data: cierres,
    skipDuplicates: true,
  });

  console.log("Cierres insertados correctamente");
}

module.exports = { insertCierres };
