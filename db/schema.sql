-- ImpactoLOCAL: run this migration in Neon after the seven business tables
-- (ADMINS, CLIENTES, FORO_ORG, ORGANIZACIONES, PERSONAS, PRINCIPAL_ORG,
-- SOLICITUDES_ORG) have been created with their existing quoted names.
-- Registration requests need their own table: SOLICITUDES_ORG is a content
-- publication table and does not contain email/password fields.

CREATE TABLE IF NOT EXISTS solicitudes_registro_org (
  id SERIAL PRIMARY KEY,
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('ong', 'benefica')),
  usuario VARCHAR(120) NOT NULL,
  email VARCHAR(254) NOT NULL,
  password_hash TEXT NOT NULL,
  estado VARCHAR(20) NOT NULL DEFAULT 'pendiente'
    CHECK (estado IN ('pendiente', 'aprobada', 'rechazada')),
  motivo_rechazo TEXT,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS solicitudes_registro_org_usuario_pendiente_uq
  ON solicitudes_registro_org (lower(usuario)) WHERE estado = 'pendiente';
CREATE UNIQUE INDEX IF NOT EXISTS solicitudes_registro_org_email_pendiente_uq
  ON solicitudes_registro_org (lower(email)) WHERE estado = 'pendiente';

-- The current application uses lower-case SQL identifiers only for this
-- workflow table. All existing Neon entities retain their exact quoted names.
