require('dotenv').config({
  path: require('path').join(__dirname, '..', '.env'),
  quiet: true,
});

async function bootstrapRender(prisma, env, seedCatalogs, hashPassword) {
  if (env.BOOTSTRAP_ADMIN_ENABLED !== 'true') return 'disabled';

  const username = env.ADMIN_USERNAME;
  const password = env.ADMIN_INITIAL_PASSWORD;
  if (!username || !/^[A-Za-z0-9._-]{3,100}$/.test(username)) {
    throw new Error(
      'Configurar ADMIN_USERNAME con 3–100 letras, números, puntos, guiones o guiones bajos',
    );
  }
  if (
    !password ||
    password.length < 20 ||
    Buffer.byteLength(password) > 72 ||
    !/[a-z]/.test(password) ||
    !/[A-Z]/.test(password) ||
    !/[0-9]/.test(password) ||
    !/[^A-Za-z0-9]/.test(password)
  ) {
    throw new Error(
      'ADMIN_INITIAL_PASSWORD requiere mínimo 20 caracteres, mayúsculas, minúsculas, números y símbolo; máximo 72 bytes',
    );
  }

  return prisma.$transaction(
    async (tx) => {
      // Coordinate concurrent starts. No publicly accessible provisioning endpoint.
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(31740319)`;
      const existing = await tx.usuario.findUnique({
        where: { username },
        include: { rol: true },
      });
      if (existing) {
        if (
          !existing.activo ||
          !existing.rol.activo ||
          existing.rol.nombre.toLowerCase() !== 'administrador'
        ) {
          throw new Error(
            'La cuenta indicada ya existe y no es un administrador activo; no se modificó',
          );
        }
        return 'existing';
      }
      if ((await tx.usuario.count()) !== 0) {
        throw new Error(
          'El aprovisionamiento inicial exige una base sin usuarios; no se modificaron cuentas existentes',
        );
      }

      // Reference seeders use their shared Prisma client. Each is safe to retry.
      await seedCatalogs();
      const role = await tx.rol.findFirst({
        where: { nombre: 'Administrador', activo: true },
      });
      const municipio = await tx.municipio.findFirst({
        orderBy: { id_municipio: 'asc' },
      });
      if (!role || !municipio)
        throw new Error(
          'Los catálogos de administrador o municipio no están disponibles',
        );
      const persona = await tx.persona.create({
        data: {
          numero_identidad: '0000000000001',
          primer_nombre: 'Administrador',
          primer_apellido: 'Pruebas',
          fecha_nacimiento: new Date('1990-01-01T00:00:00Z'),
          telefono: '00000000',
          correo_electronico: 'admin.render@example.invalid',
          id_municipio: municipio.id_municipio,
          sexo: 'M',
        },
      });
      await tx.usuario.create({
        data: {
          id_persona: persona.id_persona,
          username,
          password: await hashPassword(password),
          id_rol: role.id_rol,
          activo: true,
          must_change_password: true,
        },
      });
      return 'created';
    },
    { timeout: 120000, maxWait: 10000 },
  );
}

async function main() {
  if (process.env.BOOTSTRAP_ADMIN_ENABLED !== 'true') {
    console.log('Aprovisionamiento inicial deshabilitado.');
    return;
  }
  const prisma = require('./config/database');
  try {
    const { seedCatalogs } = require('./seed-catalogs');
    const { hashPassword } = require('./utils/bcrypt');
    const status = await bootstrapRender(
      prisma,
      process.env,
      seedCatalogs,
      hashPassword,
    );
    console.log(
      status === 'created'
        ? 'Catálogos y administrador inicial creados; cambio de contraseña obligatorio.'
        : 'El administrador inicial ya existe; su contraseña y datos se conservaron.',
    );
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main().catch((error) => {
    // Prisma errors can include query input. Never log them or credentials.
    console.error(
      error.name === 'Error'
        ? error.message
        : 'Falló el aprovisionamiento inicial; revisar configuración y estado de la base.',
    );
    process.exitCode = 1;
  });
}

module.exports = { bootstrapRender };
