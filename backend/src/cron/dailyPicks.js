const cron = require('node-cron');
const pool = require('../db/pool');
const { assignDailyPicks } = require('../routes/discover');
const { sendPushToUser } = require('../services/push');

function startCron() {
  // Run every day at 2:00 PM server time
  // Make sure your server/hosting is in the right timezone, or use UTC and adjust
  cron.schedule('0 14 * * *', async () => {
    console.log('🕑 [CRON] Running daily picks assignment at', new Date().toISOString());
    await runDailyPicks();
  }, {
    timezone: 'America/New_York'
  });

  console.log('⏰ Daily picks cron scheduled for 2:00 PM');
}

async function runDailyPicks() {
  const today = new Date().toISOString().slice(0, 10);

  try {
    // Get all users
    const users = await pool.query('SELECT id, name FROM users');

    let successCount = 0;
    let emptyCount = 0;

    for (const user of users.rows) {
      try {
        // Only assign if not already assigned today
        const existing = await pool.query(
          'SELECT id FROM daily_picks WHERE user_id = $1 AND pick_date = $2 LIMIT 1',
          [user.id, today]
        );

        if (existing.rows.length === 0) {
          const picks = await assignDailyPicks(user.id, today);

          if (picks.length > 0) {
            // Send push notification
            await sendPushToUser(user.id, {
              title: 'Your daily four are here ✨',
              body: `${picks.length} new profiles are waiting for you. choose your jam. 🍓`,
              url: '/',
            });
            successCount++;
          } else {
            emptyCount++;
          }
        }
      } catch (err) {
        console.error(`Failed picks for user ${user.id}:`, err.message);
      }
    }

    console.log(`✅ [CRON] Daily picks done. ${successCount} users notified, ${emptyCount} had no matches.`);
  } catch (err) {
    console.error('❌ [CRON] Daily picks failed:', err.message);
  }
}

module.exports = { startCron, runDailyPicks };
