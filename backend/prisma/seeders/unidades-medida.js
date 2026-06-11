const prisma = require("../config/database");

async function insertUnidadesMedida() {
    const unidades = [
        { nombre: "Frasco" },
        { nombre: "Caja" },
        { nombre: "Unidad" },
        { nombre: "Tubo" },
        { nombre: "Paquete" }
    ];

    await prisma.unidadMedida.createMany({
        data: unidades,
        skipDuplicates: true,
    });

    console.log("Unidades de medida insertadas correctamente");
}

module.exports = { insertUnidadesMedida };