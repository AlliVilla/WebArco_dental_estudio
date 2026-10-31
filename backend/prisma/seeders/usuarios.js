const prisma = require('../config/database');
const { randomBytes } = require('crypto');
const { hashPassword } = require('../utils/bcrypt');

async function insertUsuarios() {
  if (
    process.env.NODE_ENV === 'production' ||
    process.env.SEED_DEMO_DATA !== 'true'
  ) {
    throw new Error(
      'Las cuentas de demostración requieren SEED_DEMO_DATA=true y un entorno no productivo',
    );
  }
  const usuarios = [
    {
      id_persona: 1,
      username: 'juan.specialist',
      password: await hashPassword(randomBytes(32).toString('base64url')),
      id_rol: 1,
      must_change_password: true,
    },
    {
      id_persona: 2,
      username: 'maria.admin',
      password: await hashPassword(randomBytes(32).toString('base64url')),
      id_rol: 2,
      must_change_password: true,
    },
    {
      id_persona: 3,
      username: 'carlos.contador',
      password: await hashPassword(randomBytes(32).toString('base64url')),
      id_rol: 3,
      must_change_password: true,
    },
    {
      id_persona: 4,
      username: 'ana.doctor',
      password: await hashPassword(randomBytes(32).toString('base64url')),
      id_rol: 4,
      must_change_password: true,
    },
    {
      id_persona: 5,
      username: 'luis.recepcion',
      password: await hashPassword(randomBytes(32).toString('base64url')),
      id_rol: 5,
      must_change_password: true,
    },
  ];

  await prisma.usuario.createMany({
    data: usuarios,
    skipDuplicates: true,
  });

  console.log('Usuarios insertados correctamente');
}

module.exports = { insertUsuarios };
