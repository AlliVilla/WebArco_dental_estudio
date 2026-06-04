const prisma = require("../config/database");

async function insertRoles() {
    const roles = [
        {
            nombre: "Especialista",
        },
        {
            nombre: "Administrador",
        },
        {
            nombre: "Contador",
        },
        {
            nombre: "Doctor",
        },
    ];

    await prisma.rol.createMany({
      data: roles,
      skipDuplicates: true,
    });

    console.log("Roles insertados correctamente")
};

module.exports = { insertRoles };