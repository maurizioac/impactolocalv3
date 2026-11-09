import { sql, soloMetodos } from './_db.js';
import { getOrganizationSession, requireOrganization } from './_org-auth.js';

const normalizeKey = (value) => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
const OWNER_KEYS = ['nombreusuario', 'nombredeusuario', 'usuario', 'organizacion', 'organizacionautora', 'nombreorganizacion', 'nombredelaorganizacion', 'nombredeorganizacion', 'nombredelaong', 'nombreong', 'ong', 'autor', 'creadopor'];
const ID_KEYS = ['id', 'idsolicitud', 'solicitudid'];

function fromRow(row, aliases) {
  for (const alias of aliases) {
    const key = Object.keys(row).find((name) => normalizeKey(name) === normalizeKey(alias));
    if (key && row[key] !== null && row[key] !== undefined && String(row[key]).trim()) return row[key];
  }
  return '';
}

function normalizeRequest(row) {
  return {
    id: fromRow(row, ['id', 'id solicitud']),
    nombre_usuario: fromRow(row, ['nombre_usuario', 'usuario', 'organizacion', 'organizacion autora', 'nombre organizacion', 'nombre de usuario', 'nombre de la organizacion', 'nombre de organizacion', 'nombre de la ong', 'nombre ong', 'ong', 'autor', 'creado por']),
    titulo: fromRow(row, ['titulo', 'titulo de la solicitud', 'titulo de solicitud', 'titulo solicitud', 'nombre de la solicitud', 'title', 'solicitud', 'nombre', 'asunto']),
    tipo: fromRow(row, ['tipo', 'type', 'categoria', 'tipo de solicitud', 'solicitud tipo']),
    descripcion: fromRow(row, ['descripcion', 'descripcion y detalles', 'descripcion de la solicitud', 'detalle solicitud', 'description', 'detalles', 'contenido']),
    ubicacion: fromRow(row, ['ubicacion', 'ubicacion de la solicitud', 'location', 'lugar']),
    meta: fromRow(row, ['meta', 'meta cantidad solicitada', 'meta cantidad', 'cantidad solicitada', 'cantidad', 'objetivo', 'goal']),
    fecha: fromRow(row, ['fecha', 'fecha de envio', 'fecha de solicitud']),
    hora: fromRow(row, ['hora', 'hora de envio', 'hora de solicitud']),
    fecha_limite: fromRow(row, ['fecha limite', 'fecha limite de la solicitud', 'fecha de cierre', 'fecha objetivo']),
    imagen: fromRow(row, ['imagen principal', 'imagen', 'imagen parcial', 'material fotografico evidencia', 'imagen de evidencia', 'evidencia', 'image']),
    imagen_nombre: fromRow(row, ['imagen_nombre', 'nombre archivo', 'nombre imagen', 'archivo evidencia', 'image name']),
    web: fromRow(row, ['web', 'sitio web']),
    instagram: fromRow(row, ['instagram']),
    facebook: fromRow(row, ['facebook']),
    tik_tok: fromRow(row, ['tik tok', 'tiktok']),
    estado: fromRow(row, ['estado', 'status'])
  };
}
async function ensureModerationStatus(columns) {
  let statusColumn = columns.find((column) => ['estado', 'status'].includes(normalizeKey(column.column_name)));
  if (!statusColumn) {
    await sql`ALTER TABLE "SOLICITUDES_ORG" ADD COLUMN IF NOT EXISTS "ESTADO" VARCHAR(30)`;
    statusColumn = { column_name: 'ESTADO', data_type: 'character varying' };
  }
  return statusColumn;
}
function isApproved(value) {
  return ['aprobada', 'aprobado', 'aceptada', 'aceptado', 'vigente', 'true', '1'].includes(String(value || '').trim().toLowerCase());
}

function isPending(value) {
  return value === null || value === undefined || ['', 'null', 'pendiente', 'pending'].includes(String(value).trim().toLowerCase());
}
function imageDataUrl(value) {
  if (!value) return null;
  const match = /^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/]+={0,2})$/i.exec(String(value));
  if (!match) return false;
  const bytes = Buffer.from(match[2], 'base64');
  if (!bytes.length || bytes.length > 5 * 1024 * 1024) return false;
  return `data:image/${match[1].toLowerCase()};base64,${bytes.toString('base64')}`;
}

export default async function handler(req, res) {
  if (!soloMetodos(req, res, ['GET', 'POST', 'PATCH'])) return;
  try {
    if (req.method === 'PATCH') {
      const organization = requireOrganization(req, res);
      if (!organization) return;
      const id = req.body?.id;
      if (id === undefined || id === null || String(id).trim() === '') return res.status(400).json({ ok: false, message: 'Falta el identificador de la solicitud.' });
      let titulo = String(req.body?.titulo || '').trim();
      let tipo = String(req.body?.tipo || '').trim();
      let descripcion = String(req.body?.descripcion || '').trim();
      let ubicacion = String(req.body?.ubicacion || '').trim();
      let meta = String(req.body?.meta || '').trim();
      let fechaLimite = String(req.body?.fecha_limite || '').trim() || null;
      const imagen = req.body?.imagen ? imageDataUrl(req.body.imagen) : null;
      const imagenNombre = String(req.body?.imagen_nombre || '').trim().split(/[\\/]/).pop().slice(0, 255);
      if ((req.body?.titulo !== undefined && (titulo.length < 3 || titulo.length > 150)) || (req.body?.descripcion !== undefined && (descripcion.length < 3 || descripcion.length > 2500))) {
        return res.status(400).json({ ok: false, message: 'Completa un tÃ­tulo y una descripciÃ³n vÃ¡lidos para la solicitud.' });
      }
      if (imagen === false) return res.status(400).json({ ok: false, message: 'La evidencia debe ser PNG, JPG o WEBP y no superar 5 MB.' });
      const columns = await sql`SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'SOLICITUDES_ORG' ORDER BY ordinal_position`;
      const statusColumn = await ensureModerationStatus(columns);
      const idColumn = columns.find((column) => ID_KEYS.includes(normalizeKey(column.column_name)));
      const identifier = (name) => '"' + name.replace(/"/g, '""') + '"';
      const ownerColumn = columns.find((column) => OWNER_KEYS.includes(normalizeKey(column.column_name)));
      const [existingRow] = idColumn && ownerColumn ? await sql(
        `SELECT * FROM "SOLICITUDES_ORG" WHERE ${identifier(idColumn.column_name)} = $1 AND lower(CAST(${identifier(ownerColumn.column_name)} AS text)) = lower($2) LIMIT 1`,
        [id, organization.username]
      ) : [];
      if (existingRow) {
        const existing = normalizeRequest(existingRow);
        if (!titulo) titulo = existing.titulo;
        if (!descripcion) descripcion = existing.descripcion;
        if (!tipo) tipo = existing.tipo;
        if (!ubicacion) ubicacion = existing.ubicacion;
        if (!meta) meta = existing.meta;
        if (!isPending(existing.estado)) return res.status(409).json({ ok: false, message: 'Solo puedes editar solicitudes que siguen en revisión.' });
        if (!fechaLimite) fechaLimite = existing.fecha_limite || null;
      }
      if (titulo.length < 3 || titulo.length > 150 || descripcion.length < 3 || descripcion.length > 2500) {
        return res.status(400).json({ ok: false, message: 'Completa un tÃ­tulo y una descripciÃ³n vÃ¡lidos para la solicitud.' });
      }
      if (!idColumn || !ownerColumn) return res.status(500).json({ ok: false, message: 'La tabla SOLICITUDES_ORG necesita columnas de identificador y organización autora para editar solicitudes.' });
      const valuesByName = new Map([
        ['titulo', titulo], ['titulodelasolicitud', titulo], ['titulodesolicitud', titulo], ['titulosolicitud', titulo], ['nombredelasolicitud', titulo], ['title', titulo], ['solicitud', titulo], ['asunto', titulo],
        ['tipo', tipo], ['tipodesolicitud', tipo], ['solicitudtipo', tipo], ['type', tipo], ['categoria', tipo],
        ['descripcion', descripcion], ['descripcionydetalles', descripcion], ['descripciondelasolicitud', descripcion], ['detallesolicitud', descripcion], ['description', descripcion], ['detalles', descripcion], ['contenido', descripcion],
        ['ubicacion', ubicacion || null], ['ubicaciondelasolicitud', ubicacion || null], ['location', ubicacion || null], ['lugar', ubicacion || null],
        ['meta', meta || null], ['metacantidadsolicitada', meta || null], ['metacantidad', meta || null], ['cantidadsolicitada', meta || null], ['cantidad', meta || null], ['objetivo', meta || null], ['goal', meta || null],
        ['fechalimite', fechaLimite], ['fechalimitedelasolicitud', fechaLimite], ['fechadecierre', fechaLimite], ['fechaobjetivo', fechaLimite]
      ]);
      if (imagen !== null) {
        for (const key of ['imagen', 'imagenprincipal', 'imagenparcial', 'materialfotograficoevidencia', 'imagendeevidencia', 'evidencia']) valuesByName.set(key, imagen);
        for (const key of ['imagenombre', 'nombreimagen', 'nombrearchivo', 'archivoevidencia', 'imagenfilename']) valuesByName.set(key, imagenNombre || null);
      }
      const selected = columns.map((column) => ({ name: column.column_name, key: normalizeKey(column.column_name) }))
        .filter((column) => valuesByName.has(column.key));
      if (!selected.some((column) => ['titulo', 'titulodelasolicitud', 'titulodesolicitud', 'titulosolicitud', 'nombredelasolicitud', 'title', 'solicitud', 'asunto'].includes(column.key)) || !selected.some((column) => ['descripcion', 'descripcionydetalles', 'descripciondelasolicitud', 'detallesolicitud', 'description', 'detalles', 'contenido'].includes(column.key))) {
        return res.status(500).json({ ok: false, message: 'La tabla SOLICITUDES_ORG no tiene las columnas de tÃ­tulo y descripciÃ³n esperadas.' });
      }
      const quote = (identifier) => '"' + identifier.replace(/"/g, '""') + '"';
      const params = selected.map((column) => valuesByName.get(column.key));
      const idParam = params.length + 1;
      params.push(id);
      const ownerParam = params.length + 1;
      params.push(organization.username);
      const assignments = selected.map((column, index) => `${quote(column.name)} = $${index + 1}`);
      const query = `UPDATE "SOLICITUDES_ORG" SET ${assignments.join(', ')} WHERE ${quote(idColumn.column_name)} = $${idParam} AND lower(CAST(${quote(ownerColumn.column_name)} AS text)) = lower($${ownerParam}) RETURNING *`;
      const [row] = await sql(query, params);
      if (!row) return res.status(404).json({ ok: false, message: 'No se encontró una solicitud tuya con ese identificador.' });
      return res.status(200).json({ ok: true, solicitud: { ...normalizeRequest(row), puede_editar: true } });
    }

    if (req.method === 'POST') {
      const organization = requireOrganization(req, res);
      if (!organization) return;
      const titulo = String(req.body?.titulo || '').trim();
      const tipo = String(req.body?.tipo || '').trim();
      const descripcion = String(req.body?.descripcion || '').trim();
      const ubicacion = String(req.body?.ubicacion || '').trim();
      const meta = String(req.body?.meta || '').trim();
      const fechaLimite = String(req.body?.fecha_limite || '').trim() || null;
      const imagen = imageDataUrl(req.body?.imagen);
      const imagenNombre = String(req.body?.imagen_nombre || '').trim().split(/[\\/]/).pop().slice(0, 255);
      const fallbackNow = new Date();
      const fallbackFecha = `${fallbackNow.getFullYear()}-${String(fallbackNow.getMonth() + 1).padStart(2, '0')}-${String(fallbackNow.getDate()).padStart(2, '0')}`;
      const fallbackHora = `${String(fallbackNow.getHours()).padStart(2, '0')}:${String(fallbackNow.getMinutes()).padStart(2, '0')}:${String(fallbackNow.getSeconds()).padStart(2, '0')}`;
      const fechaEnvio = /^\d{4}-\d{2}-\d{2}$/.test(String(req.body?.fecha_envio || '')) ? req.body.fecha_envio : fallbackFecha;
      const horaEnvio = /^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/.test(String(req.body?.hora_envio || '')) ? req.body.hora_envio : fallbackHora;
      let perfil = {};
      try {
        const [profileRow] = await sql`
          SELECT "WEB" AS web, "INSTAGRAM" AS instagram, "FACEBOOK" AS facebook, "TIK TOK" AS tik_tok
          FROM "PRINCIPAL_ORG"
          WHERE lower("NOMBRE DE USUARIO") = lower(${organization.username})
          LIMIT 1
        `;
        perfil = profileRow || {};
      } catch (profileError) {
        console.error('No se pudieron leer los enlaces del perfil de la organización:', profileError);
      }
      if (titulo.length < 3 || titulo.length > 150 || descripcion.length < 3 || descripcion.length > 2500) {
        return res.status(400).json({ ok: false, message: 'Completa un título y una descripción válidos para la solicitud.' });
      }
      if (imagen === false) return res.status(400).json({ ok: false, message: 'La evidencia debe ser PNG, JPG o WEBP y no superar 5 MB.' });

      const columns = await sql`SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'SOLICITUDES_ORG' ORDER BY ordinal_position`;
      const statusColumn = await ensureModerationStatus(columns);
      const valuesByName = new Map([
        ['nombreusuario', organization.username], ['nombredeusuario', organization.username], ['usuario', organization.username], ['organizacion', organization.username], ['organizacionautora', organization.username], ['nombreorganizacion', organization.username], ['nombredelaorganizacion', organization.username], ['nombredeorganizacion', organization.username], ['nombredelaong', organization.username], ['nombreong', organization.username], ['ong', organization.username], ['autor', organization.username], ['creadopor', organization.username],
        ['titulo', titulo], ['titulodelasolicitud', titulo], ['titulodesolicitud', titulo], ['titulosolicitud', titulo], ['nombredelasolicitud', titulo], ['title', titulo], ['solicitud', titulo], ['asunto', titulo],
        ['tipo', tipo], ['tipodesolicitud', tipo], ['type', tipo], ['categoria', tipo],
        ['descripcion', descripcion], ['descripcionydetalles', descripcion], ['descripciondelasolicitud', descripcion], ['detallesolicitud', descripcion], ['description', descripcion], ['detalles', descripcion], ['contenido', descripcion],
        ['ubicacion', ubicacion || null], ['ubicaciondelasolicitud', ubicacion || null], ['location', ubicacion || null], ['lugar', ubicacion || null],
        ['meta', meta || null], ['metacantidadsolicitada', meta || null], ['metacantidad', meta || null], ['cantidadsolicitada', meta || null], ['cantidad', meta || null], ['objetivo', meta || null], ['goal', meta || null],
        ['fechalimite', fechaLimite], ['fechalimitedelasolicitud', fechaLimite], ['fechadecierre', fechaLimite], ['fechaobjetivo', fechaLimite], ['fecha', fechaEnvio], ['fechadeenvio', fechaEnvio], ['date', fechaEnvio], ['hora', horaEnvio], ['horadeenvio', horaEnvio],
        ['imagen', imagen], ['imagenprincipal', imagen], ['imagenparcial', imagen], ['materialfotograficoevidencia', imagen], ['imagendeevidencia', imagen], ['evidencia', imagen],
        ['imagenombre', imagenNombre || null], ['nombreimagen', imagenNombre || null], ['nombrearchivo', imagenNombre || null], ['archivoevidencia', imagenNombre || null], ['imagenfilename', imagenNombre || null],
        ['web', perfil.web || null], ['sitioweb', perfil.web || null], ['instagram', perfil.instagram || null], ['facebook', perfil.facebook || null], ['tiktok', perfil.tik_tok || null],
        ['estado', null], ['status', null]
      ]);
      const selected = columns.map((column) => ({ name: column.column_name, key: normalizeKey(column.column_name) }))
        .filter((column) => valuesByName.has(column.key));
      if (!selected.some((column) => ['titulo', 'titulodelasolicitud', 'titulodesolicitud', 'titulosolicitud', 'nombredelasolicitud', 'title', 'solicitud', 'asunto'].includes(column.key)) || !selected.some((column) => ['descripcion', 'descripcionydetalles', 'descripciondelasolicitud', 'detallesolicitud', 'description', 'detalles', 'contenido'].includes(column.key))) {
        return res.status(500).json({ ok: false, message: 'La tabla SOLICITUDES_ORG no tiene las columnas de título y descripción esperadas.' });
      }
      const quote = (identifier) => '"' + identifier.replace(/"/g, '""') + '"';
      const params = selected.map((column) => valuesByName.get(column.key));
      const placeholders = params.map((_, index) => '$' + (index + 1));
      const query = `INSERT INTO "SOLICITUDES_ORG" (${selected.map((column) => quote(column.name)).join(', ')}) VALUES (${placeholders.join(', ')}) RETURNING *`;
      const [row] = await sql(query, params);
      return res.status(201).json({ ok: true, solicitud: { ...normalizeRequest(row), puede_editar: true } });
    }

    const columns = await sql`SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'SOLICITUDES_ORG' ORDER BY ordinal_position`;
    const statusColumn = await ensureModerationStatus(columns);
    const rows = await sql`SELECT * FROM "SOLICITUDES_ORG"`;
    const organization = getOrganizationSession(req);
    const normalizeUsername = (value) => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
    const solicitudes = rows.map((row) => {
      const item = normalizeRequest(row);
      const isOwn = !!organization && normalizeUsername(item.nombre_usuario) === normalizeUsername(organization.username);
      return { ...item, puede_editar: isOwn && isPending(item.estado) };
    }).filter((item) => item.titulo && (organization
      ? normalizeUsername(item.nombre_usuario) === normalizeUsername(organization.username)
      : isApproved(item.estado)));
    return res.status(200).json({ ok: true, solicitudes });
  } catch (error) {
    console.error('ERROR /api/solicitudes-org:', error);
    if (error.code === '42P01') return res.status(500).json({ ok: false, message: 'Neon no encuentra la tabla SOLICITUDES_ORG.' });
    return res.status(500).json({ ok: false, message: 'No se pudieron cargar las solicitudes de organizaciones.' });
  }
}
