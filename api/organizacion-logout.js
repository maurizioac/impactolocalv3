import { soloMetodos } from './_db.js';
import { clearOrganizationSession } from './_org-auth.js';

export default function handler(req, res) {
  if (!soloMetodos(req, res, ['POST'])) return;
  clearOrganizationSession(res);
  return res.status(200).json({ ok: true });
}
