const express = require('express');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;
const pool = require('../db/pool');
const requireAuth = require('../middleware/auth');

const router = express.Router();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Store uploads directly in Cloudinary
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'bemyjam',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 600, height: 600, crop: 'fill', gravity: 'face' }],
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
  const { name, age, gender, seeking, ageMin, ageMax, bio, city } = req.body;
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
        updated_at = NOW()
       WHERE id = $9
       RETURNING *`,
      [name, age, gender, seeking, ageMin, ageMax, bio, city, req.userId]
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

  // Cloudinary returns the hosted URL in req.file.path
  const photoUrl = req.file.path;

  try {
    await pool.query('UPDATE users SET photo_url = $1, updated_at = NOW() WHERE id = $2', [photoUrl, req.userId]);
    res.json({ photoUrl });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

function sanitizeUser(u) {
  return {
    id: u.id, email: u.email, name: u.name, age: u.age,
    gender: u.gender, seeking: u.seeking, ageMin: u.age_min, ageMax: u.age_max,
    bio: u.bio, city: u.city, photoUrl: u.photo_url,
    contact: { type: u.contact_type, icon: u.contact_icon, value: u.contact_value }
  };
}

module.exports = router;
