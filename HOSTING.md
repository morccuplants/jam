# 🌙 Twilight — Hosting & Setup Guide

Everything you need to go from code to live app. Total cost: **$0/month** on free tiers.

---

## Architecture Overview

```
Users → Vercel (frontend) → Render.com (API) → Supabase (PostgreSQL)
                               ↓
                        Web Push (notifications)
```

---

## Step 1: Set Up the Database (Supabase)

**Supabase** gives you a free hosted PostgreSQL database.

1. Go to [supabase.com](https://supabase.com) → **New project**
2. Choose a name (e.g. `twilight`), set a strong database password, pick a region close to your users
3. Wait ~2 minutes for provisioning
4. Go to **Settings → Database → Connection string → URI**
5. Copy the URI — it looks like:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxxx.supabase.co:5432/postgres
   ```
6. Save this — you'll need it in Step 3

---

## Step 2: Generate Secrets

Open a terminal on your local machine.

### JWT Secret
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```
Copy the output — this is your `JWT_SECRET`.

### VAPID Keys (for push notifications)
```bash
npm install -g web-push
npx web-push generate-vapid-keys
```
Copy both the **Public Key** and **Private Key**.

---

## Step 3: Deploy the Backend (Render.com)

**Render** gives you a free Node.js server (spins down after 15min inactivity on free tier — upgrade to $7/mo to keep it always-on).

### 3a. Push to GitHub

```bash
# From the twilight/ folder
git init
git add .
git commit -m "Initial commit"
# Create a repo on github.com, then:
git remote add origin https://github.com/YOUR_USERNAME/twilight.git
git push -u origin main
```

### 3b. Create a Render Web Service

1. Go to [render.com](https://render.com) → **New → Web Service**
2. Connect your GitHub repo
3. Configure:
   - **Name**: `twilight-api`
   - **Root Directory**: `backend`
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: Free

### 3c. Add Environment Variables

In Render → your service → **Environment**, add these:

| Key | Value |
|-----|-------|
| `DATABASE_URL` | Your Supabase connection string from Step 1 |
| `JWT_SECRET` | Generated in Step 2 |
| `VAPID_PUBLIC_KEY` | Generated in Step 2 |
| `VAPID_PRIVATE_KEY` | Generated in Step 2 |
| `VAPID_EMAIL` | `mailto:your@email.com` |
| `FRONTEND_URL` | `https://twilight-app.vercel.app` *(fill in after Step 4)* |
| `NODE_ENV` | `production` |

### 3d. Run the Database Migration

Once deployed, go to Render → your service → **Shell** and run:

```bash
npm run db:migrate
```

This creates all the tables. You only need to run this once.

### 3e. Note your API URL

Render gives you a URL like `https://twilight-api.onrender.com`. Save it.

---

## Step 4: Deploy the Frontend (Vercel)

**Vercel** gives you free hosting for React/Vite apps with automatic deployments.

### 4a. Deploy

1. Go to [vercel.com](https://vercel.com) → **New Project**
2. Import your GitHub repo
3. Configure:
   - **Root Directory**: `frontend`
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

### 4b. Add Environment Variable

In Vercel → Project Settings → **Environment Variables**:

| Key | Value |
|-----|-------|
| `VITE_API_URL` | `https://twilight-api.onrender.com` (your Render URL) |

### 4c. Redeploy

After adding the env variable, trigger a redeploy: **Deployments → Redeploy**.

### 4d. Update FRONTEND_URL on Render

Go back to Render → Environment, update `FRONTEND_URL` to your Vercel URL (e.g. `https://twilight.vercel.app`).

---

## Step 5: Add Push Notification Icons

The PWA and push notifications need icon files. Create two square PNG images and place them in `frontend/public/`:

- `icon-192.png` — 192×192px
- `icon-512.png` — 512×512px

You can use any image editor or [favicon.io](https://favicon.io) to generate them quickly.

---

## Step 6: Test Everything

1. **Open your Vercel URL** in a browser
2. **Register** a new account — you should reach the main app
3. **Register a second account** in an incognito window (same city, compatible preferences)
4. Wait for the 2pm cron or trigger it manually:

   In Render Shell:
   ```bash
   node -e "require('./src/cron/dailyPicks').runDailyPicks()"
   ```

5. **Choose** each other and verify a match + contact info appears
6. **Push notifications**: Accept the browser permission prompt — you should receive a notification when chosen

---

## Photo Storage in Production

The backend currently stores photos on the server disk. On Render's free tier, disk storage resets on redeploy. For production, swap to **Cloudinary** (free tier, 25GB):

1. Sign up at [cloudinary.com](https://cloudinary.com)
2. Install: `npm install cloudinary` in the backend
3. In `backend/src/routes/users.js`, replace the `multer.diskStorage` block with:

```js
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: { folder: 'twilight', allowed_formats: ['jpg', 'png', 'webp'] },
});
```

4. Add `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` to Render's env vars
5. The photo URL returned will be a permanent Cloudinary CDN URL

---

## Cron Job Timezone

The cron runs at `0 14 * * *` — 2pm in the server's local time. Render servers run in UTC.

If your users are in the US East Coast (UTC-5), 2pm EST = 7pm UTC. Adjust the cron accordingly:

```js
// In backend/src/cron/dailyPicks.js
cron.schedule('0 19 * * *', ...); // 7pm UTC = 2pm EST
```

For multiple timezones, switch to a per-user-timezone cron (more complex) or just run at 2pm UTC.

---

## Local Development

```bash
# Terminal 1 — Backend
cd backend
cp .env.example .env   # Fill in your values
npm install
npm run db:migrate     # Run once
npm run dev

# Terminal 2 — Frontend
cd frontend
cp .env.example .env   # Set VITE_API_URL=http://localhost:3001
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## Project File Structure

```
twilight/
├── backend/
│   ├── src/
│   │   ├── index.js              # Express server entry
│   │   ├── db/
│   │   │   ├── pool.js           # DB connection
│   │   │   └── migrate.js        # Creates all tables
│   │   ├── middleware/
│   │   │   └── auth.js           # JWT verification
│   │   ├── routes/
│   │   │   ├── auth.js           # Register / login
│   │   │   ├── users.js          # Profile CRUD + photo upload
│   │   │   ├── discover.js       # Daily picks, choose, match
│   │   │   └── push.js           # Push subscription
│   │   ├── services/
│   │   │   └── push.js           # Web Push sender
│   │   └── cron/
│   │       └── dailyPicks.js     # 2pm daily assignment
│   ├── .env.example
│   └── package.json
│
└── frontend/
    ├── public/
    │   ├── manifest.json         # PWA manifest
    │   ├── sw.js                 # Service worker
    │   ├── icon-192.png          # ← You add this
    │   └── icon-512.png          # ← You add this
    ├── src/
    │   ├── main.jsx              # Entry point + SW registration
    │   ├── App.jsx               # Full UI (onboarding → app)
    │   ├── api.js                # All API calls
    │   └── push.js               # Push permission helper
    ├── index.html
    ├── vite.config.js
    └── package.json
```

---

## What's Real vs. What's Simulated

| Feature | Status |
|---------|--------|
| User registration & login | ✅ Real (JWT auth) |
| Profile storage | ✅ Real (PostgreSQL) |
| Photo upload | ✅ Real (disk / Cloudinary) |
| Daily profile filtering by prefs | ✅ Real (SQL query) |
| Daily picks assignment | ✅ Real (cron at 2pm) |
| Choosing & matching | ✅ Real (database) |
| Push notifications | ✅ Real (Web Push API) |
| Multiple cities | ✅ Real |
| PWA (installable on phone) | ✅ Real |

---

*Built with Express, PostgreSQL, React, Vite, Web Push, and node-cron.*
