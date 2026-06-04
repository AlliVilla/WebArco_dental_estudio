const prisma = require("../config/database");

async function insertDientes() {
  const dientes = [
    // ===== PERMANENTES =====

    // Cuadrante 1
    { numero_diente: 11, nombre: "Incisivo central sup. derecho" },
    { numero_diente: 12, nombre: "Incisivo lateral sup. derecho" },
    { numero_diente: 13, nombre: "Canino sup. derecho" },
    { numero_diente: 14, nombre: "1er premolar sup. derecho" },
    { numero_diente: 15, nombre: "2do premolar sup. derecho" },
    { numero_diente: 16, nombre: "1er molar sup. derecho" },
    { numero_diente: 17, nombre: "2do molar sup. derecho" },
    { numero_diente: 18, nombre: "3er molar sup. derecho" },

    // Cuadrante 2
    { numero_diente: 21, nombre: "Incisivo central sup. izquierdo" },
    { numero_diente: 22, nombre: "Incisivo lateral sup. izquierdo" },
    { numero_diente: 23, nombre: "Canino sup. izquierdo" },
    { numero_diente: 24, nombre: "1er premolar sup. izquierdo" },
    { numero_diente: 25, nombre: "2do premolar sup. izquierdo" },
    { numero_diente: 26, nombre: "1er molar sup. izquierdo" },
    { numero_diente: 27, nombre: "2do molar sup. izquierdo" },
    { numero_diente: 28, nombre: "3er molar sup. izquierdo" },

    // Cuadrante 3
    { numero_diente: 31, nombre: "Incisivo central inf. izquierdo" },
    { numero_diente: 32, nombre: "Incisivo lateral inf. izquierdo" },
    { numero_diente: 33, nombre: "Canino inf. izquierdo" },
    { numero_diente: 34, nombre: "1er premolar inf. izquierdo" },
    { numero_diente: 35, nombre: "2do premolar inf. izquierdo" },
    { numero_diente: 36, nombre: "1er molar inf. izquierdo" },
    { numero_diente: 37, nombre: "2do molar inf. izquierdo" },
    { numero_diente: 38, nombre: "3er molar inf. izquierdo" },

    // Cuadrante 4
    { numero_diente: 41, nombre: "Incisivo central inf. derecho" },
    { numero_diente: 42, nombre: "Incisivo lateral inf. derecho" },
    { numero_diente: 43, nombre: "Canino inf. derecho" },
    { numero_diente: 44, nombre: "1er premolar inf. derecho" },
    { numero_diente: 45, nombre: "2do premolar inf. derecho" },
    { numero_diente: 46, nombre: "1er molar inf. derecho" },
    { numero_diente: 47, nombre: "2do molar inf. derecho" },
    { numero_diente: 48, nombre: "3er molar inf. derecho" },

    // ===== TEMPORALES =====

    // Cuadrante 5
    { numero_diente: 51, nombre: "Incisivo central sup. derecho (temporal)" },
    { numero_diente: 52, nombre: "Incisivo lateral sup. derecho (temporal)" },
    { numero_diente: 53, nombre: "Canino sup. derecho (temporal)" },
    { numero_diente: 54, nombre: "1er molar sup. derecho (temporal)" },
    { numero_diente: 55, nombre: "2do molar sup. derecho (temporal)" },

    // Cuadrante 6
    { numero_diente: 61, nombre: "Incisivo central sup. izquierdo (temporal)" },
    { numero_diente: 62, nombre: "Incisivo lateral sup. izquierdo (temporal)" },
    { numero_diente: 63, nombre: "Canino sup. izquierdo (temporal)" },
    { numero_diente: 64, nombre: "1er molar sup. izquierdo (temporal)" },
    { numero_diente: 65, nombre: "2do molar sup. izquierdo (temporal)" },

    // Cuadrante 7
    { numero_diente: 71, nombre: "Incisivo central inf. izquierdo (temporal)" },
    { numero_diente: 72, nombre: "Incisivo lateral inf. izquierdo (temporal)" },
    { numero_diente: 73, nombre: "Canino inf. izquierdo (temporal)" },
    { numero_diente: 74, nombre: "1er molar inf. izquierdo (temporal)" },
    { numero_diente: 75, nombre: "2do molar inf. izquierdo (temporal)" },

    // Cuadrante 8
    { numero_diente: 81, nombre: "Incisivo central inf. derecho (temporal)" },
    { numero_diente: 82, nombre: "Incisivo lateral inf. derecho (temporal)" },
    { numero_diente: 83, nombre: "Canino inf. derecho (temporal)" },
    { numero_diente: 84, nombre: "1er molar inf. derecho (temporal)" },
    { numero_diente: 85, nombre: "2do molar inf. derecho (temporal)" },
  ];

  await prisma.diente.createMany({ data: dientes, skipDuplicates: true });

  console.log("Dientes (permanentes + temporales) insertados correctamente");
}

module.exports = { insertDientes };