const prisma = require("../config/database");

async function insertCierres() {
  const cierres = [
    {
      fecha: new Date("2026-06-01T00:00:00Z"),
      tipo_cierre: "Diario",
      ingresos: 8000.00,
      egresos: 2000.00,
      utilidad: 6000.00,
      efectivo: 4000.00,
      tarjeta: 1000.00,
      transferencia: 1000.00,
      id_usuario: 2,
    },
    {
      fecha: new Date("2026-06-02T00:00:00Z"),
      tipo_cierre: "Diario",
      ingresos: 5500.00,
      egresos: 1500.00,
      utilidad: 4000.00,
      efectivo: 3000.00,
      tarjeta: 500.00,
      transferencia: 500.00,
      id_usuario: 2,
    },
    {
      fecha: new Date("2026-06-03T00:00:00Z"),
      tipo_cierre: "Diario",
      ingresos: 3200.00,
      egresos: 500.00,
      utilidad: 2700.00,
      efectivo: 2000.00,
      tarjeta: 200.00,
      transferencia: 500.00,
      id_usuario: 2,
    },
    {
      fecha: new Date("2026-05-31T00:00:00Z"),
      tipo_cierre: "Semanal",
      ingresos: 35000.00,
      egresos: 10000.00,
      utilidad: 25000.00,
      efectivo: 20000.00,
      tarjeta: 10000.00,
      transferencia: 5000.00,
      id_usuario: 2,
    },
    {
      fecha: new Date("2026-05-15T00:00:00Z"),
      tipo_cierre: "Quincenal",
      ingresos: 65000.00,
      egresos: 15000.00,
      utilidad: 50000.00,
      efectivo: 35000.00,
      tarjeta: 15000.00,
      transferencia: 15000.00,
      id_usuario: 2,
    },
    {
      fecha: new Date("2026-05-01T00:00:00Z"),
      tipo_cierre: "Mensual",
      ingresos: 125000.00,
      egresos: 30000.00,
      utilidad: 95000.00,
      efectivo: 70000.00,
      tarjeta: 30000.00,
      transferencia: 25000.00,
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
