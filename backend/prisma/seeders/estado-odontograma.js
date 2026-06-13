const prisma = require("../config/database");

async function insertEstadosOdontograma() {
  const estados = [
    { nombre: "Sano", color: "#A8D5BA" },
    { nombre: "Caries", color: "#F4AFAD" },
    { nombre: "Obturación", color: "#90D0E8" },
    { nombre: "Extracción", color: "#B8BEC6" },
    { nombre: "Ausente", color: "#CDD0D5" },
    { nombre: "Endodoncia", color: "#F5CC80" },
    { nombre: "Corona", color: "#9ABFD4" },
    { nombre: "Prótesis", color: "#C4ADED" },
    { nombre: "Implante", color: "#A0B8E8" },
    { nombre: "Puente", color: "#E8BCA0" },
  ];

  for (const e of estados) {
    await prisma.estadoOdontograma.upsert({
      where: { nombre: e.nombre },
      update: { color: e.color },
      create: e,
    });
  }

  console.log("Estados de odontograma insertados correctamente");
}

module.exports = { insertEstadosOdontograma };
