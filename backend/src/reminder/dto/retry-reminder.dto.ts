// El endpoint POST /reminders/cola-envio/reintentar/:id no requiere body.
// El :id se parsea directamente con ParseIntPipe en el controller.
// Este archivo existe por consistencia con el patrón de la carpeta dto/.
export class RetryReminderDto {}
