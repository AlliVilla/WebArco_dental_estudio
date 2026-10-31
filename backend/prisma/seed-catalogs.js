require('dotenv').config({
  path: require('path').join(__dirname, '..', '.env'),
});
const prisma = require('./config/database');

async function main() {
  // Only reference data: no persons, accounts, appointments, files or payments.
  const steps = [
    ['dientes', 'insertDientes'],
    ['categorias-insumo', 'insertCategoriasInsumo'],
    ['unidades-medida', 'insertUnidadesMedida'],
    ['roles', 'insertRoles'],
    ['privilegios', 'insertPrivilegios'],
    ['rolesprivilegios', 'insertRolesPrivilegios'],
    ['departamento', 'insertDepartamentos'],
    ['municipios', 'insertMunicipios'],
    ['estado-odontograma', 'insertEstadosOdontograma'],
    ['especialidad', 'insertEspecialidades'],
    ['tratamiento', 'insertTratamientos'],
    ['consulta-preguntas', 'insertConsultaPreguntas'],
  ];
  for (const [file, fn] of steps) await require(`./seeders/${file}`)[fn]();
}
main()
  .catch(() => {
    console.error('Falló la inicialización de catálogos');
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
