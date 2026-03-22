const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db/pool');

const router = express.Router();

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { email, password, name, age, gender, seeking, ageMin, ageMax, bio, city, inviteCode } = req.body;

  if (!email || !password || !name || !age || !gender || !seeking || !city ) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }

  // Beta gate — only enforced when BETA_MODE=true
  if (process.env.BETA_MODE === 'true') {
    if (!inviteCode) {
      return res.status(403).json({ error: 'An invite code is required during beta.' });
    }
    const codeCheck = await pool.query(
      'SELECT id FROM beta_codes WHERE code = $1 AND used_by_user_id IS NULL',
      [inviteCode.trim()]
    );
    if (!codeCheck.rows.length) {
      return res.status(403).json({ error: 'Invalid or already used invite code.' });
    }
  }

  try {
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const hashed = await bcrypt.hash(password, 12);
    const result = await pool.query(
      `INSERT INTO users (email, password, name, age, gender, seeking, age_min, age_max, bio, city)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING id, email, name, age, gender, seeking, age_min, age_max, bio, city, photo_url`,
      [email.toLowerCase(), hashed, name, age, gender, seeking, ageMin || 18, ageMax || 99, bio || '', city]
    );

    const user = result.rows[0];

    // Mark invite code as used
    if (process.env.BETA_MODE === 'true' && inviteCode) {
      await pool.query(
        'UPDATE beta_codes SET used_by_user_id = $1, used_at = NOW() WHERE code = $2',
        [user.id, inviteCode.trim()]
      );
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '30d' });

    res.status(201).json({ token, user: sanitizeUser(user) });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
    const user = result.rows[0];

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, user: sanitizeUser(user) });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

function sanitizeUser(u) {
  return {
    id: u.id, email: u.email, name: u.name, age: u.age,
    gender: u.gender, seeking: u.seeking, ageMin: u.age_min, ageMax: u.age_max,
    bio: u.bio, city: u.city, photoUrl: u.photo_url,
  };
}

module.exports = router;
