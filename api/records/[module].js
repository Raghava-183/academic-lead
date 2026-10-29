// GET  /api/records/:module        → every record in that collection
// POST /api/records/:module        → create one record
const { getDb, ensureIndexes, isValidCollection } = require('../_lib/db');
const { requireSession, readJson } = require('../_lib/auth');
const { sanitise, newId, outward } = require('../_lib/records');

const MAX_RECORDS = 5000;

module.exports = requireSession(async function handler(req, res) {
  const module_ = String(req.query.module || '');
  if (!isValidCollection(module_)) {
    res.status(404).json({ error: 'Unknown record type.', code: 'bad_collection' });
    return;
  }

  const db = await getDb();
  await ensureIndexes(db);
  const col = db.collection(module_);

  if (req.method === 'GET') {
    const docs = await col.find({}).limit(MAX_RECORDS).toArray();
    res.status(200).json({ records: docs.map(outward) });
    return;
  }

  if (req.method === 'POST') {
    const body = await readJson(req);

    // Bulk create — used by the roster importer so one class list is one request.
    if (Array.isArray(body.records)) {
      if (!body.records.length) {
        res.status(400).json({ error: 'No records were sent.', code: 'validation' });
        return;
      }
      if (body.records.length > 1000) {
        res.status(413).json({ error: 'Import at most 1000 records at a time.', code: 'too_many' });
        return;
      }
      const now = Date.now();
      const docs = [];
      const problems = [];
      body.records.forEach(function (raw, i) {
        const r = sanitise(module_, raw, req.session);
        if (r.error) { problems.push('Row ' + (i + 1) + ': ' + r.error); return; }
        docs.push(Object.assign({ _id: newId() }, r.doc, { createdAt: now, updatedAt: now }));
      });
      if (!docs.length) {
        res.status(400).json({ error: problems[0] || 'Nothing could be imported.', code: 'validation' });
        return;
      }
      let inserted = [];
      try {
        // ordered:false keeps going past duplicates instead of stopping at the first.
        await col.insertMany(docs, { ordered: false });
        inserted = docs;
      } catch (e) {
        const failedIndexes = new Set((e && e.writeErrors ? e.writeErrors : []).map(function (w) {
          return w.index !== undefined ? w.index : (w.err && w.err.index);
        }));
        inserted = docs.filter(function (_, i) { return !failedIndexes.has(i); });
        if (!e || !e.writeErrors) throw e;
      }
      res.status(201).json({
        records: inserted.map(outward),
        skipped: docs.length - inserted.length,
        problems: problems
      });
      return;
    }

    const result = sanitise(module_, body, req.session);
    if (result.error) {
      res.status(400).json({ error: result.error, code: 'validation' });
      return;
    }
    const now = Date.now();
    const doc = Object.assign({ _id: newId() }, result.doc, { createdAt: now, updatedAt: now });

    try {
      await col.insertOne(doc);
    } catch (e) {
      if (e && e.code === 11000) {
        res.status(409).json({
          error: module_ === 'roster'
            ? 'That roll number already exists for this class.'
            : 'A record with that key already exists.',
          code: 'duplicate'
        });
        return;
      }
      throw e;
    }
    res.status(201).json({ record: outward(doc) });
    return;
  }

  res.setHeader('Allow', 'GET, POST');
  res.status(405).json({ error: 'Method not allowed.', code: 'method' });
});
