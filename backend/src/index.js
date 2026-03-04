require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const discoverRoutes = require('./routes/discover');
const pushRoutes = require('./routes/push');
const chatRoutes = require('./routes/chat');
const { startCron } = require('./cron/dailyPicks');

const app = express();
const PORT = process.env.PORT || 3001;

// ── Middleware ────────────────────────────────────────────────
app.use(cors({
  origin: (origin, callback) => {
    const allowed = [
      'http://localhost:5173',
      'https://jam-morccuplants-projects.vercel.app',
      'https://jamichoose.vercel.app',
      'https://jam-pearl-rho.vercel.app',
      'https://bemyjam.co',
      'https://www.bemyjam.co',
    ];
    if (!origin || allowed.includes(origin)) callback(null, true);
    else callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve uploaded files (in production use a CDN instead)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ── Routes ────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/discover', discoverRoutes);
app.use('/api/push', pushRoutes);
app.use('/api/chat', chatRoutes);

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

// ── Start ─────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🌙 Twilight API running on port ${PORT}`);
  startCron();
});

module.exports = app;
