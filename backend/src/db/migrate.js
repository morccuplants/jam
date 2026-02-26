require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const pool = require('./pool');

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id          SERIAL PRIMARY KEY,
        email       TEXT UNIQUE NOT NULL,
        password    TEXT NOT NULL,
        name        TEXT NOT NULL,
        age         INTEGER NOT NULL CHECK (age >= 18 AND age <= 99),
        gender      CHAR(1) NOT NULL CHECK (gender IN ('m','f')),
        seeking     CHAR(1) NOT NULL CHECK (seeking IN ('m','f')),
        age_min     INTEGER NOT NULL DEFAULT 18,
        age_max     INTEGER NOT NULL DEFAULT 99,
        bio         TEXT,
        city        TEXT NOT NULL,
        photo_url   TEXT,
        contact_type TEXT NOT NULL DEFAULT 'Instagram',
        contact_icon TEXT NOT NULL DEFAULT '📸',
        contact_value TEXT NOT NULL DEFAULT '',
        created_at  TIMESTAMPTZ DEFAULT NOW(),
        updated_at  TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    -- Daily assignments: which 4 profiles does each user see today
    await client.query(`
      CREATE TABLE IF NOT EXISTS daily_picks (
        id          SERIAL PRIMARY KEY,
        user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        profile_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        pick_date   DATE NOT NULL DEFAULT CURRENT_DATE,
        UNIQUE(user_id, pick_date, profile_id)
      )
    `);

    -- When user_id chooses profile_id
    await client.query(`
      CREATE TABLE IF NOT EXISTS choices (
        id          SERIAL PRIMARY KEY,
        chooser_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        chosen_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        pick_date   DATE NOT NULL DEFAULT CURRENT_DATE,
        created_at  TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(chooser_id, pick_date)
      )
    `);

    -- A match exists when both users chose each other on the same day
    await client.query(`
      CREATE TABLE IF NOT EXISTS matches (
        id          SERIAL PRIMARY KEY,
        user_a_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        user_b_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        matched_on  DATE NOT NULL DEFAULT CURRENT_DATE,
        created_at  TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(user_a_id, user_b_id)
      )
    `);

    -- Web push subscriptions for push notifications
    await client.query(`
      CREATE TABLE IF NOT EXISTS push_subscriptions (
        id          SERIAL PRIMARY KEY,
        user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        endpoint    TEXT NOT NULL UNIQUE,
        p256dh      TEXT NOT NULL,
        auth        TEXT NOT NULL,
        created_at  TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await client.query('COMMIT');
    console.log('✅ Migration complete');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
