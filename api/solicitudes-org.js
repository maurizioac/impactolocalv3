import { sql, soloMetodos } from './_db.js';
import { requireOrganization } from './_org-auth.js';

const normalizeKey = (value) => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');

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
    nombre_usuario: fromRow(row, ['nombre_usuario', 'usuario', 'organizacion', 'nombre de usuario', 'nombre de la organizacion', 'nombre ong', 'autor', 'creado por']),
    titulo: fromRow(row, ['titulo', 'titulo de la solicitud', 'title', 'solicitud', 'nombre', 'asunto']),
    tipo: fromRow(row, ['tipo', 'type', 'categoria', 'tipo de solicitud']),
    descripcion: fromRow(row, ['descripcion', 'descripcion y detalles', 'description', 'detalles', 'contenido']),
    ubicacion: fromRow(row, ['ubicacion', 'location', 'lugar']),
    meta: fromRow(row, ['meta', 'meta cantidad solicitada', 'cantidad', 'objetivo', 'goal']),
    fecha: fromRow(row, ['fecha limite', 'fecha', 'date', 'creado en']),
    imagen: fromRow(row, ['imagen', 'imagen principal', 'imagen parcial', 'material fotografico evidencia', 'evidencia', 'image']),
    estado: fromRow(row, ['estado', 'status'])
  };
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
  if (!soloMetodos(req, res, ['GET', 'POST'])) return;
  try {
    if (req.method === 'POST') {
      const organization = requireOrganization(req, res);
      if (!organization) return;
      const titulo = String(req.body?.titulo || '').trim();
      const tipo = String(req.body?.tipo || '').trim();
      const descripcion = String(req.body?.descripcion || '').trim();
      const ubicacion = String(req.body?.ubicacion || '').trim();
      const meta = String(req.body?.meta || '').trim();
      const fecha = String(req.body?.fecha || '').trim() || null;
      const imagen = imageDataUrl(req.body?.imagen);
      if (titulo.length < 3 || titulo.length > 150 || descripcion.length < 3 || descripcion.length > 2500) {
        return res.status(400).json({ ok: false, message: 'Completa un título y una descripción válidos para la solicitud.' });
      }
      if (imagen === false) return res.status(400).json({ ok: false, message: 'La evidencia debe ser PNG, JPG o WEBP y no superar 5 MB.' });

      const columns = await sql`SELECT column_name FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'SOLICITUDES_ORG' ORDER BY ordinal_position`;
      const valuesByName = new Map([
        ['nombreusuario', organization.username], ['nombredeusuario', organization.username], ['usuario', organization.username], ['organizacion', organization.username], ['nombredelaorganizacion', organization.username], ['nombreong', organization.username], ['autor', organization.username], ['creadopor', organization.username],
        ['titulo', titulo], ['titulodelasolicitud', titulo], ['title', titulo], ['solicitud', titulo], ['asunto', titulo],
        ['tipo', tipo], ['tipodesolicitud', tipo], ['type', tipo], ['categoria', tipo],
        ['descripcion', descripcion], ['descripcionydetalles', descripcion], ['description', descripcion], ['detalles', descripcion], ['contenido', descripcion],
        ['ubicacion', ubicacion || null], ['location', ubicacion || null], ['lugar', ubicacion || null],
        ['meta', meta || null], ['metacantidadsolicitada', meta || null], ['cantidad', meta || null], ['objetivo', meta || null], ['goal', meta || null],
        ['fechalimite', fecha], ['fecha', fecha], ['date', fecha],
        ['imagen', imagen], ['imagenprincipal', imagen], ['imagenparcial', imagen], ['materialfotograficoevidencia', imagen], ['evidencia', imagen],
        ['estado', null], ['status', null]
      ]);
      const selected = columns.map((column) => ({ name: column.column_name, key: normalizeKey(column.column_name) }))
        .filter((column) => valuesByName.has(column.key));
      if (!selected.some((column) => ['titulo', 'titulodelasolicitud', 'title', 'solicitud', 'asunto'].includes(column.key)) || !selected.some((column) => ['descripcion', 'descripcionydetalles', 'description', 'detalles', 'contenido'].includes(column.key))) {
        return res.status(500).json({ ok: false, message: 'La tabla SOLICITUDES_ORG no tiene las columnas de título y descripción esperadas.' });
      }
      const quote = (identifier) => '"' + identifier.replace(/"/g, '""') + '"';
      const params = selected.map((column) => valuesByName.get(column.key));
      const placeholders = params.map((_, index) => '$' + (index + 1));
      const query = `INSERT INTO "SOLICITUDES_ORG" (${selected.map((column) => quote(column.name)).join(', ')}) VALUES (${placeholders.join(', ')}) RETURNING *`;
      const [row] = await sql(query, params);
      return res.status(201).json({ ok: true, solicitud: normalizeRequest(row) });
    }

    const rows = await sql`SELECT * FROM "SOLICITUDES_ORG"`;
    let solicitudes = rows.map(normalizeRequest).filter((item) => item.titulo || item.descripcion);
    // Both ONG accounts and clients see the shared request directory, with the
    // creator normalized from each row instead of inferred from the session.
    return res.status(200).json({ ok: true, solicitudes });
  } catch (error) {
    console.error('ERROR /api/solicitudes-org:', error);
    if (error.code === '42P01') return res.status(500).json({ ok: false, message: 'Neon no encuentra la tabla SOLICITUDES_ORG.' });
    return res.status(500).json({ ok: false, message: 'No se pudieron cargar las solicitudes de organizaciones.' });
  }
}
