import { soloMetodos } from './_db.js';
import { clearAdminSession } from './_admin-auth.js';

export default function handler(req, res) {
  if (!soloMetodos(req, res, ['POST'])) return;
  clearAdminSession(res);
  return res.status(200).json({ ok: true });
}
