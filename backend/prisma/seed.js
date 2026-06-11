require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const { insertDepartamentos } =   require("./seeders/departamento");
const { insertMunicipios } = require("./seeders/municipios");
const { insertRoles } = require("./seeders/roles");
const { insertPrivilegios } = require("./seeders/privilegios");
const { insertRolesPrivilegios} = require("./seeders/rolesprivilegios");
const { insertPersonas } = require("./seeders/persona");
const { insertUsuarios } = require("./seeders/usuarios");
const { insertAntecedentesPreguntas } = require("./seeders/antecendentespreguntas");
const { insertDientes } = require("./seeders/dientes");  
const { insertCategoriasInsumo } = require("./seeders/categorias-insumo");
const { insertUnidadesMedida } = require("./seeders/unidades-medida");
const { insertConsultas } = require("./seeders/consultas");
const { insertOdontograma } = require("./seeders/odontograma");
const { insertTratamientos } = require("./seeders/tratamiento");
const { insertConsultaTratamientos } = require("./seeders/consulta-tratamiento");


async function insertSeeder(){
    try{
        await insertDientes();
        await insertCategoriasInsumo();
        await insertUnidadesMedida();
        await insertAntecedentesPreguntas();
        await insertRoles();
        await insertPrivilegios();
        await insertRolesPrivilegios();
        await insertDepartamentos();
        await insertMunicipios();
        await insertPersonas();
        await insertUsuarios();
        await insertConsultas();
        await insertOdontograma();
        await insertTratamientos();
        await insertConsultaTratamientos();
        console.log("Seeder realizado exitosamente")
    }catch(error){
        console.error("Error:", error);
    }
}

insertSeeder();