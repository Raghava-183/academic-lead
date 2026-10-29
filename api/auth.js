// POST   /api/auth  { password, name }  → sign in
// GET    /api/auth                      → current session
// DELETE /api/auth                      → sign out
const { checkPassword, setSession, clearSession, getSession, fail, readJson } = require('./_lib/auth');

module.exports = async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const s = getSession(req);
      res.status(200).json({ authenticated: !!s, name: s ? s.name : '' });
      return;
    }

    if (req.method === 'DELETE') {
      clearSession(res);
      res.status(200).json({ ok: true });
      return;
    }

    if (req.method === 'POST') {
      const body = await readJson(req);
      if (!checkPassword(body.password)) {
        // Small delay blunts automated guessing against a single shared password.
        await new Promise(function (r) { setTimeout(r, 400); });
        res.status(401).json({ error: 'That password is not correct.', code: 'bad_password' });
        return;
      }
      const name = String(body.name || '').trim().slice(0, 80);
      setSession(res, name);
      res.status(200).json({ ok: true, name: name });
      return;
    }

    res.setHeader('Allow', 'GET, POST, DELETE');
    res.status(405).json({ error: 'Method not allowed.', code: 'method' });
  } catch (e) {
    fail(res, e);
  }
};
