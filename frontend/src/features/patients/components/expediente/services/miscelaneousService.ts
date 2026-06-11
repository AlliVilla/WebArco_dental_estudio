export const calcularEdad = (fechaNacimiento: string | Date) => {
  const hoy = new Date();
  const nacimiento = new Date(fechaNacimiento);

  let edad = hoy.getFullYear() - nacimiento.getFullYear();

  const mes = hoy.getMonth() - nacimiento.getMonth();

  // si aún no ha cumplido años este año
  if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
    edad--;
  }

  return edad;
};

export const formatDate = (date: Date) => {
  if (!date) return '';
  return new Date(date).toISOString().split('T')[0];
};