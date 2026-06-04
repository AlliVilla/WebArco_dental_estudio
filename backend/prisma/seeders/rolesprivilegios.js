const prisma = require("../config/database");

async function insertRolesPrivilegios() {
  const relaciones = [

    // ESPECIALISTA
    { id_rol: 1, id_privilegio: 1 }, 
    { id_rol: 1, id_privilegio: 3 }, 
    { id_rol: 1, id_privilegio: 4 }, 
    { id_rol: 1, id_privilegio: 5 }, 
    { id_rol: 1, id_privilegio: 16 },
    { id_rol: 1, id_privilegio: 17 },
    { id_rol: 1, id_privilegio: 18 },
    { id_rol: 1, id_privilegio: 20 },
    { id_rol: 1, id_privilegio: 21 },
    { id_rol: 1, id_privilegio: 26 },
    { id_rol: 1, id_privilegio: 27 },
    { id_rol: 1, id_privilegio: 28 },

    // ADMIN = TODO
    { id_rol: 2, id_privilegio: 1 },
    { id_rol: 2, id_privilegio: 2 },
    { id_rol: 2, id_privilegio: 3 },
    { id_rol: 2, id_privilegio: 4 },
    { id_rol: 2, id_privilegio: 5 },
    { id_rol: 2, id_privilegio: 6 },
    { id_rol: 2, id_privilegio: 7 },
    { id_rol: 2, id_privilegio: 8 },
    { id_rol: 2, id_privilegio: 9 },
    { id_rol: 2, id_privilegio: 10 },

    // DOCTOR
    { id_rol: 4, id_privilegio: 1 },
    { id_rol: 4, id_privilegio: 3 },
    { id_rol: 4, id_privilegio: 5 },
    { id_rol: 4, id_privilegio: 16 },
    { id_rol: 4, id_privilegio: 17 },
    { id_rol: 4, id_privilegio: 20 },
    { id_rol: 4, id_privilegio: 26 },
    { id_rol: 4, id_privilegio: 27 },
    { id_rol: 4, id_privilegio: 28 },

    // CONTADOR
    { id_rol: 3, id_privilegio: 2 },
    { id_rol: 3, id_privilegio: 10 },
    { id_rol: 3, id_privilegio: 11 },
    { id_rol: 3, id_privilegio: 12 },
    { id_rol: 3, id_privilegio: 13 },
    { id_rol: 3, id_privilegio: 14 },
  ];

  await prisma.rolPrivilegio.createMany({
    data: relaciones,
    skipDuplicates: true,
  });

  console.log("Roles-Privilegios insertados correctamente");
}

module.exports = { insertRolesPrivilegios };