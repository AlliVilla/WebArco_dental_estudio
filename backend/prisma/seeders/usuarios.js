const prisma = require("../config/database");
const {hashPassword} = require("../../utils/bcrypt/hashPassword");

async function insertUsuarios() {
  const usuarios = [
    {
      id_persona: 1,
      username: "juan.specialist",
      password: await hashPassword("specialist123"),
      id_rol: 1, 
    },
    {
      id_persona: 2,
      username: "maria.admin",
      password: await hashPassword("admin123"),
      id_rol: 2, 
    },
    {
      id_persona: 3,
      username: "carlos.contador",
      password: await hashPassword("contador123"),
      id_rol: 3, 
    },
    {
      id_persona: 4,
      username: "ana.doctor",
      password: await hashPassword("doctor123"),
      id_rol: 4, 
    },
    {
      id_persona: 5,
      username: "luis.recepcion",
      password: await hashPassword("recepcion123"),
      id_rol: 2, 
    },
  ];

  await prisma.usuario.createMany({
    data: usuarios,
    skipDuplicates: true,
  });

  console.log("Usuarios insertados correctamente");
}

module.exports = { insertUsuarios };