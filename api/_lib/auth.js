// Session handling for the shared departmental login.
//
// There is one password for the whole department (PORTAL_PASSWORD). A correct
// password mints a signed, HTTP-only cookie; every API call checks it. The
// cookie is signed with SESSION_SECRET using HMAC-SHA256, so it cannot be
// forged client-side, but it carries no privileges beyond "signed in".
const crypto = require('crypto');

const COOKIE = 'al_session';
const MAX_AGE = 60 * 60 * 24 * 14; // 14 days

function secret() {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 16) {
    const err = new Error('SESSION_SECRET is missing or too short. Set a random string of at least 16 characters.');
    err.status = 500;
    err.code = 'no_secret';
    throw err;
  }
  return s;
}

function portalPassword() {
  const p = process.env.PORTAL_PASSWORD;
  if (!p) {
    const err = new Error('PORTAL_PASSWORD is not set.');
    err.status = 500;
    err.code = 'no_password';
    throw err;
  }
  return p;
}

function b64url(buf) {
  return Buffer.from(buf).toString('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function unb64url(str) {
  return Buffer.from(String(str).replace(/-/g, '+').replace(/_/g, '/'), 'base64');
}

function sign(payload) {
  const body = b64url(JSON.stringify(payload));
  const mac = b64url(crypto.createHmac('sha256', secret()).update(body).digest());
  return body + '.' + mac;
}

function verify(token) {
  if (!token || typeof token !== 'string' || token.indexOf('.') < 0) return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const expected = b64url(crypto.createHmac('sha256', secret()).update(parts[0]).digest());
  const a = Buffer.from(parts[1]);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  let payload;
  try { payload = JSON.parse(unb64url(parts[0]).toString('utf8')); } catch (e) { return null; }
  if (!payload || typeof payload.exp !== 'number' || payload.exp < Date.now() / 1000) return null;
  return payload;
}

function checkPassword(given) {
  const want = Buffer.from(portalPassword());
  const got = Buffer.from(String(given == null ? '' : given));
  // Pad to equal length so timingSafeEqual does not throw and does not leak length.
  const len = Math.max(want.length, got.length);
  const wantPad = Buffer.alloc(len); want.copy(wantPad);
  const gotPad = Buffer.alloc(len); got.copy(gotPad);
  return want.length === got.length && crypto.timingSafeEqual(wantPad, gotPad);
}

function parseCookies(req) {
  const header = req.headers.cookie || '';
  const out = {};
  header.split(';').forEach(function (pair) {
    const i = pair.indexOf('=');
    if (i < 0) return;
    out[pair.slice(0, i).trim()] = decodeURIComponent(pair.slice(i + 1).trim());
  });
  return out;
}

function setSession(res, name) {
  const token = sign({
    name: String(name || '').slice(0, 80),
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + MAX_AGE
  });
  const secure = process.env.VERCEL ? ' Secure;' : '';
  res.setHeader('Set-Cookie',
    COOKIE + '=' + encodeURIComponent(token) + '; Path=/; HttpOnly;' + secure +
    ' SameSite=Lax; Max-Age=' + MAX_AGE);
  return token;
}

function clearSession(res) {
  const secure = process.env.VERCEL ? ' Secure;' : '';
  res.setHeader('Set-Cookie', COOKIE + '=; Path=/; HttpOnly;' + secure + ' SameSite=Lax; Max-Age=0');
}

function getSession(req) {
  return verify(parseCookies(req)[COOKIE]);
}

// Wrap a handler so it only runs for a signed-in caller.
function requireSession(handler) {
  return async function (req, res) {
    let session;
    try { session = getSession(req); }
    catch (e) { return fail(res, e); }
    if (!session) {
      res.status(401).json({ error: 'Not signed in.', code: 'unauthorized' });
      return;
    }
    req.session = session;
    try {
      await handler(req, res);
    } catch (e) {
      fail(res, e);
    }
  };
}

function fail(res, e) {
  const status = e && e.status ? e.status : 500;
  res.status(status).json({
    error: (e && e.message) || 'Something went wrong on the server.',
    code: (e && e.code) || 'server_error'
  });
}

function readJson(req) {
  // Vercel parses JSON bodies already; this covers `vercel dev` and raw streams.
  if (req.body && typeof req.body === 'object') return Promise.resolve(req.body);
  if (typeof req.body === 'string') {
    try { return Promise.resolve(JSON.parse(req.body)); } catch (e) { return Promise.resolve({}); }
  }
  return new Promise(function (resolve) {
    let data = '';
    req.on('data', function (c) { data += c; });
    req.on('end', function () {
      try { resolve(JSON.parse(data || '{}')); } catch (e) { resolve({}); }
    });
    req.on('error', function () { resolve({}); });
  });
}

module.exports = {
  COOKIE, checkPassword, setSession, clearSession, getSession,
  requireSession, fail, readJson
};
