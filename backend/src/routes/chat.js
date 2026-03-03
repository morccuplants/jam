const express = require('express');
const pool = require('../db/pool');
const requireAuth = require('../middleware/auth');
const { sendPushToUser } = require('../services/push');

const router = express.Router();

const MAX_MSGS = 20;
const WARN_AT  = 10; // trigger date prompt when user has this many left

// ── Helper: verify user is part of a match ───────────────────
async function getMatch(matchId, userId) {
  const result = await pool.query(
    `SELECT id, user_a_id, user_b_id, date_confirmed, date_details, unmatched
     FROM matches WHERE id = $1 AND (user_a_id = $2 OR user_b_id = $2)`,
    [matchId, userId]
  );
  return result.rows[0] || null;
}

// ── Helper: get or create quota row ─────────────────────────
async function getQuota(matchId, userId) {
  await pool.query(
    `INSERT INTO chat_quotas (match_id, user_id, used)
     VALUES ($1, $2, 0) ON CONFLICT DO NOTHING`,
    [matchId, userId]
  );
  const result = await pool.query(
    'SELECT used FROM chat_quotas WHERE match_id = $1 AND user_id = $2',
    [matchId, userId]
  );
  return result.rows[0]?.used ?? 0;
}

// ── Helper: compute dateStatus for a user in a match ────────
async function getDateStatus(match, userId) {
  if (match.unmatched)      return 'declined';
  if (match.date_confirmed) return 'confirmed';

  const votes = await pool.query(
    'SELECT user_id, vote FROM date_votes WHERE match_id = $1',
    [match.id]
  );
  const myVote    = votes.rows.find(v => v.user_id === userId);
  const theirVote = votes.rows.find(v => v.user_id !== userId);

  if (!myVote) {
    // Show prompt if either party is getting low
    return theirVote ? 'pending' : null;
  }
  if (!myVote.vote) return 'declined'; // I said no
  return 'i_said_yes';                 // I said yes, waiting on them
}

// ── Helper: build full response payload ─────────────────────
async function buildPayload(match, userId) {
  const partnerId = match.user_a_id === userId ? match.user_b_id : match.user_a_id;

  const messages = await pool.query(
    `SELECT id, sender_id, text, created_at AS ts
     FROM chat_messages WHERE match_id = $1 ORDER BY created_at ASC`,
    [match.id]
  );

  const myUsed     = await getQuota(match.id, userId);
  const myRemaining = Math.max(0, MAX_MSGS - myUsed);
  const dateStatus  = await getDateStatus(match, userId);

  // Count unread (messages from partner sent after last message from me)
  const lastMine = await pool.query(
    `SELECT created_at FROM chat_messages
     WHERE match_id = $1 AND sender_id = $2
     ORDER BY created_at DESC LIMIT 1`,
    [match.id, userId]
  );
  const since = lastMine.rows[0]?.created_at || new Date(0);
  const unread = await pool.query(
    `SELECT COUNT(*) FROM chat_messages
     WHERE match_id = $1 AND sender_id = $2 AND created_at > $3`,
    [match.id, partnerId, since]
  );

  return {
    messages: messages.rows.map(m => ({
      id:       m.id,
      senderId: m.sender_id,
      text:     m.text,
      ts:       new Date(m.ts).getTime(),
    })),
    myRemaining,
    dateStatus,
    dateDetails:  match.date_details || null,
    unreadCount:  parseInt(unread.rows[0].count, 10),
  };
}

// ── GET /api/chat/:matchId ───────────────────────────────────
router.get('/:matchId', requireAuth, async (req, res) => {
  const userId  = req.userId;
  const matchId = parseInt(req.params.matchId, 10);

  try {
    const match = await getMatch(matchId, userId);
    if (!match) return res.status(404).json({ error: 'Match not found' });

    res.json(await buildPayload(match, userId));
  } catch (err) {
    console.error('GET chat error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── POST /api/chat/:matchId ──────────────────────────────────
router.post('/:matchId', requireAuth, async (req, res) => {
  const userId  = req.userId;
  const matchId = parseInt(req.params.matchId, 10);
  const { text } = req.body;

  if (!text?.trim()) return res.status(400).json({ error: 'text required' });

  try {
    const match = await getMatch(matchId, userId);
    if (!match) return res.status(404).json({ error: 'Match not found' });
    if (match.unmatched) return res.status(403).json({ error: 'Match has ended' });

    // Check quota
    const used = await getQuota(matchId, userId);
    if (used >= MAX_MSGS) return res.status(403).json({ error: 'No messages remaining' });

    // Insert message
    await pool.query(
      'INSERT INTO chat_messages (match_id, sender_id, text) VALUES ($1, $2, $3)',
      [matchId, userId, text.trim()]
    );

    // Increment quota
    await pool.query(
      'UPDATE chat_quotas SET used = used + 1 WHERE match_id = $1 AND user_id = $2',
      [matchId, userId]
    );

    const newUsed     = used + 1;
    const remaining   = MAX_MSGS - newUsed;
    const partnerId   = match.user_a_id === userId ? match.user_b_id : match.user_a_id;

    // Push notification to partner
    const senderResult = await pool.query('SELECT name FROM users WHERE id = $1', [userId]);
    const senderName   = senderResult.rows[0]?.name || 'Someone';
    await sendPushToUser(partnerId, {
      title: `${senderName} sent you a message`,
      body:  text.trim().slice(0, 80),
      url:   '/',
    });

    // If sender just hit the warning threshold, nudge partner too
    if (remaining === WARN_AT) {
      await sendPushToUser(partnerId, {
        title: 'Running low on messages ⏳',
        body:  `${senderName} has ${remaining} messages left. Have you agreed on a date?`,
        url:   '/',
      });
    }

    // Check if sender is now out — if so and no date set, trigger date prompt
    const dateStatus = await getDateStatus(match, userId);
    if (remaining === 0 && !match.date_confirmed && dateStatus !== 'declined') {
      await sendPushToUser(partnerId, {
        title: `${senderName} is out of messages`,
        body:  'Did you two agree on a date? Open the app to confirm.',
        url:   '/',
      });
    }

    const updatedMatch = await getMatch(matchId, userId);
    res.json(await buildPayload(updatedMatch, userId));
  } catch (err) {
    console.error('POST chat error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── POST /api/chat/:matchId/date-response ────────────────────
router.post('/:matchId/date-response', requireAuth, async (req, res) => {
  const userId  = req.userId;
  const matchId = parseInt(req.params.matchId, 10);
  const { yes } = req.body;

  if (typeof yes !== 'boolean') return res.status(400).json({ error: 'yes (boolean) required' });

  try {
    const match = await getMatch(matchId, userId);
    if (!match) return res.status(404).json({ error: 'Match not found' });
    if (match.unmatched || match.date_confirmed) {
      return res.json({ dateStatus: await getDateStatus(match, userId), dateDetails: match.date_details });
    }

    const partnerId = match.user_a_id === userId ? match.user_b_id : match.user_a_id;

    // Upsert vote
    await pool.query(
      `INSERT INTO date_votes (match_id, user_id, vote)
       VALUES ($1, $2, $3)
       ON CONFLICT (match_id, user_id) DO UPDATE SET vote = $3`,
      [matchId, userId, yes]
    );

    if (!yes) {
      // One no = unmatch
      await pool.query(
        'UPDATE matches SET unmatched = true WHERE id = $1',
        [matchId]
      );
      const myName = (await pool.query('SELECT name FROM users WHERE id = $1', [userId])).rows[0]?.name;
      await sendPushToUser(partnerId, {
        title: 'Match ended',
        body:  `${myName} wasn't able to set a date. Better luck next time.`,
        url:   '/',
      });
      return res.json({ dateStatus: 'declined', dateDetails: null, unmatched: true });
    }

    // I said yes — check if partner also said yes
    const partnerVote = await pool.query(
      'SELECT vote FROM date_votes WHERE match_id = $1 AND user_id = $2',
      [matchId, partnerId]
    );

    if (partnerVote.rows[0]?.vote === true) {
      // Both said yes → confirmed!
      await pool.query(
        'UPDATE matches SET date_confirmed = true WHERE id = $1',
        [matchId]
      );
      const myName = (await pool.query('SELECT name FROM users WHERE id = $1', [userId])).rows[0]?.name;
      await sendPushToUser(partnerId, {
        title: "It's a date! 📅",
        body:  `You and ${myName} both confirmed. Use your remaining messages to sort out the details.`,
        url:   '/',
      });
      return res.json({ dateStatus: 'confirmed', dateDetails: null, unmatched: false });
    }

    // Just me so far
    const myName = (await pool.query('SELECT name FROM users WHERE id = $1', [userId])).rows[0]?.name;
    await sendPushToUser(partnerId, {
      title: `${myName} says yes to a date 📅`,
      body:  'Open the app — do you have a date?',
      url:   '/',
    });

    return res.json({ dateStatus: 'i_said_yes', dateDetails: null, unmatched: false });
  } catch (err) {
    console.error('Date response error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
