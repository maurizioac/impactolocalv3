-- Run this migration in the Neon SQL Editor after creating ORGANIZACIONES.
-- Organization applications stay pending until an administrator approves them.

CREATE TABLE IF NOT EXISTS solicitudes_registro_org (
  id SERIAL PRIMARY KEY,
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('ONG', 'VOLUNTARIADO')),
  usuario VARCHAR(120) NOT NULL,
  email VARCHAR(254) NOT NULL,
  password_hash TEXT NOT NULL,
  ocupacion VARCHAR(120) NOT NULL,
  web TEXT,
  instagram TEXT,
  facebook TEXT,
  tiktok TEXT,
  estado VARCHAR(20) NOT NULL DEFAULT 'pendiente'
    CHECK (estado IN ('pendiente', 'aprobada', 'rechazada')),
  motivo_rechazo TEXT,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add the submitted profile fields to the existing organization table.
ALTER TABLE "ORGANIZACIONES"
  ADD COLUMN IF NOT EXISTS "TIPO" VARCHAR(20),
  ADD COLUMN IF NOT EXISTS "OCUPACIÓN" VARCHAR(120),
  ADD COLUMN IF NOT EXISTS "WEB" TEXT,
  ADD COLUMN IF NOT EXISTS "INSTAGRAM" TEXT,
  ADD COLUMN IF NOT EXISTS "FACEBOOK" TEXT,
  ADD COLUMN IF NOT EXISTS "TIKTOK" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS solicitudes_registro_org_usuario_pendiente_uq
  ON solicitudes_registro_org (lower(usuario)) WHERE estado = 'pendiente';
CREATE UNIQUE INDEX IF NOT EXISTS solicitudes_registro_org_email_pendiente_uq
  ON solicitudes_registro_org (lower(email)) WHERE estado = 'pendiente';

-- IF NOT EXISTS allows applying this file again safely after later code updates.
ALTER TABLE solicitudes_registro_org
  ADD COLUMN IF NOT EXISTS ocupacion VARCHAR(120),
  ADD COLUMN IF NOT EXISTS web TEXT,
  ADD COLUMN IF NOT EXISTS instagram TEXT,
  ADD COLUMN IF NOT EXISTS facebook TEXT,
  ADD COLUMN IF NOT EXISTS tiktok TEXT;

ALTER TABLE solicitudes_registro_org
  DROP CONSTRAINT IF EXISTS solicitudes_registro_org_tipo_check;
UPDATE solicitudes_registro_org
SET tipo = CASE lower(tipo)
  WHEN 'ong' THEN 'ONG'
  WHEN 'benefica' THEN 'VOLUNTARIADO'
  WHEN 'voluntariado' THEN 'VOLUNTARIADO'
  ELSE tipo
END;
ALTER TABLE solicitudes_registro_org
  ADD CONSTRAINT solicitudes_registro_org_tipo_check
  CHECK (tipo IN ('ONG', 'VOLUNTARIADO'));
