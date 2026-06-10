const prisma = require("../config/database");

async function insertCategoriasInsumo() {
    const categorias = [
        { nombre: "Anestesia" },
        { nombre: "Higiene" },
        { nombre: "Materiales" },
        { nombre: "Instrumental" },
        { nombre: "Desechables" }
    ];

    await prisma.categoriaInsumo.createMany({
        data: categorias,
        skipDuplicates: true,
    });

    console.log("Categorías de insumo insertadas correctamente");
}

module.exports = { insertCategoriasInsumo };