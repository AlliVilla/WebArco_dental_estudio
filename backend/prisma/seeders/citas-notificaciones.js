const prisma = require("../config/database");

async function insertCitasNotificaciones() {
  // Asegurarnos de que el doctor (usuario 4), la admin (usuario 2) y un paciente (persona 1) existan
  const doctor = await prisma.usuario.findUnique({ where: { id_usuario: 4 } });
  const admin = await prisma.usuario.findUnique({ where: { id_usuario: 2 }, include: { persona: true } });
  const paciente = await prisma.persona.findUnique({ where: { id_persona: 1 } });

  if (!doctor || !paciente || !admin) {
    console.log("[seed] Doctores, admins o pacientes no encontrados, omitiendo citas");
    return;
  }

  // 1. Configuración de notificaciones para el doctor y admin
  await prisma.configuracionNotificaciones.upsert({
    where: { id_usuario: doctor.id_usuario },
    update: {},
    create: {
      id_usuario: doctor.id_usuario,
      minutos_anticipacion: 60,
      email_notificaciones: true,
    },
  });

  await prisma.configuracionNotificaciones.upsert({
    where: { id_usuario: admin.id_usuario },
    update: {},
    create: {
      id_usuario: admin.id_usuario,
      minutos_anticipacion: 60,
      email_notificaciones: true,
    },
  });

  // 2. Crear Citas
  const ahora = new Date();

  function getWorkingDate(offsetDays, hour) {
    const d = new Date(ahora);
    d.setDate(d.getDate() + offsetDays);
    while (d.getDay() === 0 || d.getDay() === 6) {
      d.setDate(d.getDate() + (offsetDays >= 0 ? 1 : -1));
    }
    d.setHours(hour, 0, 0, 0);
    return d;
  }

  // Cita programada (10:00 AM)
  const proximaCita = getWorkingDate(0, 10);
  
  // Cita confirmada (14:00)
  const mananaCita = getWorkingDate(1, 14);

  // Cita reprogramada (09:00)
  const pasadaCita = getWorkingDate(-2, 9);

  // Cita nueva (11:00 AM)
  const cuartaCita = getWorkingDate(2, 11);

  const citas = [
    {
      id_persona: paciente.id_persona,
      id_usuario: doctor.id_usuario,
      fecha_inicio: proximaCita,
      fecha_fin: new Date(proximaCita.getTime() + 60 * 60 * 1000), // 1 hora
      tipo_cita: "Revisión General",
      motivo: "Dolor en molar inferior",
      estado: "programada",
    },
    {
      id_persona: paciente.id_persona,
      id_usuario: doctor.id_usuario,
      fecha_inicio: mananaCita,
      fecha_fin: new Date(mananaCita.getTime() + 60 * 60 * 1000), // 1 hora
      tipo_cita: "Limpieza",
      motivo: "Limpieza anual",
      estado: "confirmada",
    },
    {
      id_persona: paciente.id_persona,
      id_usuario: doctor.id_usuario,
      fecha_inicio: pasadaCita,
      fecha_fin: new Date(pasadaCita.getTime() + 120 * 60 * 1000), // 2 horas
      tipo_cita: "Extracción",
      motivo: "Extracción de cordal",
      estado: "reprogramada", // equivale a cancelada en la app
    },
    {
      id_persona: paciente.id_persona,
      id_usuario: doctor.id_usuario,
      fecha_inicio: cuartaCita,
      fecha_fin: new Date(cuartaCita.getTime() + 60 * 60 * 1000), // 1 hora
      tipo_cita: "Ortodoncia",
      motivo: "Ajuste mensual de brackets",
      estado: "programada",
    }
  ];

  for (const citaData of citas) {
    // Verificar si ya existe una cita similar para evitar duplicados en multiples ejecuciones del seeder
    const existe = await prisma.cita.findFirst({
      where: {
        id_persona: citaData.id_persona,
        id_usuario: citaData.id_usuario,
        tipo_cita: citaData.tipo_cita,
        estado: citaData.estado,
      }
    });

    if (!existe) {
      await prisma.cita.create({ data: citaData });
    }
  }

  console.log("Citas semilla insertadas correctamente");
}

module.exports = { insertCitasNotificaciones };
