require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const { insertDepartamentos } =   require("./seeders/departamento");
const { insertMunicipios } = require("./seeders/municipios");
const { insertRoles } = require("./seeders/roles");
const { insertPrivilegios } = require("./seeders/privilegios");
const { insertRolesPrivilegios} = require("./seeders/rolesprivilegios");
const { insertUsuarios } = require("./seeders/usuarios");
const { insertDientes } = require("./seeders/dientes");  
const { insertCategoriasInsumo } = require("./seeders/categorias-insumo");
const { insertUnidadesMedida } = require("./seeders/unidades-medida");

async function insertSeeder(){
    try{
        await insertDientes();
        await insertCategoriasInsumo();
        await insertUnidadesMedida();
        await insertRoles();
        await insertPrivilegios();
        await insertRolesPrivilegios();
        await insertDepartamentos();
        await insertMunicipios();
        await insertUsuarios();
        console.log("Seeder realizado exitosamente")
    }catch(error){
        console.error("Error:", error);
    }
}

insertSeeder();