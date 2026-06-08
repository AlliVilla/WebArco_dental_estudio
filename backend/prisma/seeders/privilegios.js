const prisma = require("../config/database");

async function insertPrivilegios() {
  const privilegios = [
    { nombre: "DASHBOARD_GENERAL" },
    { nombre: "DASHBOARD_FINANCIERO" },

    { nombre: "ODONTOGRAMA_VER" },
    { nombre: "ODONTOGRAMA_EDITAR" },
    { nombre: "ODONTOGRAMA_HISTORIAL" },

    { nombre: "USUARIOS_VER" },
    { nombre: "USUARIOS_CREAR" },
    { nombre: "USUARIOS_EDITAR" },
    { nombre: "USUARIOS_PERFIL" },

    { nombre: "FINANCIERO_INGRESO_CREAR" },
    { nombre: "FINANCIERO_EGRESO_CREAR" },
    { nombre: "FINANCIERO_VER_INGRESOS" },
    { nombre: "FINANCIERO_VER_EGRESOS" },

    { nombre: "CIERRES_CREAR" },
    { nombre: "CIERRES_VER" },

    { nombre: "PACIENTES_VER" },
    { nombre: "PACIENTES_CREAR" },
    { nombre: "PACIENTES_EDITAR" },
    { nombre: "PACIENTES_BUSCAR" },

    { nombre: "EXPEDIENTE_VER" },
    { nombre: "EXPEDIENTE_REGISTRAR_ATENCION" },

    { nombre: "CONSENTIMIENTOS_CREAR" },
    { nombre: "CONSENTIMIENTOS_FIRMAR_PACIENTE" },
    { nombre: "CONSENTIMIENTOS_FIRMAR_DOCTOR" },
    { nombre: "CONSENTIMIENTOS_VER" },

    { nombre: "CITAS_VER" },
    { nombre: "CITAS_CREAR" },
    { nombre: "CITAS_EDITAR" },
    { nombre: "CITAS_DETALLE" },

    { nombre: "RECORDATORIOS_VER" },
    { nombre: "RECORDATORIOS_HISTORIAL" },
    { nombre: "RECORDATORIOS_RESPONDER" },

    { nombre: "FOOTER_VER" },

    { nombre: "ROL_VER" },
    { nombre: "ROL_CREAR" },
    { nombre: "ROL_EDITAR" },

    { nombre: "PRIVILEGIO_VER" },

    { nombre: "ANTECEDENTES_VER" },
    { nombre: "ANTECEDENTES_CREAR" },
    { nombre: "ANTECEDENTES_EDITAR" },

    { nombre: "CONSULTAS_VER" },
    { nombre: "CONSULTAS_CREAR" },
    { nombre: "CONSULTAS_EDITAR" },
    { nombre: "CONSULTAS_ELIMINAR" },

    { nombre: "CITAS_ELIMINAR" },
  ];

  await prisma.privilegio.createMany({
    data: privilegios,
    skipDuplicates: true,
  });

  console.log("Privilegios insertados correctamente");
}

module.exports = { insertPrivilegios };