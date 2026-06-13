const prisma = require("../config/database");

async function insertPrivilegios() {
  await prisma.rolPrivilegio.deleteMany();
  await prisma.privilegio.deleteMany();

  const privilegios = [
    { id_privilegio: 1, nombre: "DASHBOARD_GENERAL" },
    { id_privilegio: 2, nombre: "DASHBOARD_FINANCIERO" },

    { id_privilegio: 3, nombre: "ODONTOGRAMA_VER" },
    { id_privilegio: 4, nombre: "ODONTOGRAMA_GESTIONAR" },
    { id_privilegio: 5, nombre: "ODONTOGRAMA_HISTORIAL" },

    { id_privilegio: 6, nombre: "USUARIOS_VER" },
    { id_privilegio: 7, nombre: "USUARIOS_GESTIONAR" },
    { id_privilegio: 9, nombre: "USUARIOS_PERFIL" },

    { id_privilegio: 10, nombre: "FINANCIERO_GESTIONAR_INGRESOS" },
    { id_privilegio: 11, nombre: "FINANCIERO_GESTIONAR_EGRESOS" },
    { id_privilegio: 12, nombre: "FINANCIERO_VER_INGRESOS" },
    { id_privilegio: 13, nombre: "FINANCIERO_VER_EGRESOS" },

    { id_privilegio: 14, nombre: "CIERRES_GESTIONAR" },
    { id_privilegio: 15, nombre: "CIERRES_VER" },

    { id_privilegio: 16, nombre: "PACIENTES_VER" },
    { id_privilegio: 17, nombre: "PACIENTES_GESTIONAR" },

    { id_privilegio: 20, nombre: "EXPEDIENTE_VER" },
    { id_privilegio: 21, nombre: "EXPEDIENTE_GESTIONAR" },

    { id_privilegio: 22, nombre: "CONSENTIMIENTOS_GESTIONAR" },
    { id_privilegio: 25, nombre: "CONSENTIMIENTOS_VER" },

    { id_privilegio: 26, nombre: "CITAS_VER" },
    { id_privilegio: 27, nombre: "CITAS_GESTIONAR" },

    { id_privilegio: 30, nombre: "RECORDATORIOS_VER" },
    { id_privilegio: 31, nombre: "RECORDATORIOS_HISTORIAL" },
    { id_privilegio: 32, nombre: "RECORDATORIOS_RESPONDER" },

    { id_privilegio: 34, nombre: "ROL_VER" },
    { id_privilegio: 35, nombre: "ROL_GESTIONAR" },

    { id_privilegio: 37, nombre: "PRIVILEGIO_VER" },
    { id_privilegio: 38, nombre: "PRIVILEGIO_GESTIONAR" },

    { id_privilegio: 42, nombre: "CONSULTAS_VER" },
    { id_privilegio: 43, nombre: "CONSULTAS_GESTIONAR" },

    { id_privilegio: 62, nombre: "ES_DOCTOR" },
    { id_privilegio: 63, nombre: "INVENTARIO_VER" },
    { id_privilegio: 64, nombre: "INVENTARIO_GESTIONAR" },

    { id_privilegio: 65, nombre: "TRATAMIENTOS_VER" },
    { id_privilegio: 66, nombre: "TRATAMIENTOS_GESTIONAR" },
    { id_privilegio: 67, nombre: "ESTADO_ODONTOGRAMA_VER" },
    { id_privilegio: 68, nombre: "ESTADO_ODONTOGRAMA_GESTIONAR" },
  ];

  await prisma.privilegio.createMany({
    data: privilegios,
    skipDuplicates: false,
  });

  console.log("Privilegios insertados correctamente");
}

module.exports = { insertPrivilegios };
