export function buildNotificacionCitaCanceladaEmail(
  doctorNombre: string,
  pacienteNombre: string,
  fechaCita: Date,
  citaId: number,
): string {
  const fechaStr = fechaCita.toLocaleDateString('es-HN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'America/Tegucigalpa',
  });
  const horaStr = fechaCita.toLocaleTimeString('es-HN', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Tegucigalpa',
  });
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const citaUrl = `${frontendUrl}/agenda/${citaId}`;

  return `
  <div style="font-family: Arial, sans-serif; background:#f4f9fb; padding:30px;">
    <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 10px 25px rgba(0,0,0,0.08);">

      <!-- Header -->
      <div style="background:linear-gradient(135deg,#E24B4A,#203F49);padding:20px;text-align:center;color:white;">
        <h2 style="margin:0;font-size:22px;letter-spacing:0.5px;">WebArco Dental Studio</h2>
        <p style="margin:5px 0 0;font-size:13px;opacity:0.9;">❌ Cita Cancelada por el Paciente</p>
      </div>

      <!-- Body -->
      <div style="padding:30px; color:#333;">
        <h3 style="margin-top:0;color:#203F49;font-size:18px;">Aviso de Cancelación, Dr. ${doctorNombre}</h3>

        <p style="font-size:15px;line-height:1.6;color:#5F656A;">
          El paciente <b>${pacienteNombre}</b> ha <b style="color:#E24B4A;">cancelado</b> su cita del ${fechaStr}. 
          Se requiere reagendamiento.
        </p>

        <!-- Info box -->
        <div style="background:#FEF2F2;padding:20px;border-radius:8px;margin:25px 0;border-left:4px solid #E24B4A;">
          <p style="margin:0 0 10px;font-size:14px;color:#203F49;">
            <strong>👤 Paciente:</strong> ${pacienteNombre}
          </p>
          <p style="margin:0 0 10px;font-size:14px;color:#203F49;">
            <strong style="display:inline-block;width:70px;">📅 Fecha:</strong> <span style="text-transform:capitalize;">${fechaStr}</span>
          </p>
          <p style="margin:0;font-size:14px;color:#203F49;">
            <strong style="display:inline-block;width:70px;">⏰ Hora:</strong> ${horaStr}
          </p>
          <p style="margin:10px 0 0;font-size:13px;color:#E24B4A;font-weight:600;">
            ❌ Estado: Cancelada — pendiente de reagendar
          </p>
        </div>

        <!-- CTA -->
        <div style="text-align:center;margin-top:25px;margin-bottom:15px;">
          <a href="${citaUrl}" style="display:inline-block;background:linear-gradient(135deg,#E24B4A,#203F49);color:white;padding:14px 32px;text-decoration:none;border-radius:8px;font-weight:bold;font-size:15px;">
            Ver Detalle de la Cita
          </a>
        </div>

        <p style="font-size:13px;line-height:1.6;color:#888F94;margin-top:20px;text-align:center;">
          Este es un aviso automático del sistema WebArco Dental Studio.
        </p>
      </div>

      <!-- Footer -->
      <div style="text-align:center;padding:20px;font-size:12px;color:#888F94;background:#F8F9FA;">
        © ${new Date().getFullYear()} WebArco Dental Studio - Todos los derechos reservados
      </div>
    </div>
  </div>
  `;
}
