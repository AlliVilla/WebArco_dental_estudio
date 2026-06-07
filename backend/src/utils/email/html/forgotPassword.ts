export function buildResetPasswordEmail(resetLink: string): string {
  const emittedAt = new Date().toLocaleString();

  return `
  <div style="font-family: Arial, sans-serif; background:#f4f9fb; padding:30px;">

    <!-- Container -->
    <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 10px 25px rgba(0,0,0,0.08);">

      <!-- Header -->
      <div style="background:linear-gradient(135deg,#0ea5e9,#22c1c3);padding:20px;text-align:center;color:white;">
        <h2 style="margin:0;font-size:20px;">Dental Center</h2>
        <p style="margin:5px 0 0;font-size:12px;opacity:0.9;">Recuperación de contraseña</p>
      </div>

      <!-- Body -->
      <div style="padding:25px; color:#333;">

        <h3 style="margin-top:0;color:#0f172a;">¿Olvidaste tu contraseña?</h3>

        <p style="font-size:14px;line-height:1.6;">
          Hemos recibido una solicitud para restablecer tu contraseña.
          Si no fuiste tú, puedes ignorar este mensaje.
        </p>

        <!-- Button -->
        <div style="text-align:center;margin:25px 0;">
          <a href="${resetLink}"
            style="background:linear-gradient(135deg,#0ea5e9,#22c1c3);
                   color:white;
                   padding:12px 22px;
                   text-decoration:none;
                   border-radius:8px;
                   font-weight:bold;
                   display:inline-block;">
            Restablecer contraseña
          </a>
        </div>

        <!-- Info box -->
        <div style="background:#f1f5f9;padding:12px;border-radius:8px;font-size:12px;color:#475569;">
          ⏳ Este enlace expirará en <b>15 minutos</b><br/>
          📅 Emitido: ${emittedAt}
        </div>

      </div>

      <!-- Footer -->
      <div style="text-align:center;padding:15px;font-size:11px;color:#94a3b8;">
        © ${new Date().getFullYear()} Dental Center - Todos los derechos reservados
      </div>

    </div>
  </div>
  `;
}