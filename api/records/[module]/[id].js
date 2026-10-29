// PUT    /api/records/:module/:id   → replace one record
// DELETE /api/records/:module/:id   → remove one record
const { getDb, isValidCollection } = require('../../_lib/db');
const { requireSession, readJson } = require('../../_lib/auth');
const { sanitise, outward } = require('../../_lib/records');

module.exports = requireSession(async function handler(req, res) {
  const module_ = String(req.query.module || '');
  const id = String(req.query.id || '');
  if (!isValidCollection(module_)) {
    res.status(404).json({ error: 'Unknown record type.', code: 'bad_collection' });
    return;
  }
  if (!id || id.length > 120) {
    res.status(400).json({ error: 'Missing record id.', code: 'bad_id' });
    return;
  }

  const db = await getDb();
  const col = db.collection(module_);

  if (req.method === 'PUT') {
    const body = await readJson(req);
    const result = sanitise(module_, body, req.session);
    if (result.error) {
      res.status(400).json({ error: result.error, code: 'validation' });
      return;
    }
    const existing = await col.findOne({ _id: id });
    if (!existing) {
      res.status(404).json({ error: 'That record no longer exists. Someone may have deleted it.', code: 'not_found' });
      return;
    }
    const doc = Object.assign({}, result.doc, {
      createdAt: existing.createdAt || Date.now(),
      updatedAt: Date.now()
    });
    await col.replaceOne({ _id: id }, doc);
    res.status(200).json({ record: outward(Object.assign({ _id: id }, doc)) });
    return;
  }

  if (req.method === 'DELETE') {
    const out = await col.deleteOne({ _id: id });
    res.status(200).json({ ok: true, deleted: out.deletedCount });
    return;
  }

  res.setHeader('Allow', 'PUT, DELETE');
  res.status(405).json({ error: 'Method not allowed.', code: 'method' });
});
