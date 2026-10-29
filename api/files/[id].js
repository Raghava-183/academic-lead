// GET    /api/files/:id            → the stored file (inline)
// GET    /api/files/:id?download=1 → the stored file as an attachment
// DELETE /api/files/:id            → remove a stored file
const { getDb } = require('../_lib/db');
const { requireSession } = require('../_lib/auth');

module.exports = requireSession(async function handler(req, res) {
  const id = String(req.query.id || '');
  if (!id || id.length > 120) {
    res.status(400).json({ error: 'Missing file id.', code: 'bad_id' });
    return;
  }
  const db = await getDb();
  const col = db.collection('files');

  if (req.method === 'DELETE') {
    const out = await col.deleteOne({ _id: id });
    res.status(200).json({ ok: true, deleted: out.deletedCount });
    return;
  }

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET, DELETE');
    res.status(405).json({ error: 'Method not allowed.', code: 'method' });
    return;
  }

  const doc = await col.findOne({ _id: id });
  if (!doc) {
    res.status(404).json({ error: 'That file is no longer stored.', code: 'not_found' });
    return;
  }

  const buf = doc.data && doc.data.buffer ? Buffer.from(doc.data.buffer) : Buffer.from(doc.data || '');
  const disposition = req.query.download ? 'attachment' : 'inline';
  // Quote the filename and strip characters that would break the header.
  const safeName = String(doc.name || 'file').replace(/["\\\r\n]/g, '_');

  res.setHeader('Content-Type', doc.type || 'application/octet-stream');
  res.setHeader('Content-Length', String(buf.length));
  res.setHeader('Content-Disposition',
    disposition + '; filename="' + safeName + '"; filename*=UTF-8\'\'' + encodeURIComponent(doc.name || 'file'));
  res.setHeader('Cache-Control', 'private, max-age=600');
  res.status(200).send(buf);
});
