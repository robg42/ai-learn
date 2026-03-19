# AI Learn

A gamified internal learning platform for LLM fundamentals, Agentic AI, and AI Security.

**URL:** learn.robgregg.com
**Users:** ~20–50 internal team members
**Stack:** React + Express + Turso (libSQL) + Vercel

---

## Authentication

The app uses **magic link authentication** — no passwords.

1. User enters their email on the login screen
2. They receive an email with a one-time link (valid 15 minutes)
3. Clicking the link signs them in

Users cannot self-register. **Admins create accounts** via the admin dashboard (`/admin`).

---

## Quick Start (Local Development)

### Prerequisites
- Node.js 18+
- A [Turso](https://turso.tech) database (free tier works fine)
- A Gmail account for sending magic links (optional — falls back to console logging)

### 1. Clone and install

```bash
git clone https://github.com/robg42/ai-learn.git
cd ai-learn
npm install          # root
cd client && npm install && cd ..
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env`:

```env
# Required
JWT_SECRET=your-long-random-secret
TURSO_DATABASE_URL=libsql://your-db.turso.io
TURSO_AUTH_TOKEN=your-turso-token

# Magic link base URL (where users click through to)
MAGIC_LINK_BASE_URL=http://localhost:3000

# Optional — Gmail for sending magic links
GMAIL_USER=you@gmail.com
GMAIL_PASS=your-app-password   # Gmail App Password, not your account password
```

If Gmail is not configured, magic link tokens are printed to the server console instead.

### 3. Start the development servers

**Terminal 1 — API server:**
```bash
node server/server.js
# Runs on http://localhost:3001
```

**Terminal 2 — React client:**
```bash
cd client && npx webpack serve --mode development
# Runs on http://localhost:3000, proxies /api to :3001
```

### 4. Create your first admin

The first user must be created directly in the Turso database, or by temporarily inserting a row:

```bash
# Using the Turso CLI
turso db shell your-db-name \
  "INSERT INTO users (email, name, role) VALUES ('you@company.com', 'Your Name', 'admin');"
```

After that, all user management is done through the admin dashboard.

---

## Admin Dashboard

Navigate to `/admin` (admin role required).

- **Users tab** — create/delete users, promote to admin, toggle leaderboard visibility
- **Badges tab** — create custom badges, award badges to users
- **Analytics tab** — completion rates, quiz scores, activity over time

---

## Deployment (Vercel)

The app is deployed on Vercel with the following configuration in `vercel.json`:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "public",
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/api/index" },
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### Environment variables (set in Vercel dashboard)

| Variable | Description |
|---|---|
| `JWT_SECRET` | Long random string for signing session tokens |
| `TURSO_DATABASE_URL` | Your Turso database URL |
| `TURSO_AUTH_TOKEN` | Your Turso auth token |
| `MAGIC_LINK_BASE_URL` | Production URL e.g. `https://learn.robgregg.com` |
| `GMAIL_USER` | Gmail address for sending magic links |
| `GMAIL_PASS` | Gmail App Password |

---

## Course Structure

3 sections × 18 lessons = **54 lessons total**

| Section | Unlocks when |
|---|---|
| LLM Basics | Always available |
| Agentic AI | LLM Basics lesson 1 complete |
| AI Security | Agentic AI lesson 1 complete |

Within each section, lessons unlock sequentially. Quizzes must be passed to proceed.

---

## Features

- **Magic link auth** — passwordless, admin-provisioned accounts
- **Sequential lesson unlocking** with quiz gates
- **Badges** — auto-awarded on lesson/section completion, plus admin-created custom badges
- **Leaderboard** — per-user show/view controls managed by admin
- **Notes** — auto-saved per lesson
- **Quiz score history** on profile
- **Completion certificates** — downloadable PDF per completed section
- **Share progress card** — copy-to-clipboard summary
- **Lesson search** in the learn sidebar
- **Milestone emails** — on section and full course completion
- **Welcome email** on account creation

---

## API Reference

### Auth
```
POST /api/auth/magic-request    { email } — send magic link
POST /api/auth/magic-verify     { token } → { token, user }
PATCH /api/auth/me              { name } — update display name
```

### User
```
GET  /api/me                    → { user, progress, badges }
POST /api/progress              { sectionId, subsectionId, quizScore }
POST /api/badges/auto-check     { subsectionId } → { newBadges[] }
GET  /api/badges                → all badge definitions (for catalog)
GET  /api/leaderboard           → public leaderboard (show_on_leaderboard=1 only)
GET  /api/notes/:subsectionId   → user's note for lesson
PUT  /api/notes/:subsectionId   { content } — upsert note
```

### Admin (requires admin role)
```
GET    /api/admin/users
POST   /api/admin/users                     { email, name }
DELETE /api/admin/users/:id
PATCH  /api/admin/users/:id/role            { role }
PATCH  /api/admin/users/:id/leaderboard     { showOnLeaderboard, canViewLeaderboard }
GET    /api/admin/users/:id
GET    /api/admin/badges
POST   /api/admin/badges                    { name, description, icon, color }
POST   /api/admin/badges/award              { userId, badgeId }
GET    /api/admin/analytics
```

---

## Database

Uses [Turso](https://turso.tech) (libSQL) in production. Schema is created automatically on first run via `server/db.js`.

To back up the database:
```bash
turso db shell your-db-name ".dump" > backup.sql
```

---

## Updating Content

All course content lives in `client/src/content/course.js`. Edit lessons, quizzes, and section metadata there, then push — Vercel will rebuild automatically.
