// Field whitelists and sanitising for every record type. Anything the client
// sends that is not listed here is dropped, so a malformed or hostile body
// cannot write arbitrary keys into the database.

const FIELDS = {
  attendance: {
    text: ['type', 'studentName', 'rollNo', 'cls', 'sem', 'acadYear'],
    date: ['date', 'followUp'],
    long: ['details', 'issues', 'action', 'remarks'],
    required: ['date', 'type', 'studentName', 'rollNo', 'cls', 'sem', 'details']
  },
  assessment: {
    text: ['kind', 'acadYear', 'sem', 'cls', 'subject'],
    date: [],
    long: ['details', 'justification', 'actionPlan', 'review'],
    required: ['kind', 'acadYear', 'sem', 'cls', 'subject', 'details']
  },
  cocurricular: {
    text: ['acadYear', 'eventName', 'eventType', 'classes', 'coordinator'],
    date: ['date'],
    num: ['numStudents'],
    long: ['description', 'remarks'],
    required: ['acadYear', 'eventName', 'eventType', 'date', 'classes', 'description']
  },
  feedback: {
    text: ['acadYear', 'sem', 'cls', 'subject', 'code', 'faculty'],
    date: [],
    long: ['phase1', 'phase2', 'actionPlan', 'remarks'],
    required: ['acadYear', 'sem', 'cls', 'subject', 'code']
  },
  roster: {
    text: ['cls', 'rollNo', 'name'],
    date: [],
    long: [],
    required: ['cls', 'rollNo', 'name']
  }
};

const MAX_TEXT = 300;
const MAX_LONG = 20000;
const MAX_PROOF = 25;

function str(v, max) {
  if (v == null) return '';
  return String(v).slice(0, max).trim();
}

function cleanProof(list) {
  if (!Array.isArray(list)) return [];
  return list.slice(0, MAX_PROOF).map(function (p) {
    p = p || {};
    return {
      id: str(p.id, 80),
      name: str(p.name, 240) || 'file',
      size: Number(p.size) || 0,
      type: str(p.type, 120),
      stored: !!p.stored
    };
  }).filter(function (p) { return p.name; });
}

// Returns { doc } or { error } — never throws on bad input.
function sanitise(collection, body, session) {
  const spec = FIELDS[collection];
  if (!spec) return { error: 'Unknown record type.' };
  if (!body || typeof body !== 'object') return { error: 'The request body must be an object.' };

  const doc = {};
  (spec.text || []).forEach(function (k) { doc[k] = str(body[k], MAX_TEXT); });
  (spec.long || []).forEach(function (k) { doc[k] = str(body[k], MAX_LONG); });
  (spec.date || []).forEach(function (k) {
    const v = str(body[k], 32);
    if (v && !/^\d{4}-\d{2}-\d{2}$/.test(v)) return;
    doc[k] = v;
  });
  (spec.num || []).forEach(function (k) {
    const n = Number(body[k]);
    doc[k] = isFinite(n) && n >= 0 ? Math.floor(n) : 0;
  });
  if (collection !== 'roster') {
    doc.proof = cleanProof(body.proof);
    doc.enteredBy = str(body.enteredBy, 80) || str(session && session.name, 80);
    doc.lastBy = str(session && session.name, 80);
  }

  const missing = (spec.required || []).filter(function (k) {
    return doc[k] === '' || doc[k] == null;
  });
  if (missing.length) {
    return { error: 'These fields are required: ' + missing.join(', ') + '.' };
  }
  return { doc: doc };
}

function newId() {
  return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
}

// Mongo stores our own string id as _id; the client only ever sees `id`.
function outward(doc) {
  if (!doc) return doc;
  const o = Object.assign({}, doc);
  o.id = String(o._id);
  delete o._id;
  return o;
}

module.exports = { sanitise, newId, outward, FIELDS };
