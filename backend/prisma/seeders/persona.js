const prisma = require("../config/database");

async function insertPersonas() {
  const personas = [
    { numero_identidad: "0000000000001", primer_nombre: "Juan", primer_apellido: "Pérez", fecha_nacimiento: new Date("1980-01-01"), telefono: "12345678", id_municipio: 1, sexo: "M" },
    { numero_identidad: "0000000000002", primer_nombre: "Maria", primer_apellido: "Admin", fecha_nacimiento: new Date("1985-01-01"), telefono: "12345678", id_municipio: 1, sexo: "F" },
    { numero_identidad: "0000000000003", primer_nombre: "Carlos", primer_apellido: "Contador", fecha_nacimiento: new Date("1990-01-01"), telefono: "12345678", id_municipio: 1, sexo: "M" },
    { numero_identidad: "0000000000004", primer_nombre: "Ana", primer_apellido: "Doctor", fecha_nacimiento: new Date("1992-01-01"), telefono: "12345678", id_municipio: 1, sexo: "F" },
    { numero_identidad: "0000000000005", primer_nombre: "Luis", primer_apellido: "Recepcion", fecha_nacimiento: new Date("1995-01-01"), telefono: "12345678", id_municipio: 1, sexo: "M" },
  ];
  await prisma.persona.createMany({ data: personas, skipDuplicates: true });
  console.log("Personas insertadas correctamente");
}

module.exports = { insertPersonas };
