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

    for (const rol of roles) {
      await prisma.rol.create({
        data: rol,
      });
    }

    console.log("Roles insertados correctamente")
};

module.exports = { insertRoles };