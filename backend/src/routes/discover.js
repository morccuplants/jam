const express = require('express');
const pool = require('../db/pool');
const requireAuth = require('../middleware/auth');
const { sendPushToUser } = require('../services/push');

const router = express.Router();

// GET /api/discover — today's 4 profiles for the current user
router.get('/', requireAuth, async (req, res) => {
  try {
    const userId = req.userId;
    const today = new Date().toLocaleString('en-CA', { timeZone: 'America/New_York' }).slice(0, 10);

    // Check if picks already exist for today
    const existing = await pool.query(
      `SELECT u.id, u.name, u.age, u.gender, u.city, u.bio, u.photo_url
       FROM daily_picks dp
       JOIN users u ON u.id = dp.profile_id
       WHERE dp.user_id = $1 AND dp.pick_date = $2
       ORDER BY dp.id`,
      [userId, today]
    );

    if (existing.rows.length > 0) {
      // Also check if they've already made a choice today
      const choice = await pool.query(
        'SELECT chosen_id FROM choices WHERE chooser_id = $1 AND pick_date = $2',
        [userId, today]
      );
      return res.json({
        profiles: existing.rows.map(profilePublic),
        chosenId: choice.rows[0]?.chosen_id || null,
      });
    }

    // No picks yet — generate them now (also called by cron at 2pm)
    const picks = await assignDailyPicks(userId, today);
    res.json({ profiles: picks.map(profilePublic), chosenId: null });
  } catch (err) {
    console.error('Discover error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/discover/choose — user picks one of their daily profiles
router.post('/choose', requireAuth, async (req, res) => {
  const { profileId } = req.body;
  if (!profileId) return res.status(400).json({ error: 'profileId required' });

  const userId = req.userId;
  const today = new Date().toLocaleString('en-CA', { timeZone: 'America/New_York' }).slice(0, 10);

  try {
    // Verify profileId was in today's picks
    const validPick = await pool.query(
      'SELECT id FROM daily_picks WHERE user_id = $1 AND profile_id = $2 AND pick_date = $3',
      [userId, profileId, today]
    );
    if (!validPick.rows.length) {
      return res.status(400).json({ error: 'Profile not in your daily picks' });
    }

    // Check not already chosen today
    const alreadyChose = await pool.query(
      'SELECT id FROM choices WHERE chooser_id = $1 AND pick_date = $2',
      [userId, today]
    );
    if (alreadyChose.rows.length) {
      return res.status(409).json({ error: 'Already made a choice today' });
    }

    // Record the choice
    await pool.query(
      'INSERT INTO choices (chooser_id, chosen_id, pick_date) VALUES ($1, $2, $3)',
      [userId, profileId, today]
    );

    // Check for mutual match: did chosen_id also choose userId today?
    const mutual = await pool.query(
      'SELECT id FROM choices WHERE chooser_id = $1 AND chosen_id = $2 AND pick_date = $3',
      [profileId, userId, today]
    );

    let matched = false;
    if (mutual.rows.length > 0) {
      // Create match (smaller id first to avoid duplicates)
      const [a, b] = [userId, profileId].sort((x, y) => x - y);
      await pool.query(
        'INSERT INTO matches (user_a_id, user_b_id, matched_on) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
        [a, b, today]
      );
      matched = true;

      // Notify both users
      const chooserResult = await pool.query('SELECT name FROM users WHERE id = $1', [userId]);
      const chosenResult = await pool.query('SELECT name FROM users WHERE id = $1', [profileId]);
      const chooserName = chooserResult.rows[0]?.name;
      const chosenName = chosenResult.rows[0]?.name;

      await sendPushToUser(userId, {
        title: 'It\'s a match! 💛',
        body: `You and ${chosenName} both chose each other.`,
      });
      await sendPushToUser(profileId, {
        title: 'It\'s a match! 💛',
        body: `You and ${chooserName} both chose each other.`,
      });
    } else {
      // Notify the chosen person that someone picked them
      const chooserResult = await pool.query('SELECT name FROM users WHERE id = $1', [userId]);
      const chooserName = chooserResult.rows[0]?.name;
      await sendPushToUser(profileId, {
        title: 'Someone chose you ✨',
        body: `${chooserName} chose you today. Open the app to respond.`,
      });
    }

    res.json({ success: true, matched });
  } catch (err) {
    console.error('Choose error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/discover/notifications — people who chose you, pending your response
router.get('/notifications', requireAuth, async (req, res) => {
  const userId = req.userId;
  const today = new Date().toLocaleString('en-CA', { timeZone: 'America/New_York' }).slice(0, 10);

  try {
    // People who chose this user today or recently, and this user hasn't responded yet
    const result = await pool.query(
      `SELECT c.id, c.chooser_id, c.pick_date, c.created_at,
              u.name, u.age, u.city, u.bio, u.photo_url,
              -- Check if current user has already responded
              (SELECT id FROM choices WHERE chooser_id = $1 AND chosen_id = c.chooser_id AND pick_date = c.pick_date) AS my_choice_id,
              -- Check if it turned into a match
              (SELECT id FROM matches
               WHERE (user_a_id = $1 AND user_b_id = c.chooser_id)
                  OR (user_b_id = $1 AND user_a_id = c.chooser_id)) AS match_id
       FROM choices c
       JOIN users u ON u.id = c.chooser_id
       WHERE c.chosen_id = $1
       ORDER BY c.created_at DESC
       LIMIT 30`,
      [userId]
    );

    const notifications = result.rows.map(r => ({
      id: r.id,
      from: { ...profilePublic(r), id: r.chooser_id },
      time: formatTime(r.created_at),
      pending: !r.my_choice_id,
      matched: !!r.match_id,
    }));

    res.json(notifications);
  } catch (err) {
    console.error('Notifications error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/discover/respond — respond to someone who chose you
router.post('/respond', requireAuth, async (req, res) => {
  const { chooserId, accept } = req.body;
  if (!chooserId) return res.status(400).json({ error: 'chooserId required' });

  const userId = req.userId;

  try {
    if (!accept) {
      // Just mark as seen/passed — nothing to store, frontend handles it
      return res.json({ success: true, matched: false });
    }

    const choiceResult = await pool.query(
  'SELECT id FROM choices WHERE chooser_id = $1 AND chosen_id = $2 LIMIT 1',
  [chooserId, userId]
);
if (!choiceResult.rows.length) {
  return res.status(400).json({ error: 'No choice found from that user' });
}

const today = new Date().toLocaleString('en-CA', { timeZone: 'America/New_York' }).slice(0, 10);

// Insert our reciprocal choice
await pool.query(
  'INSERT INTO choices (chooser_id, chosen_id, pick_date) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
  [userId, chooserId, today]
);

// Create match
const [a, b] = [userId, chooserId].sort((x, y) => x - y);
await pool.query(
  'INSERT INTO matches (user_a_id, user_b_id, matched_on) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
  [a, b, today]
);
  

    // Notify both
    const myResult = await pool.query('SELECT name FROM users WHERE id = $1', [userId]);
    const theirResult = await pool.query('SELECT name FROM users WHERE id = $1', [chooserId]);

    await sendPushToUser(chooserId, {
      title: 'It\'s a match! 💛',
      body: `You and ${myResult.rows[0]?.name} both chose each other.`,
    });
    await sendPushToUser(userId, {
      title: 'It\'s a match! 💛',
      body: `You and ${theirResult.rows[0]?.name} both chose each other.`,
    });

    res.json({ success: true, matched: true });
  } catch (err) {
    console.error('Respond error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/discover/matches — all confirmed matches with contact info revealed
router.get('/matches', requireAuth, async (req, res) => {
  const userId = req.userId;
  try {
    const result = await pool.query(
      `SELECT
         m.id, m.matched_on,
         u.id AS partner_id, u.name, u.age, u.city, u.bio, u.photo_url,
         u.contact_type, u.contact_icon, u.contact_value
       FROM matches m
       JOIN users u ON u.id = CASE WHEN m.user_a_id = $1 THEN m.user_b_id ELSE m.user_a_id END
       WHERE m.user_a_id = $1 OR m.user_b_id = $1
       ORDER BY m.created_at DESC`,
      [userId]
    );

    const matches = result.rows.map(r => ({
      id: r.id,
      matchedOn: r.matched_on,
      partner: {
        id: r.partner_id, name: r.name, age: r.age, city: r.city, bio: r.bio, photoUrl: r.photo_url,
        contact: { type: r.contact_type, icon: r.contact_icon, value: r.contact_value }
      }
    }));

    res.json(matches);
  } catch (err) {
    console.error('Matches error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// —— Unmatching ———————————————————————————————————————————————
router.delete('/matches/:matchId', requireAuth, async (req, res) => {
  const userId = req.userId;
  const matchId = parseInt(req.params.matchId, 10);
  try {
    const result = await pool.query(
      'DELETE FROM matches WHERE id = $1 AND (user_a_id = $2 OR user_b_id = $2)',
      [matchId, userId]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Match not found' });
    res.json({ success: true });
  } catch (err) {
    console.error('Unmatch error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── Helpers ──────────────────────────────────────────────────

async function assignDailyPicks(userId, date) {
  // Get user preferences
  const userResult = await pool.query(
    'SELECT gender, seeking, age_min, age_max, city FROM users WHERE id = $1',
    [userId]
  );
  const user = userResult.rows[0];
  if (!user) return [];

  // Find eligible profiles: right gender, right age range, same city, not self
  // Shuffle using random() — deterministic within a transaction for fairness
  const eligible = await pool.query(
    `SELECT id, name, age, gender, city, bio, photo_url
     FROM users
     WHERE id != $1
       AND age >= $3
       AND age <= $4
       AND city = $5
       AND id NOT IN (SELECT chosen_id FROM choices WHERE chooser_id = $1)
       AND (
         ($2 = 'any' AND (seeking = $6 OR seeking = 'any'))
         OR
         ($2 != 'any' AND gender = $2 AND (seeking = $6 OR seeking = 'any'))
       )
     ORDER BY RANDOM()
     LIMIT 4`,
    [userId, user.seeking, user.age_min, user.age_max, user.city, user.gender]
  );

  const picks = eligible.rows;

  if (picks.length > 0) {
    const values = picks.map((p, i) => `($1, $${i + 2}, $${picks.length + 2})`).join(', ');
    const params = [userId, ...picks.map(p => p.id), date];
    await pool.query(
      `INSERT INTO daily_picks (user_id, profile_id, pick_date) VALUES ${values} ON CONFLICT DO NOTHING`,
      params
    );
  }

  return picks;
}

function profilePublic(u) {
  return {
    id: u.id, name: u.name, age: u.age, city: u.city, bio: u.bio, photoUrl: u.photo_url,
  };
}

function formatTime(ts) {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

module.exports = router;
module.exports.assignDailyPicks = assignDailyPicks;
