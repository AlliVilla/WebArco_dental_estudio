CREATE TABLE "auth_session" (
    "id" VARCHAR(36) NOT NULL,
    "id_usuario" INTEGER NOT NULL,
    "refreshHash" VARCHAR(64) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    CONSTRAINT "auth_session_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "auth_session_id_usuario_idx" ON "auth_session"("id_usuario");
ALTER TABLE "auth_session" ADD CONSTRAINT "auth_session_id_usuario_fkey"
FOREIGN KEY ("id_usuario") REFERENCES "usuario"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "stored_upload" (
 "filename" VARCHAR(255) PRIMARY KEY,
 "ownerId" INTEGER NOT NULL,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "stored_upload_ownerId_idx" ON "stored_upload"("ownerId");

ALTER TABLE "estado_historial" ALTER COLUMN "cambiado_por" DROP NOT NULL;
ALTER TABLE "estado_historial" ADD COLUMN "origen" VARCHAR(30) NOT NULL DEFAULT 'usuario';
CREATE TABLE "email_response_token" (
 "hash" VARCHAR(64) PRIMARY KEY,
 "citaId" INTEGER NOT NULL,
 "action" VARCHAR(10) NOT NULL,
 "expiresAt" TIMESTAMP(3) NOT NULL,
 "usedAt" TIMESTAMP(3)
);
CREATE INDEX "email_response_token_citaId_idx" ON "email_response_token"("citaId");

-- Existing roles need own-profile access, including mandatory password changes.
INSERT INTO "rol_privilegio" ("id_rol", "id_privilegio")
SELECT r."id_rol", 9 FROM "rol" r WHERE EXISTS (SELECT 1 FROM "privilegio" WHERE "id_privilegio" = 9)
ON CONFLICT DO NOTHING;
