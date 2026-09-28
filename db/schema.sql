CREATE TABLE IF NOT EXISTS usuarios (
  id            SERIAL PRIMARY KEY,
  nombre        VARCHAR(120) NOT NULL,
  email         VARCHAR(120) NOT NULL,
  password_hash TEXT,
  creado_en     TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS password_hash TEXT;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS creado_en TIMESTAMPTZ NOT NULL DEFAULT now();
CREATE UNIQUE INDEX IF NOT EXISTS usuarios_email_uq ON usuarios (lower(email));

CREATE TABLE IF NOT EXISTS solicitudes_org (
  id            SERIAL PRIMARY KEY,
  tipo          VARCHAR(20)  NOT NULL CHECK (tipo IN ('ong','benefica')),
  usuario       VARCHAR(60)  NOT NULL,
  email         VARCHAR(120) NOT NULL,
  password_hash TEXT         NOT NULL,
  estado        VARCHAR(20)  NOT NULL DEFAULT 'pendiente'
                CHECK (estado IN ('pendiente','aprobada','rechazada')),
  creado_en     TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS solicitudes_usuario_uq ON solicitudes_org (lower(usuario));
ALTER TABLE solicitudes_org ADD COLUMN IF NOT EXISTS motivo_rechazo TEXT;

CREATE TABLE IF NOT EXISTS super_admins (
  id            SERIAL PRIMARY KEY,
  email         VARCHAR(120) NOT NULL,
  password_hash TEXT NOT NULL,
  creado_en     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS super_admins_email_uq ON super_admins (lower(email));
