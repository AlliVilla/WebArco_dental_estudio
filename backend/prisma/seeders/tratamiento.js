const prisma = require("../config/database");

async function insertTratamientos() {
  const tratamientos = [
    // 1 - Odontología General
    { id_especialidad: 1, nombre: "Consulta inicial", descripcion: "Evaluación completa del paciente", precio: 350.00 },
    { id_especialidad: 1, nombre: "Valoración general", descripcion: "Revisión bucal básica", precio: 250.00 },
    { id_especialidad: 1, nombre: "Toma de radiografías", descripcion: "Radiografías periapicales o panorámicas", precio: 400.00 },
    // 2 - Odontología General y Preventiva
    { id_especialidad: 2, nombre: "Profilaxis dental", descripcion: "Limpieza dental profesional", precio: 500.00 },
    { id_especialidad: 2, nombre: "Aplicación de flúor", descripcion: "Tratamiento tópico con flúor", precio: 300.00 },
    { id_especialidad: 2, nombre: "Selladores de fosetas y fisuras", descripcion: "Aplicación de selladores por pieza", precio: 250.00 },
    { id_especialidad: 2, nombre: "Revisión periódica", descripcion: "Control de rutina", precio: 200.00 },
    // 3 - Odontología Especializada
    { id_especialidad: 3, nombre: "Examen especializado", descripcion: "Evaluación por especialista", precio: 500.00 },
    { id_especialidad: 3, nombre: "Diagnóstico avanzado", descripcion: "Estudio completo con imágenes", precio: 800.00 },
    // 4 - Odontología Estética
    { id_especialidad: 4, nombre: "Blanqueamiento dental", descripcion: "Blanqueamiento ambulatorio con cubetas", precio: 3500.00 },
    { id_especialidad: 4, nombre: "Carillas de porcelana", descripcion: "Carillas estéticas por pieza", precio: 2500.00 },
    { id_especialidad: 4, nombre: "Resina estética", descripcion: "Restauración estética con resina por pieza", precio: 800.00 },
    { id_especialidad: 4, nombre: "Contorno estético", descripcion: "Recontorno de encías y piezas dentales", precio: 1200.00 },
    // 5 - Ortodoncia
    { id_especialidad: 5, nombre: "Diagnóstico ortodóntico", descripcion: "Estudio completo de ortodoncia (modelos, radiografías, fotos)", precio: 1500.00 },
    { id_especialidad: 5, nombre: "Colocación de brackets metálicos", descripcion: "Tratamiento completo con brackets metálicos", precio: 18000.00 },
    { id_especialidad: 5, nombre: "Colocación de brackets estéticos", descripcion: "Tratamiento completo con brackets de porcelana", precio: 22000.00 },
    { id_especialidad: 5, nombre: "Mantenimiento ortodóntico", descripcion: "Ajuste mensual de ortodoncia", precio: 800.00 },
    { id_especialidad: 5, nombre: "Retenedores", descripcion: "Retenedores fijos o removibles por arcada", precio: 2500.00 },
    // 6 - Ortodoncia y Ortopedia Maxilar
    { id_especialidad: 6, nombre: "Ortopedia maxilar funcional", descripcion: "Tratamiento ortopédico con dispositivos funcionales", precio: 15000.00 },
    { id_especialidad: 6, nombre: "Expansor palatino", descripcion: "Dispositivo de expansión maxilar", precio: 5000.00 },
    { id_especialidad: 6, nombre: "Máscara facial", descripcion: "Ortopedia con máscara facial para protracción", precio: 6000.00 },
    // 7 - Cirugía Bucal e Implantología
    { id_especialidad: 7, nombre: "Extracción simple", descripcion: "Extracción de pieza dental", precio: 600.00 },
    { id_especialidad: 7, nombre: "Extracción compleja", descripcion: "Extracción quirúrgica o cordal incluido", precio: 1500.00 },
    { id_especialidad: 7, nombre: "Colocación de implante", descripcion: "Implante osteointegrado por pieza", precio: 12000.00 },
    { id_especialidad: 7, nombre: "Elevación de seno maxilar", descripcion: "Procedimiento de elevación sinusal", precio: 8000.00 },
    { id_especialidad: 7, nombre: "Injerto óseo", descripcion: "Injerto óseo para rehabilitación implantológica", precio: 7500.00 },
    // 8 - Prótesis
    { id_especialidad: 8, nombre: "Corona de porcelana", descripcion: "Corona individual libre de metal", precio: 4500.00 },
    { id_especialidad: 8, nombre: "Corona de zirconio", descripcion: "Corona de alta estética en zirconio", precio: 6000.00 },
    { id_especialidad: 8, nombre: "Puente de 3 unidades", descripcion: "Puente fijo de 3 piezas", precio: 12000.00 },
    // 9 - Prótesis y Rehabilitación Oral
    { id_especialidad: 9, nombre: "Prótesis total superior", descripcion: "Dentadura completa superior", precio: 8000.00 },
    { id_especialidad: 9, nombre: "Prótesis total inferior", descripcion: "Dentadura completa inferior", precio: 8000.00 },
    { id_especialidad: 9, nombre: "Prótesis parcial removible", descripcion: "Base metálica con ganchos por arcada", precio: 5500.00 },
    { id_especialidad: 9, nombre: "Sobredentadura", descripcion: "Prótesis sobre implantes", precio: 15000.00 },
    // 10 - Endodoncia
    { id_especialidad: 10, nombre: "Endodoncia unirradicular", descripcion: "Tratamiento de conducto en pieza de 1 raíz", precio: 2500.00 },
    { id_especialidad: 10, nombre: "Endodoncia birradicular", descripcion: "Tratamiento de conducto en pieza de 2 raíces", precio: 3000.00 },
    { id_especialidad: 10, nombre: "Endodoncia multirradicular", descripcion: "Tratamiento de conducto en pieza de 3 raíces o más", precio: 3500.00 },
    { id_especialidad: 10, nombre: "Retratamiento endodóntico", descripcion: "Nuevo tratamiento de conducto", precio: 4000.00 },
    // 11 - Periodoncia
    { id_especialidad: 11, nombre: "Raspado y alisado radicular", descripcion: "Limpieza profunda por cuadrante", precio: 800.00 },
    { id_especialidad: 11, nombre: "Curetaje periodontal", descripcion: "Curetaje abierto o cerrado por cuadrante", precio: 1200.00 },
    { id_especialidad: 11, nombre: "Cirugía periodontal", descripcion: "Colgajo periodontal por cuadrante", precio: 2500.00 },
    { id_especialidad: 11, nombre: "Injerto de encía", descripcion: "Injerto gingival por pieza", precio: 3000.00 },
    // 12 - Cirugía Oral
    { id_especialidad: 12, nombre: "Frenectomía", descripcion: "Eliminación de frenillo labial o lingual", precio: 2000.00 },
    { id_especialidad: 12, nombre: "Quiste maxilar", descripcion: "Enucleación de quiste maxilar", precio: 4000.00 },
    { id_especialidad: 12, nombre: "Biopsia de tejido blando", descripcion: "Toma de muestra para análisis histopatológico", precio: 1500.00 },
    { id_especialidad: 12, nombre: "Cirugía de cordales", descripcion: "Extracción quirúrgica de terceros molares incluidos", precio: 1800.00 },
  ];

  for (const t of tratamientos) {
    const exists = await prisma.tratamiento.findFirst({
      where: { nombre: t.nombre, id_especialidad: t.id_especialidad },
    });
    if (!exists) {
      await prisma.tratamiento.create({ data: t });
    }
  }

  console.log(`${tratamientos.length} tratamientos verificados/insertados correctamente`);
}

module.exports = { insertTratamientos };
