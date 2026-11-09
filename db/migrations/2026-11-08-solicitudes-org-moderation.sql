-- Preparación aditiva de SOLICITUDES_ORG para moderación.
-- Los campos base y ESTADO existen en Neon; FECHA LÍMITE separa el vencimiento
-- opcional del formulario de FECHA/HORA, que representan el envío desde el dispositivo.
ALTER TABLE "SOLICITUDES_ORG"
  ADD COLUMN IF NOT EXISTS "FECHA LÍMITE" DATE;

-- Mantiene NULL como pendiente; conserva las decisiones antiguas de la columna booleana.
DO $$
DECLARE
  status_type TEXT;
BEGIN
  SELECT data_type INTO status_type
  FROM information_schema.columns
  WHERE table_schema = current_schema()
    AND table_name = 'SOLICITUDES_ORG'
    AND column_name = 'ESTADO';

  IF status_type = 'boolean' THEN
    ALTER TABLE "SOLICITUDES_ORG" ALTER COLUMN "ESTADO" DROP DEFAULT;
    ALTER TABLE "SOLICITUDES_ORG" ALTER COLUMN "ESTADO" DROP NOT NULL;
    ALTER TABLE "SOLICITUDES_ORG"
      ALTER COLUMN "ESTADO" TYPE VARCHAR(30)
      USING CASE WHEN "ESTADO" IS TRUE THEN 'ACEPTADO'
                 WHEN "ESTADO" IS FALSE THEN 'RECHAZADO'
                 ELSE NULL END;
  ELSE
    ALTER TABLE "SOLICITUDES_ORG" ALTER COLUMN "ESTADO" DROP DEFAULT;
    ALTER TABLE "SOLICITUDES_ORG" ALTER COLUMN "ESTADO" DROP NOT NULL;
    UPDATE "SOLICITUDES_ORG"
    SET "ESTADO" = CASE
      WHEN lower(trim(CAST("ESTADO" AS TEXT))) IN ('true', '1', 'aceptado', 'aceptada', 'aprobado', 'aprobada', 'vigente') THEN 'ACEPTADO'
      WHEN lower(trim(CAST("ESTADO" AS TEXT))) IN ('false', '0', 'rechazado', 'rechazada') THEN 'RECHAZADO'
      ELSE NULL
    END;
  END IF;
END $$;