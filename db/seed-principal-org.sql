-- Carga inicial de las cinco organizaciones para la tabla pública PRINCIPAL_ORG.
-- Ejecutar en Neon Console después de seleccionar la base de datos del proyecto.

CREATE TABLE IF NOT EXISTS "PRINCIPAL_ORG" (
  "NOMBRE DE USUARIO" TEXT PRIMARY KEY,
  "TÍTULO" TEXT,
  "DESCRIPCIÓN" TEXT,
  "IMAGEN PRINCIPAL" TEXT,
  "IMAGEN SECUNDARIA" TEXT,
  "SUBTÍTULO 1" TEXT,
  "TEXTO 1" TEXT,
  "SUBTÍTULO 2" TEXT,
  "TEXTO 2" TEXT,
  "WEB" TEXT,
  "INSTAGRAM" TEXT,
  "FACEBOOK" TEXT,
  "TIK TOK" TEXT
);

ALTER TABLE "PRINCIPAL_ORG" ADD COLUMN IF NOT EXISTS "TÍTULO" TEXT;
ALTER TABLE "PRINCIPAL_ORG" ADD COLUMN IF NOT EXISTS "NOMBRE DE USUARIO" TEXT;
ALTER TABLE "PRINCIPAL_ORG" ADD COLUMN IF NOT EXISTS "DESCRIPCIÓN" TEXT;
ALTER TABLE "PRINCIPAL_ORG" ADD COLUMN IF NOT EXISTS "IMAGEN PRINCIPAL" TEXT;
ALTER TABLE "PRINCIPAL_ORG" ADD COLUMN IF NOT EXISTS "IMAGEN SECUNDARIA" TEXT;
ALTER TABLE "PRINCIPAL_ORG" ADD COLUMN IF NOT EXISTS "SUBTÍTULO 1" TEXT;
ALTER TABLE "PRINCIPAL_ORG" ADD COLUMN IF NOT EXISTS "TEXTO 1" TEXT;
ALTER TABLE "PRINCIPAL_ORG" ADD COLUMN IF NOT EXISTS "SUBTÍTULO 2" TEXT;
ALTER TABLE "PRINCIPAL_ORG" ADD COLUMN IF NOT EXISTS "TEXTO 2" TEXT;
ALTER TABLE "PRINCIPAL_ORG" ADD COLUMN IF NOT EXISTS "WEB" TEXT;
ALTER TABLE "PRINCIPAL_ORG" ADD COLUMN IF NOT EXISTS "INSTAGRAM" TEXT;
ALTER TABLE "PRINCIPAL_ORG" ADD COLUMN IF NOT EXISTS "FACEBOOK" TEXT;
ALTER TABLE "PRINCIPAL_ORG" ADD COLUMN IF NOT EXISTS "TIK TOK" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "PRINCIPAL_ORG_usuario_idx"
  ON "PRINCIPAL_ORG" ("NOMBRE DE USUARIO");

INSERT INTO "PRINCIPAL_ORG" (
  "NOMBRE DE USUARIO", "TÍTULO", "DESCRIPCIÓN", "IMAGEN PRINCIPAL", "IMAGEN SECUNDARIA",
  "SUBTÍTULO 1", "TEXTO 1", "SUBTÍTULO 2", "TEXTO 2",
  "WEB", "INSTAGRAM", "FACEBOOK", "TIK TOK"
) VALUES
('CambiandoVidas', 'Camiando Vidas PE', 'Asociación sin fines de lucro enfocada en el diseño y ejecución de proyectos de impacto social dirigidos a poblaciones en situación de vulnerabilidad y extrema pobreza en el Perú.', NULL, NULL, 'Nuestro Enfoque Social', 'Desarrollamos iniciativas centradas en brindar soporte integral a comunidades vulnerables mediante campañas de abrigo, nutrición, educación y soporte comunitario, fortaleciendo el tejido social de las familias más necesitadas.', 'Voluntariado y Acción Comunitaria', 'Convocamos a ciudadanos y jóvenes comprometidos que deseen sumarse como voluntarios en el trabajo de campo, gestión logística y programas formativos en beneficio de los sectores más desfavorecidos.', 'https://cambiandovidas-peru.org/', 'https://www.instagram.com/p/Dcb2UVHvIWV/', 'https://www.facebook.com/cambiandovidasenperu', 'https://www.tiktok.com/@cambiandovidasenperu'),
('EscoladrillosPerú', 'Escoladrillos Perú', 'Emprendimiento socio-ambiental que busca crear conciencia colectiva y eliminar el concepto tradicional de basura a través de la educación, confección y aprovechamiento del ecoladrillo dentro del manejo eficiente de los residuos sólidos.', NULL, NULL, 'Transformando Residuos en Recursos', 'Promovemos la segregación correcta de plásticos limpios y secos compactados dentro de botellas plásticas para transformar desechos no biodegradables en bloques de construcción sustentables, reduciendo la contaminación ambiental.', 'Educación Ambiental Py Talleres', 'Realizamos charlas, capacitaciones y actividades prácticas dirigidas a colegios, empresas y comunidades para fomentar una cultura de economía circular y sostenibilidad participativa.', 'https://ecoladrillosperu.com/', 'https://www.instagram.com/ecoladrillos.peru/', 'https://www.facebook.com/ecoladrillerosperu/?locale=es_LA', 'https://www.tiktok.com/@ecoladrillos.peru'),
('BuscandoUnCambioPE', 'Buscando un Cambio PE', 'Organización encargada de promover, articular y dirigir diferentes jornadas de voluntariado multidisciplinario y sin fines de lucro en apoyo a sectores vulnerables.', NULL, NULL, 'Red de Voluntariado Juvenil', 'Fomentamos el liderazgo solidario y la participación ciudadana juvenil mediante intervenciones directas en comunidades vulnerables, albergues y centros de asistencia comunitaria.', 'Convocatorias y Participación', 'Abrimos convocatorias periódicas para integrar a voluntarios en comisiones operativas, dinámicas recreativas, logística de donaciones y soporte comunitario.', NULL, 'https://www.instagram.com/buscandouncambio.pe/', 'https://www.facebook.com/p/Buscando-un-cambio-100082698735454/', 'https://www.tiktok.com/@buscandouncambio.pe'),
('CorazonesInmaculadosLima', 'Corzones Inmaculados Lima', 'Grupo de jóvenes voluntarios dedicado a llevar alegría, acompañamiento emocional y esperanza a niños que se encuentran hospitalizados o en tratamiento contra el cáncer en centros de salud de Lima.', NULL, NULL, 'Misión de Acompañamiento y Alegría', 'Nuestra labor busca humanizar la estancia hospitalaria pediátrica a través de visitas periódicas con actividades recreativas, cuentacuentos y dinámicas lúdicas que fortalecen el ánimo de los niños y sus familias.', 'Campañas de Soporte y Solidaridad', 'Coordinamos la recolección y entrega de kits recreativos, insumos básicos y donaciones de soporte para los pacientes infantiles y sus cuidadores en los hospitales.', 'https://linktr.ee/Corazones.Inmaculados.Lima', 'https://www.instagram.com/corazones.inmaculados.lima/', 'https://www.facebook.com/p/Corazones-Inmaculados-Voluntariado-100067007376652/', 'https://www.tiktok.com/@corazones_inmaculados'),
('GabyAlRescate', 'Gaby al Rescate', 'Organización sin fines de lucro que rescata animales en estado de abandono, desnutrición o maltrato, los rehabilita médica y emocionalmente, y les encuentra hogares responsables para toda la vida.', NULL, NULL, 'Rescate y Rehabilitación Integral', 'Proporcionamos asistencia médica veterinaria de urgencia, cirugías, medicación, alimentación balanceada y un entorno seguro para sanar física y emocionalmente a cada animal protegido.', 'Adopciones Responsables y Voluntariado', 'Gestionamos procesos rigurosos de adopción para asegurar familias responsables y definitivas, e impulsamos campañas de donación, apadrinamiento y voluntariado en refugio.', NULL, 'https://www.instagram.com/gabyalrescate/', 'https://www.facebook.com/Gabyalrescate/', 'https://www.tiktok.com/@gabyalrescate')
ON CONFLICT ("NOMBRE DE USUARIO") DO UPDATE SET
  "TÍTULO" = EXCLUDED."TÍTULO",
  "DESCRIPCIÓN" = EXCLUDED."DESCRIPCIÓN",
  "IMAGEN PRINCIPAL" = EXCLUDED."IMAGEN PRINCIPAL",
  "IMAGEN SECUNDARIA" = EXCLUDED."IMAGEN SECUNDARIA",
  "SUBTÍTULO 1" = EXCLUDED."SUBTÍTULO 1",
  "TEXTO 1" = EXCLUDED."TEXTO 1",
  "SUBTÍTULO 2" = EXCLUDED."SUBTÍTULO 2",
  "WEB" = EXCLUDED."WEB",
  "INSTAGRAM" = EXCLUDED."INSTAGRAM",
  "FACEBOOK" = EXCLUDED."FACEBOOK",
  "TIK TOK" = EXCLUDED."TIK TOK";
