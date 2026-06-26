const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const m = await prisma.municipio.findMany();
  console.log('Total municipios:', m.length);
  const m1 = await prisma.municipio.findMany({ where: { id_departamento: 1 }});
  console.log('Municipios en dept 1:', m1.length);
  console.log(m1.map(x => x.nombre));
}
main().catch(console.error).finally(() => prisma.$disconnect());
