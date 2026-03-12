# AI Learn

A gamified internal learning platform for LLM fundamentals, Agentic AI, and AI Security.

**Target URL:** learn.robrag.com
**Users:** ~20–50 internal team members
**Stack:** React + Express + SQLite

---

## Quick Start (Local Development)

### Prerequisites
- Node.js 18+
- npm 9+

### 1. Clone and install dependencies

```bash
git clone <your-repo>
cd ai-learn

# Install server dependencies
cd server && npm install && cd ..

# Install client dependencies
cd client && npm install && cd ..
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env and set a strong JWT_SECRET
```

### 3. Create your first admin user

```bash
cd server
node ../scripts/create-admin.js --email admin@yourcompany.com --password yourpassword --name "Your Name"
```

### 4. Start the development servers

Open two terminals:

**Terminal 1 — API server:**
```bash
cd server
npm run dev
# Runs on http://localhost:3001
```

**Terminal 2 — React client:**
```bash
cd client
npm start
# Runs on http://localhost:3000, proxies /api to :3001
```

Open http://localhost:3000 and sign in with your admin credentials.

---

## Password Reset Flow

There is no email service. To reset a user's password:

1. User submits a reset request at the login screen
2. A token is logged to the **server console** (Terminal 1):
   ```
   [PASSWORD RESET] User: user@company.com
   [PASSWORD RESET] Token: eyJ...
   [PASSWORD RESET] Use: POST /api/auth/reset with { token, newPassword }
   ```
3. Admin copies the token and sends it to the user via Slack/email
4. User calls the reset endpoint (or you build a `/reset` page):
   ```bash
   curl -X POST http://localhost:3001/api/auth/reset \
     -H "Content-Type: application/json" \
     -d '{"token": "eyJ...", "newPassword": "newpassword123"}'
   ```

---

## Production Build

### Build and bundle

```bash
cd client
npm run build          # compiles React to client/dist/
npm run build:copy     # compiles + copies to server/public/
```

### Run in production

```bash
cd server
NODE_ENV=production npm start
# Serves everything on http://localhost:3001
```

Set `PORT` in `.env` to `80` or use a reverse proxy (Nginx/Caddy).

---

## VPS Deployment (Ubuntu/Debian)

### 1. Server setup

```bash
# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 for process management
sudo npm install -g pm2
```

### 2. Deploy the app

```bash
# On your VPS
git clone <your-repo> /opt/ai-learn
cd /opt/ai-learn

cp .env.example .env
# Edit .env — set JWT_SECRET to a long random string and NODE_ENV=production

cd server && npm install --production
cd ../client && npm install && npm run build:copy

# Create first admin
cd ..
node scripts/create-admin.js --email admin@yourcompany.com --password <strongpassword> --name "Admin"
```

### 3. Start with PM2

```bash
cd /opt/ai-learn/server
pm2 start server.js --name ai-learn
pm2 save
pm2 startup
```

### 4. Nginx reverse proxy (recommended)

```nginx
server {
    listen 80;
    server_name learn.robrag.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable HTTPS with Certbot:
```bash
sudo certbot --nginx -d learn.robrag.com
```

### 5. Firewall

```bash
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

---

## Database

SQLite database is stored at `./data/ai-learn.db` (relative to `server/`). Back this up regularly:

```bash
cp /opt/ai-learn/data/ai-learn.db /opt/ai-learn/data/ai-learn.db.bak
```

---

## Course Structure

- **Section 1: LLM Basics** — 6 subsections, unlocked by default
- **Section 2: Agentic AI** — 6 subsections, unlocks when LLM Basics #1 is complete
- **Section 3: AI Security** — 6 subsections, unlocks when Agentic AI #1 is complete

### Auto Badges

| Badge | Trigger |
|---|---|
| First Steps | Complete "What Are LLMs?" |
| LLM Master | Complete all LLM Basics |
| Agentic Thinker | Complete "What Is Agentic AI?" |
| Agent Architect | Complete all Agentic AI |
| Security Sentinel | Complete all AI Security |
| Full Stack | Complete all 18 subsections |

---

## API Reference

```
POST /api/auth/signup           { email, password, name }
POST /api/auth/login            { email, password } → { token, user }
POST /api/auth/reset-request    { email }
POST /api/auth/reset            { token, newPassword }

GET  /api/me                    → { user, progress, badges }
POST /api/progress              { sectionId, subsectionId, quizScore }
POST /api/badges/auto-check     { subsectionId } → { newBadges[] }

GET  /api/admin/users           admin only
GET  /api/admin/users/:id       admin only
POST /api/admin/badges          admin only — create custom badge
GET  /api/admin/badges          admin only
POST /api/admin/badges/award    admin only — { userId, badgeId }
GET  /api/admin/analytics       admin only
```

---

## Maintenance

This app is designed to be set-and-forget:
- No email service required
- No background jobs
- No external dependencies at runtime
- SQLite means no database server to maintain
- PM2 auto-restarts on crash

To update content, edit `client/src/content/course.js` and rebuild.
