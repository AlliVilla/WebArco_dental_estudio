const prisma = require("../config/database");

const cuentasDestino = [
  { tipo: 'TARJETA', nombre: 'BAC' },
  { tipo: 'TARJETA', nombre: 'Ficohsa' },
  { tipo: 'TARJETA', nombre: 'Banpaís' },
  { tipo: 'TRANSFERENCIA', nombre: 'BAC - Cuenta Principal' },
  { tipo: 'TRANSFERENCIA', nombre: 'Ficohsa - Cuenta Clínica' },
  { tipo: 'TRANSFERENCIA', nombre: 'Banpaís - Cuenta Secundaria' },
];

async function insertCuentasDestino() {
  for (const item of cuentasDestino) {
    await prisma.cuentaDestinoConfig.upsert({
      where: { tipo_nombre: { tipo: item.tipo, nombre: item.nombre } },
      update: { activo: true },
      create: item,
    });
  }
  console.log('Cuentas destino insertadas/actualizadas correctamente');
}

module.exports = { insertCuentasDestino };
