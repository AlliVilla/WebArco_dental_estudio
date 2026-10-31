export function buildReminderEmail(
  pacienteNombre: string,
  fechaCita: Date,
  citaId: number,
  dynamicBaseUrl?: string,
  tokens?: { Confirmo: string; Cancelo: string },
): string {
  const fechaStr = fechaCita.toLocaleDateString('es-HN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const horaStr = fechaCita.toLocaleTimeString('es-HN', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const baseUrl = process.env.BACKEND_URL || 'http://localhost:3030';
  const confirmUrl = `${baseUrl}/webhooks/email-response/${citaId}?action=Confirmo&token=${tokens?.Confirmo || ''}`;
  const cancelUrl = `${baseUrl}/webhooks/email-response/${citaId}?action=Cancelo&token=${tokens?.Cancelo || ''}`;

  return `
  <div style="font-family: Arial, sans-serif; background:#f4f9fb; padding:30px;">

    <!-- Container -->
    <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 10px 25px rgba(0,0,0,0.08);">

      <!-- Header -->
      <div style="background:linear-gradient(135deg,#0BC5DF,#203F49);padding:20px;text-align:center;color:white;">
        <h2 style="margin:0;font-size:22px;letter-spacing:0.5px;">WebArco Dental Studio</h2>
        <p style="margin:5px 0 0;font-size:13px;opacity:0.9;">Recordatorio de Cita</p>
      </div>

      <!-- Body -->
      <div style="padding:30px; color:#333;">

        <h3 style="margin-top:0;color:#203F49;font-size:18px;">¡Hola, ${pacienteNombre.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)}!</h3>

        <p style="font-size:15px;line-height:1.6;color:#5F656A;">
          Nos comunicamos para recordarte tu próxima cita programada en <b>WebArco Dental Studio</b>.
        </p>

        <!-- Info box -->
        <div style="background:#E6F8FB;padding:20px;border-radius:8px;margin:25px 0;border-left:4px solid #0BC5DF;">
          <p style="margin:0 0 10px;font-size:14px;color:#203F49;">
            <strong style="display:inline-block;width:60px;">📅 Fecha:</strong> <span style="text-transform:capitalize;">${fechaStr}</span>
          </p>
          <p style="margin:0;font-size:14px;color:#203F49;">
            <strong style="display:inline-block;width:60px;">⏰ Hora:</strong> ${horaStr}
          </p>
        </div>

        <p style="font-size:14px;line-height:1.6;color:#5F656A;">
          Por favor, intenta llegar 5 a 10 minutos antes de tu cita para prepararte sin contratiempos. 
          Si necesitas reagendar o tienes alguna consulta, no dudes en ponerte en contacto con nosotros.
        </p>

        <!-- Botones de Acción -->
        <div style="text-align:center; margin-top:25px; margin-bottom:15px;">
          <a href="${confirmUrl}" style="display:inline-block; background-color:#1D9E75; color:white; padding:12px 24px; text-decoration:none; border-radius:6px; font-weight:bold; font-size:15px; margin-right:10px;">Confirmar Asistencia</a>
          <a href="${cancelUrl}" style="display:inline-block; background-color:#E24B4A; color:white; padding:12px 24px; text-decoration:none; border-radius:6px; font-weight:bold; font-size:15px;">Cancelar Cita</a>
        </div>
        
        <p style="font-size:14px;line-height:1.6;color:#5F656A;margin-top:20px;">
          ¡Te esperamos,<br/>
          <strong>El equipo de WebArco Dental Studio</strong>
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
