require('dotenv').config({
  path: require('path').join(__dirname, '..', '.env'),
});

const { insertDepartamentos } = require('./seeders/departamento');
const { insertMunicipios } = require('./seeders/municipios');
const { insertRoles } = require('./seeders/roles');
const { insertPrivilegios } = require('./seeders/privilegios');
const { insertRolesPrivilegios } = require('./seeders/rolesprivilegios');
const { insertUsuarios } = require('./seeders/usuarios');
const { insertPersonas } = require('./seeders/persona');
const { insertDientes } = require('./seeders/dientes');
const { insertCategoriasInsumo } = require('./seeders/categorias-insumo');
const { insertUnidadesMedida } = require('./seeders/unidades-medida');
const { insertConsultas } = require('./seeders/consultas');
const { insertOdontograma } = require('./seeders/odontograma');
const { insertEspecialidades } = require('./seeders/especialidad');
const { insertEstadosOdontograma } = require('./seeders/estado-odontograma');
const { insertTratamientos } = require('./seeders/tratamiento');
const {
  insertTratamientosPaciente,
} = require('./seeders/tratamiento-paciente');
const { insertPagosConsulta } = require('./seeders/pago-consulta');
const {
  insertConsultaTratamientos,
} = require('./seeders/consulta-tratamiento');
const { insertArchivos } = require('./seeders/archivos');
const { insertCierres } = require('./seeders/cierres');
const { insertConsultaPreguntas } = require('./seeders/consulta-preguntas');
const { insertCitasNotificaciones } = require('./seeders/citas-notificaciones');
const { insertCuentasDestino } = require('./seeders/cuenta-destino-config');

async function insertSeeder() {
  if (
    process.env.NODE_ENV === 'production' ||
    process.env.SEED_DEMO_DATA !== 'true'
  ) {
    throw new Error(
      'Seed de demostración bloqueado: usar catálogos y provisionamiento explícitos',
    );
  }
  try {
    await insertDientes();
    await insertCategoriasInsumo();
    await insertUnidadesMedida();
    await insertRoles();
    await insertPrivilegios();
    await insertRolesPrivilegios();
    await insertDepartamentos();
    await insertMunicipios();
    await insertPersonas();
    await insertUsuarios();
    await insertConsultas();
    await insertArchivos();
    await insertOdontograma();
    await insertEstadosOdontograma();
    await insertConsultaPreguntas();
    await insertEspecialidades();
    await insertTratamientos();
    await insertTratamientosPaciente();
    await insertPagosConsulta();
    await insertConsultaTratamientos();
    await insertCierres();
    await insertCitasNotificaciones();
    await insertCuentasDestino();
    console.log('Seeder realizado exitosamente');
  } catch (error) {
    console.error('Error:', error);
    process.exitCode = 1;
  }
}

insertSeeder();
