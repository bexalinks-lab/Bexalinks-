// auth-routes.js
// Real email/password auth for Bexalink. Mounted at /api/auth in app.js.
// Uses the `cookie-session` middleware (already configured in app.js) to
// store just { userId } in a signed, httpOnly cookie — no separate session
// table needed. This is what makes /login, /signup, /logout and the
// dashboard's "signed out" check actually work end to end.

const express = require('express');
const db = require('./db');
const { hashPassword, verifyPassword } = require('./password-utils');

const router = express.Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function publicUser(u) {
  return { id: u.id, email: u.email, displayName: u.display_name, role: u.role };
}

// ---- POST /api/auth/signup -------------------------------------------------
router.post('/signup', async (req, res) => {
  const { email, password, displayName, ref } = req.body || {};

  if (!email || !EMAIL_RE.test(String(email).trim())) {
    return res.status(400).json({ error: 'A valid email is required.' });
  }
  if (!password || String(password).length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters.' });
  }

  const normalizedEmail = String(email).trim().toLowerCase();

  try {
    const existing = await db.query('SELECT id FROM users WHERE email = $1', [normalizedEmail]);
    if (existing.rows[0]) {
      return res.status(409).json({ error: 'An account with that email already exists.' });
    }

    let referredBy = null;
    if (ref) {
      const r = await db.query('SELECT id FROM users WHERE id = $1', [ref]).catch(() => ({ rows: [] }));
      referredBy = r.rows[0]?.id || null;
    }

    const passwordHash = hashPassword(String(password));
    const { rows } = await db.query(
      `INSERT INTO users (email, password_hash, display_name, referred_by)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, display_name, role`,
      [normalizedEmail, passwordHash, displayName ? String(displayName).trim() : null, referredBy]
    );

    const user = rows[0];
    req.session.userId = user.id;
    res.status(201).json({ user: publicUser(user) });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'An account with that email already exists.' });
    }
    console.error('[auth/signup]', err);
    res.status(500).json({ error: 'Could not create account. Please try again.' });
  }
});

// ---- POST /api/auth/login --------------------------------------------------
router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const normalizedEmail = String(email).trim().toLowerCase();

  try {
    const { rows } = await db.query(
      'SELECT id, email, password_hash, display_name, role, is_banned FROM users WHERE email = $1',
      [normalizedEmail]
    );
    const user = rows[0];

    if (!user || !verifyPassword(String(password), user.password_hash)) {
      return res.status(401).json({ error: 'Incorrect email or password.' });
    }
    if (user.is_banned) {
      return res.status(403).json({ error: 'This account has been suspended.' });
    }

    req.session.userId = user.id;
    res.json({ user: publicUser(user) });
  } catch (err) {
    console.error('[auth/login]', err);
    res.status(500).json({ error: 'Could not log in. Please try again.' });
  }
});

// ---- POST /api/auth/logout --------------------------------------------------
router.post('/logout', (req, res) => {
  req.session = null;
  res.json({ success: true });
});

// ---- GET /api/auth/me -------------------------------------------------------
// Used by the login/signup pages to bounce an already-logged-in visitor
// straight to the dashboard.
router.get('/me', async (req, res) => {
  const userId = req.session?.userId;
  if (!userId) return res.status(401).json({ error: 'Not authenticated.' });

  try {
    const { rows } = await db.query(
      'SELECT id, email, display_name, role FROM users WHERE id = $1',
      [userId]
    );
    if (!rows[0]) return res.status(401).json({ error: 'Not authenticated.' });
    res.json({ user: publicUser(rows[0]) });
  } catch (err) {
    console.error('[auth/me]', err);
    res.status(500).json({ error: 'Could not load session.' });
  }
});

module.exports = router;
