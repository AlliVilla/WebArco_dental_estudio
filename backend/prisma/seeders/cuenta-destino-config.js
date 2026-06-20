const prisma = require("../config/database");

const cuentasDestino = [
  { tipo: 'TARJETA', nombre: 'BAC', comision: 2.5 },
  { tipo: 'TARJETA', nombre: 'Ficohsa', comision: 2.5 },
  { tipo: 'TARJETA', nombre: 'Banpaís', comision: 2.5 },
  { tipo: 'TRANSFERENCIA', nombre: 'BAC - Cuenta Principal', comision: 0 },
  { tipo: 'TRANSFERENCIA', nombre: 'Ficohsa - Cuenta Clínica', comision: 0 },
  { tipo: 'TRANSFERENCIA', nombre: 'Banpaís - Cuenta Secundaria', comision: 0 },
];

async function insertCuentasDestino() {
  for (const item of cuentasDestino) {
    await prisma.cuentaDestinoConfig.upsert({
      where: { tipo_nombre: { tipo: item.tipo, nombre: item.nombre } },
      update: { activo: true, comision: item.comision ?? null },
      create: item,
    });
  }
  console.log('Cuentas destino insertadas/actualizadas correctamente');
}

module.exports = { insertCuentasDestino };
