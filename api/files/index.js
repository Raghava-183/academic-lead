// POST /api/files  { name, type, data }  where data is base64 (no data: prefix)
//
// Evidence files are stored in MongoDB alongside the records that point at
// them, so the portal needs one external service and not two. Vercel caps a
// function request body at about 4.5 MB, and base64 adds a third, so the
// usable file size is 3 MB. For anything larger, swap this endpoint for
// Vercel Blob — see README.
const { getDb } = require('../_lib/db');
const { requireSession, readJson } = require('../_lib/auth');
const { newId } = require('../_lib/records');

const MAX_BYTES = 3 * 1024 * 1024;

module.exports = requireSession(async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ error: 'Method not allowed.', code: 'method' });
    return;
  }

  const body = await readJson(req);
  const name = String(body.name || 'file').slice(0, 240);
  const type = String(body.type || 'application/octet-stream').slice(0, 120);
  const data = String(body.data || '');

  if (!data) {
    res.status(400).json({ error: 'No file content was received.', code: 'empty' });
    return;
  }

  let buf;
  try {
    buf = Buffer.from(data, 'base64');
  } catch (e) {
    res.status(400).json({ error: 'The file could not be decoded.', code: 'decode' });
    return;
  }
  if (!buf.length) {
    res.status(400).json({ error: 'The file is empty.', code: 'empty' });
    return;
  }
  if (buf.length > MAX_BYTES) {
    res.status(413).json({
      error: 'That file is larger than the 3 MB limit. Compress it or split it.',
      code: 'too_large'
    });
    return;
  }

  const db = await getDb();
  const doc = {
    _id: newId(),
    name: name,
    type: type,
    size: buf.length,
    data: buf,
    uploadedBy: String((req.session && req.session.name) || ''),
    uploadedAt: Date.now()
  };
  await db.collection('files').insertOne(doc);

  res.status(201).json({ id: doc._id, name: doc.name, type: doc.type, size: doc.size, stored: true });
});
