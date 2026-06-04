const prisma = require("../config/database");

async function insertAntecedentesPreguntas(){
    const antecendetespreguntas = [
        {
            pregunta: "¿Enfermedad de base?",
            orden_num: 1,
        },
        {
            pregunta: "¿Toma algún medicamento?",
            orden_num: 2,
        },
        {
            pregunta: "¿Alergías a medicamentos o comidas?",
            orden_num: 3,
        },
        {
            pregunta: "¿Actualmente se encuentra bajo tratamiento médico?",
            orden_num: 4,
        },
        {
            pregunta: "¿Cuando fue su última visita al odontólogo ?",
            orden_num: 5,
        },
        {
            pregunta: "¿Motivo de consulta?",
            orden_num: 6,
        },
    ];

    prisma.antecedentePregunta.createMany({data: antecendetespreguntas});
    console.log("Antecendente-Pregunta insertados correctamente");
}

module.exports = {insertAntecedentesPreguntas}