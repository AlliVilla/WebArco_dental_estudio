require('dotenv').config({
  path: require('path').join(__dirname, '..', '.env'),
});
const { hashPassword } = require('./utils/bcrypt');
const prisma = require('./config/database');

async function main() {
  const id_persona = Number(process.env.ADMIN_PERSON_ID);
  const username = process.env.ADMIN_USERNAME;
  // Use a secret manager or a protected environment; never a command-line argument.
  const password = process.env.ADMIN_INITIAL_PASSWORD;
  if (
    !Number.isSafeInteger(id_persona) ||
    id_persona <= 0 ||
    !username ||
    !password ||
    password.length < 20
  ) {
    throw new Error(
      'Configurar ADMIN_PERSON_ID, ADMIN_USERNAME y ADMIN_INITIAL_PASSWORD aleatoria (mínimo 20 caracteres)',
    );
  }
  const role = await prisma.rol.findFirst({
    where: {
      nombre: { equals: 'Administrador', mode: 'insensitive' },
      activo: true,
    },
  });
  if (!role) throw new Error('Inicializar primero los catálogos');
  await prisma.usuario.create({
    data: {
      id_persona,
      username,
      password: await hashPassword(password),
      id_rol: role.id_rol,
      must_change_password: true,
    },
  });
  console.log(
    'Administrador creado; cambio de contraseña obligatorio. No se modificaron cuentas existentes.',
  );
}
main()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
