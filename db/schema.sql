-- Migración incremental: no elimina ni reemplaza tablas o datos existentes.
-- Clientes y administradores siguen usando sus tablas CLIENTES y ADMINS;
-- este archivo solo agrega TIPO a ORGANIZACIONES si todavía no existe.
-- Ejecútalo en Neon después de que ORGANIZACIONES ya esté creada.

ALTER TABLE "ORGANIZACIONES"
  ADD COLUMN IF NOT EXISTS "TIPO" VARCHAR(20);

-- Guarda el nombre original de la evidencia adjunta a cada solicitud.
ALTER TABLE "SOLICITUDES_ORG"
  ADD COLUMN IF NOT EXISTS "NOMBRE ARCHIVO" VARCHAR(255);

-- Conserva todos los datos del formulario de solicitudes para ONG.
ALTER TABLE "SOLICITUDES_ORG"
  ADD COLUMN IF NOT EXISTS "TIPO DE SOLICITUD" VARCHAR(100),
  ADD COLUMN IF NOT EXISTS "UBICACIÓN" VARCHAR(180),
  ADD COLUMN IF NOT EXISTS "META / CANTIDAD SOLICITADA" VARCHAR(250);
