const prisma = require("../config/database");

async function insertArchivos() {
  const archivos = [
    // Consulta 1 (caries)
    {
      id_consulta: 1,
      nombre: "radiografia_molares_16_26.png",
      categoria: "Radiografia",
      url: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQJ1z0EYErCJmj2IJoY6IhLYK1FwoNxlyY7Hg&s",
    },
    {
      id_consulta: 1,
      nombre: "foto_caries_inicial.jpg",
      categoria: "Imagen",
      url: "https://www.dentsplysirona.com/es-es/descubrir/descubrir-por-temas/categorias/restauracion/causas-de-la-caries-recurrente/_jcr_content/root/container/dentsplycontainer_11/dentsplycontainer/image_2146770307.coreimg.70.1000.jpeg/1739814766085/res-clinical-image-secondary-caries-square.jpeg",
    },

    // Consulta 2 (endodoncia)
    {
      id_consulta: 2,
      nombre: "radiografia_endodoncia_14_24.png",
      categoria: "Radiografia",
      url: "https://cioarturosoria.com/wp-content/uploads/2024/06/CIO_junio2024_endodoncia_1-1080x675.jpg",
    },
    {
      id_consulta: 2,
      nombre: "tomografia_premolares.dcm",
      categoria: "Tomografia",
      url: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSYg7HRriApkIh7t4IHHQgSI_rNj0s9bs3BTw&s",
    },

    // Consulta 3 (prótesis)
    {
      id_consulta: 3,
      nombre: "imagen_impresion_protesis.jpg",
      categoria: "Imagen",
      url: "https://storage.clinica.com/imagenes/impresion_protesis.jpg",
    },

    // Consulta 4 (revisión general)
    {
      id_consulta: 4,
      nombre: "foto_post_limpieza.jpg",
      categoria: "Imagen",
      url: "https://storage.clinica.com/imagenes/post_limpieza.jpg",
    },

    // Consulta 5 (implante)
    {
      id_consulta: 5,
      nombre: "tomografia_implante_36.dcm",
      categoria: "Tomografia",
      url: "https://storage.clinica.com/tomografias/implante_36.dcm",
    },
    {
      id_consulta: 5,
      nombre: "radiografia_control_implante.png",
      categoria: "Radiografia",
      url: "https://storage.clinica.com/radiografias/control_implante.png",
    },
  ];

  await prisma.archivo.createMany({
    data: archivos,
    skipDuplicates: true,
  });

  console.log("Archivos insertados correctamente");
}

module.exports = { insertArchivos };