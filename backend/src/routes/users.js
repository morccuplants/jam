const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pool = require('../db/pool');
const requireAuth = require('../middleware/auth');

const router = express.Router();

// Store uploads in /uploads directory (in production, swap for S3/Cloudinary)
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `user_${req.userId}_${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (/^image\/(jpeg|png|webp|gif)$/.test(file.mimetype)) cb(null, true);
    else cb(new Error('Only image files allowed'));
  },
});

// GET /api/users/me
router.get('/me', requireAuth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [req.userId]);
    if (!result.rows[0]) return res.status(404).json({ error: 'User not found' });
    res.json(sanitizeUser(result.rows[0]));
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /api/users/me
router.patch('/me', requireAuth, async (req, res) => {
  const { name, age, gender, seeking, ageMin, ageMax, bio, city, contactType, contactIcon, contactValue } = req.body;
  try {
    const result = await pool.query(
      `UPDATE users SET
        name = COALESCE($1, name),
        age = COALESCE($2, age),
        gender = COALESCE($3, gender),
        seeking = COALESCE($4, seeking),
        age_min = COALESCE($5, age_min),
        age_max = COALESCE($6, age_max),
        bio = COALESCE($7, bio),
        city = COALESCE($8, city),
        contact_type = COALESCE($9, contact_type),
        contact_icon = COALESCE($10, contact_icon),
        contact_value = COALESCE($11, contact_value),
        updated_at = NOW()
       WHERE id = $12
       RETURNING *`,
      [name, age, gender, seeking, ageMin, ageMax, bio, city, contactType, contactIcon, contactValue, req.userId]
    );
    res.json(sanitizeUser(result.rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/users/me/photo
router.post('/me/photo', requireAuth, upload.single('photo'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  // In production replace this URL with your CDN/S3 URL
  const photoUrl = `/uploads/${req.file.filename}`;

  try {
    await pool.query('UPDATE users SET photo_url = $1, updated_at = NOW() WHERE id = $2', [photoUrl, req.userId]);
    res.json({ photoUrl });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Serve uploaded files
router.use('/uploads', express.static(uploadDir));

function sanitizeUser(u) {
  return {
    id: u.id, email: u.email, name: u.name, age: u.age,
    gender: u.gender, seeking: u.seeking, ageMin: u.age_min, ageMax: u.age_max,
    bio: u.bio, city: u.city, photoUrl: u.photo_url,
    contact: { type: u.contact_type, icon: u.contact_icon, value: u.contact_value }
  };
}

module.exports = router;
