-- Match the nullable external actor relation while preserving history rows.
ALTER TABLE "estado_historial" DROP CONSTRAINT "estado_historial_cambiado_por_fkey";
ALTER TABLE "estado_historial" ADD CONSTRAINT "estado_historial_cambiado_por_fkey"
FOREIGN KEY ("cambiado_por") REFERENCES "usuario"("id_usuario")
ON DELETE SET NULL ON UPDATE CASCADE;
