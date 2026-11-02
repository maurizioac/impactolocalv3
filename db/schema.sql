-- Migración incremental: no elimina ni reemplaza tablas o datos existentes.
-- Clientes y administradores siguen usando sus tablas CLIENTES y ADMINS;
-- este archivo solo agrega TIPO a ORGANIZACIONES si todavía no existe.
-- Ejecútalo en Neon después de que ORGANIZACIONES ya esté creada.

ALTER TABLE "ORGANIZACIONES"
  ADD COLUMN IF NOT EXISTS "TIPO" VARCHAR(20);
