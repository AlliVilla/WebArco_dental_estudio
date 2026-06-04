const prisma = require("../config/database");

async function insertPersonas() {
  const personas = [
    {
      numero_identidad: "0501200000001",
      primer_nombre: "Juan",
      segundo_nombre: "Carlos",
      primer_apellido: "López",
      segundo_apellido: "Martínez",
      fecha_nacimiento: new Date("1995-04-12"),
      telefono: "88889991",
      correo_electronico: "juan.lopez@gmail.com",
      id_ciudad: 1,
      id_departamento: 1,
      direccion_linea: "Barrio El Centro, frente al parque principal",
      sexo: "M",
    },
    {
      numero_identidad: "0501200000002",
      primer_nombre: "María",
      segundo_nombre: "Fernanda",
      primer_apellido: "García",
      segundo_apellido: "Hernández",
      fecha_nacimiento: new Date("1998-09-25"),
      telefono: "88889992",
      correo_electronico: "maria.fernanda@gmail.com",
      id_ciudad: 1,
      id_departamento: 1,
      direccion_linea: "Colonia San José, casa color azul cerca de la escuela",
      sexo: "F",
    },
    {
      numero_identidad: "0501200000003",
      primer_nombre: "Carlos",
      segundo_nombre: "Andrés",
      primer_apellido: "Ramírez",
      segundo_apellido: "Díaz",
      fecha_nacimiento: new Date("1992-01-18"),
      telefono: "88889993",
      correo_electronico: "carlos.ramirez@gmail.com",
      id_ciudad: 2,
      id_departamento: 1,
      direccion_linea: "Residencial Las Flores, bloque 3 apartamento 2",
      sexo: "M",
    },
    {
      numero_identidad: "0501200000004",
      primer_nombre: "Ana",
      segundo_nombre: "Lucía",
      primer_apellido: "Mendoza",
      segundo_apellido: "Castro",
      fecha_nacimiento: new Date("2000-06-30"),
      telefono: "88889994",
      correo_electronico: "ana.mendoza@gmail.com",
      id_ciudad: 2,
      id_departamento: 1,
      direccion_linea: "Barrio La Paz, dos cuadras del mercado municipal",
      sexo: "F",
    },
    {
      numero_identidad: "0501200000005",
      primer_nombre: "Luis",
      segundo_nombre: "Fernando",
      primer_apellido: "Santos",
      segundo_apellido: "Vargas",
      fecha_nacimiento: new Date("1987-11-03"),
      telefono: "88889995",
      correo_electronico: "luis.santos@gmail.com",
      id_ciudad: 3,
      id_departamento: 1,
      direccion_linea: "Colonia Vista Hermosa, calle principal casa 12",
      sexo: "M",
    },
  ];

  await prisma.persona.createMany({
    data: personas,
    skipDuplicates: true,
  });

  console.log("Personas insertadas correctamente");
}

module.exports = { insertPersonas };