const { insertDepartamentos } =   require("./seeders/departamento");
const {insertMunicipios } = require("./seeders/municipios");

async function insertSeeder(){
    try{
        await insertDepartamentos();
        await insertMunicipios();

        console.log("Seeder realizado exitosamente")
    }catch(error){
        console.error("Error:", error);
    }
}

insertSeeder();