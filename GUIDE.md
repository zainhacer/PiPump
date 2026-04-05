# 🚀 PiPump — Complete Setup & Deployment Guide

**Pi Network ka pump.fun — Meme token launchpad on Pi Blockchain (Testnet)**

---

## 📋 Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Prerequisites](#3-prerequisites)
4. [Step 1 — GitHub Repository Setup](#4-step-1--github-repository-setup)
5. [Step 2 — Supabase Setup](#5-step-2--supabase-setup)
6. [Step 3 — Pi Developer Portal Setup](#6-step-3--pi-developer-portal-setup)
7. [Step 4 — Local Installation](#7-step-4--local-installation)
8. [Step 5 — Environment Variables](#8-step-5--environment-variables)
9. [Step 6 — Run Locally](#9-step-6--run-locally)
10. [Step 7 — GitHub Pages Deployment](#10-step-7--github-pages-deployment)
11. [Step 8 — Pi Portal Final Config](#11-step-8--pi-portal-final-config)
12. [Step 9 — Admin Setup](#12-step-9--admin-setup)
13. [Project Structure](#13-project-structure)
14. [Features Guide](#14-features-guide)
15. [Troubleshooting](#15-troubleshooting)
16. [Mainnet Migration](#16-mainnet-migration)

---

## 1. Project Overview

PiPump is a **pump.fun-style meme token launchpad** built on Pi Network.

- 🪙 **Create tokens** — pay 1π creation fee, token launches instantly
- 📈 **Buy & Sell** — constant product AMM bonding curve
- 💼 **Portfolio** — track holdings, PnL, trade history
- 🎓 **Graduation** — when 800π collected, token graduates
- 🛡️ **Admin Dashboard** — full platform controls

### How the Bonding Curve Works

```
k = virtualPiReserve × virtualTokenReserve = CONSTANT

Starting state per token:
  virtualPiReserve    = 1,000 Pi  (virtual)
  virtualTokenReserve = 1,000,000,000 tokens
  k                   = 1,000,000,000,000

Buy  → Pi in  → token reserve ↓ → price ↑
Sell → Pi out → token reserve ↑ → price ↓

Starting Price = 0.000001 π per token
Graduation    = when real Pi collected ≥ 800π
```

---

## 2. Tech Stack

| Layer        | Technology                          |
|-------------|-------------------------------------|
| Frontend    | React 18 + Vite + Tailwind CSS       |
| Database    | Supabase (Postgres + Realtime)       |
| Auth        | Pi SDK (Pi wallet = identity)        |
| Payments    | Pi SDK createPayment()               |
| Charts      | Recharts                             |
| Image Store | Supabase Storage                     |
| Hosting     | GitHub Pages                         |

---

## 3. Prerequisites

```bash
node --version   # v18 or higher required
npm --version    # v9 or higher
git --version
```

**Accounts needed:**
- [GitHub](https://github.com) account
- [Supabase](https://supabase.com) free account
- [Pi Developer Portal](https://develop.pi) account

---

## 4. Step 1 — GitHub Repository Setup

### Create Repository

1. Go to [github.com/new](https://github.com/new)
2. Repository name: `pipump`
3. Visibility: **Public** (required for GitHub Pages free tier)
4. Click **Create repository**

### Push Code

```bash
cd pipump
git init
git add .
git commit -m "Initial PiPump commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/pipump.git
git push -u origin main
```

> Replace `YOUR_USERNAME` with your actual GitHub username everywhere in this guide.

---

## 5. Step 2 — Supabase Setup

### Create Project

1. Go to [supabase.com](https://supabase.com) → **New Project**
2. Name: `pipump`
3. Choose a strong database password (save it)
4. Region: closest to your users
5. Click **Create new project** — wait ~2 minutes

### Run Database Schema

1. Supabase dashboard → **SQL Editor** (left sidebar)
2. Click **New query**
3. Open `supabase_schema.sql` from this project folder
4. Copy ALL contents → Paste into the SQL Editor
5. Click **RUN** (green button)
6. Expected result: "Success. No rows returned"

This creates:
- 7 tables (users, tokens, trades, token_holders, platform_config, reports, site_content)
- All indexes for fast queries
- RLS security policies
- Bonding curve SQL functions (execute_trade, get_buy_quote, get_sell_quote)
- Realtime enabled on tokens, trades, token_holders

### Create Storage Bucket

1. Supabase dashboard → **Storage** (left sidebar)
2. Click **New bucket**
3. Name: `pipump` (must be exactly this)
4. Toggle **Public bucket**: ON
5. Click **Create bucket**

### Get Your API Keys

1. Supabase → **Project Settings** → **API**
2. Save these two values:
   - **Project URL**: `https://xxxxxxxxxxx.supabase.co`
   - **anon public key**: `eyJhbGciOiJ...` (long string)

---

## 6. Step 3 — Pi Developer Portal Setup

### Register Your App

1. Go to [develop.pi](https://develop.pi) — sign in with Pi account
2. Click **Register an App**
3. Fill in:
   - **App Name**: `pipump` (lowercase, no spaces, remember this exactly)
   - **App URL**: `https://YOUR_USERNAME.github.io/pipump/`
   - **Wallet Address**: Your Pi wallet address (for receiving fees)
4. Click **Register**

### Enable Permissions

In app settings, enable these scopes:
- `username`
- `payments`
- `wallet_address`

---

## 7. Step 4 — Local Installation

```bash
cd pipump
npm install --legacy-peer-deps
```

> `--legacy-peer-deps` is always required for this project.

If errors occur:
```bash
npm install --legacy-peer-deps --force
```

---

## 8. Step 5 — Environment Variables

```bash
cp .env.example .env
```

Open `.env` in VS Code and fill in all values:

```env
# ── Supabase ─────────────────────────────────────────────
VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ── Pi Network ───────────────────────────────────────────
VITE_PI_APP_NAME=pipump
VITE_PI_SANDBOX=true

# ── Platform Wallet ──────────────────────────────────────
VITE_PLATFORM_WALLET_ADDRESS=your_pi_wallet_address

# ── Admin (your Pi UID — find it after first login) ──────
VITE_ADMIN_UIDS=your_pi_uid_here

# ── App Config ───────────────────────────────────────────
VITE_CREATION_FEE=1
VITE_TRADE_FEE_PERCENT=1
VITE_GRADUATION_THRESHOLD=800
VITE_BASE_URL=/pipump/
```

### How to find your Pi UID

1. Run the site locally (`npm run dev`)
2. Open Pi Browser on your phone → navigate to `http://YOUR_PC_IP:3000/pipump/`
3. Connect wallet
4. Go to Supabase → Table Editor → `users` table
5. Find your row → copy the `pi_uid` value
6. Paste it into `VITE_ADMIN_UIDS` in `.env`

---

## 9. Step 6 — Run Locally

```bash
npm run dev
```

Visit `http://localhost:3000` in your browser.

**Works in normal browser:**
- Homepage, all sections
- Search, filters
- Token detail page (view only)
- Profile pages (view only)

**Requires Pi Browser (mobile):**
- Wallet connect
- Buy / Sell tokens
- Create token (Pi payment)

To test on Pi Browser, find your PC's local IP:
```bash
# Windows
ipconfig
# Look for IPv4 Address e.g. 192.168.1.5

# Mac/Linux
ifconfig | grep inet
```

Then open Pi Browser on phone → `http://192.168.1.5:3000/pipump/`

---

## 10. Step 7 — GitHub Pages Deployment

### Verify vite.config.js

```js
// vite.config.js
export default defineConfig({
  base: '/pipump/',  // must match your GitHub repo name EXACTLY
  ...
})
```

### Deploy Command

```bash
npm run deploy
```

This builds the project and pushes to `gh-pages` branch automatically.

### Enable GitHub Pages

1. GitHub repo → **Settings** tab
2. Left sidebar → **Pages**
3. Source: **Deploy from a branch**
4. Branch: **gh-pages** | **/ (root)**
5. Click **Save**

Wait 2-3 minutes, then open:
```
https://YOUR_USERNAME.github.io/pipump/
```

### Future Deployments

Every time you make changes:
```bash
git add .
git commit -m "Your changes"
git push
npm run deploy
```

---

## 11. Step 8 — Pi Portal Final Config

Update `public/.well-known/pi.toml` with your live URL:

```toml
[app]
name = "pipump"
description = "PiPump — Launch and trade memecoins on Pi Network"
url = "https://YOUR_USERNAME.github.io/pipump/"

[payments]
enabled = true
```

Then update Pi Developer Portal:
1. Go to your app on [develop.pi](https://develop.pi)
2. Update **App URL** to: `https://YOUR_USERNAME.github.io/pipump/`
3. Save

Redeploy:
```bash
npm run deploy
```

---

## 12. Step 9 — Admin Setup

### Set Admin Access

In your `.env` file:
```env
VITE_ADMIN_UIDS=your_pi_uid_here
```

Multiple admins (comma separated):
```env
VITE_ADMIN_UIDS=uid1,uid2,uid3
```

Redeploy after editing `.env`:
```bash
npm run deploy
```

### Access Admin Dashboard

Navigate to: `https://YOUR_USERNAME.github.io/pipump/admin`

---

## 13. Project Structure

```
pipump/
├── public/
│   ├── 404.html                     ← GitHub Pages SPA routing fix
│   └── .well-known/pi.toml          ← Pi Network app verification
│
├── src/
│   ├── components/
│   │   ├── admin/
│   │   │   ├── AdminStats.jsx       ← Platform overview cards
│   │   │   ├── TokenManager.jsx     ← Token controls
│   │   │   ├── UserManager.jsx      ← User ban/admin controls
│   │   │   ├── ReportsQueue.jsx     ← User reports
│   │   │   └── PlatformSettings.jsx ← Fees + CMS
│   │   ├── create/
│   │   │   ├── ImageUploader.jsx    ← Drag & drop upload
│   │   │   ├── TokenPreviewCard.jsx ← Live preview
│   │   │   └── CreationFeeBox.jsx   ← Fee display
│   │   ├── home/
│   │   │   ├── TickerTape.jsx       ← Live price ticker
│   │   │   ├── HeroSection.jsx      ← Hero + stats
│   │   │   ├── HotCoins.jsx         ← Top by volume
│   │   │   ├── TrendingCoins.jsx    ← Top by price change
│   │   │   ├── NewCoins.jsx         ← Latest tokens
│   │   │   ├── GraduatingCoins.jsx  ← Near 800π
│   │   │   ├── SearchBar.jsx        ← Search dropdown
│   │   │   └── FilterTabs.jsx       ← Filter tabs
│   │   ├── layout/
│   │   │   ├── Navbar.jsx           ← Top nav + wallet btn
│   │   │   └── BottomNav.jsx        ← Mobile bottom tabs
│   │   ├── profile/
│   │   │   ├── ProfileHeader.jsx    ← Avatar, stats, edit
│   │   │   ├── CreatedTokensList.jsx
│   │   │   ├── PortfolioList.jsx
│   │   │   └── UserTradeHistory.jsx
│   │   └── token/
│   │       ├── TokenCard.jsx        ← Token card component
│   │       ├── BondingCurveChart.jsx← AMM chart
│   │       ├── BuySellPanel.jsx     ← Trading interface
│   │       ├── TradeHistory.jsx     ← Live trade feed
│   │       ├── TokenInfo.jsx        ← Token details
│   │       └── HoldersTab.jsx       ← Top holders
│   │
│   ├── hooks/
│   │   ├── useAuth.js               ← Pi wallet auth context
│   │   ├── useTokens.js             ← Token data + realtime
│   │   ├── useProfile.js            ← Profile + portfolio
│   │   ├── useAdmin.js              ← Admin data + actions
│   │   └── useImageUpload.js        ← Image upload
│   │
│   ├── lib/
│   │   ├── supabase.js              ← Supabase client
│   │   ├── piSDK.js                 ← Real Pi wallet
│   │   └── bondingCurve.js          ← AMM math engine
│   │
│   ├── pages/
│   │   ├── Home.jsx
│   │   ├── TokenDetail.jsx
│   │   ├── CreateToken.jsx
│   │   ├── Profile.jsx
│   │   └── Admin.jsx
│   │
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
│
├── supabase_schema.sql              ← Run this in Supabase!
├── .env.example                     ← Copy to .env
├── package.json
├── vite.config.js
├── tailwind.config.js
└── GUIDE.md
```

---

## 14. Features Guide

### Homepage Sections

| Section | How it works |
|---------|-------------|
| Ticker Tape | Scrolling live prices, updates via Supabase Realtime |
| Hero | Platform stats pulled from `platform_config` table |
| Graduating Soon | Tokens with `real_pi_collected >= 500`, horizontal scroll |
| Hot Coins | Sorted by `volume_24h DESC`, top 5 |
| Trending | Sorted by `price_change_24h DESC`, top 5 |
| New Coins | Sorted by `created_at DESC`, live INSERT subscription |
| Search | Debounced 300ms, searches name + ticker |

### Token Detail Page

**Buy Flow:**
```
1. User enters Pi amount
2. getBuyQuote() → calculates tokens out + price impact
3. User clicks Buy
4. Pi SDK createPayment() → Pi Browser opens
5. User confirms in Pi app
6. onReadyForServerApproval → pending trade saved to DB
7. onReadyForServerCompletion → execute_trade() SQL function
8. Reserves updated atomically, price changes
9. Realtime broadcast → all viewers see new price
```

**Sell Flow (Testnet):**
```
1. User enters token amount
2. getSellQuote() → calculates Pi out
3. User clicks Sell
4. execute_trade() runs directly (testnet simulation)
5. Token balance decreases, reserves update
```

### Create Token Flow

```
Step 1: Name + Ticker + Description + Image
  → Ticker uniqueness check against DB
  → Image stored in Supabase Storage

Step 2: Website + Twitter + Telegram (optional)

Step 3: Review → Pay 1π via Pi SDK
  → Image uploaded to Supabase Storage
  → Pi payment confirmed
  → Token inserted to DB with initial AMM state
  → Appears on homepage live feed instantly
```

### Admin Controls Summary

| Section | Controls |
|---------|---------|
| Overview | Live stats, volume charts, user counts |
| Tokens | Suspend, Feature, Verify, Graduate, Delete |
| Users | Ban (suspends tokens too), Make Admin |
| Reports | Review user reports, suspend or dismiss |
| Settings | Fees, graduation threshold, maintenance mode, CMS |

---

## 15. Troubleshooting

### npm install fails

```bash
npm install --legacy-peer-deps
# or
npm install --legacy-peer-deps --force
```

### Blank page on GitHub Pages

Make sure these match EXACTLY:
```js
// vite.config.js
base: '/pipump/'  // same as your repo name
```
```env
# .env
VITE_BASE_URL=/pipump/
```

### Supabase schema errors

If you see "already exists" errors, drop and recreate:
```sql
-- Run in Supabase SQL Editor
DROP TABLE IF EXISTS public.reports CASCADE;
DROP TABLE IF EXISTS public.site_content CASCADE;
DROP TABLE IF EXISTS public.platform_config CASCADE;
DROP TABLE IF EXISTS public.token_holders CASCADE;
DROP TABLE IF EXISTS public.trades CASCADE;
DROP TABLE IF EXISTS public.tokens CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
```
Then re-run the full `supabase_schema.sql`.

### Storage upload fails

Run in Supabase SQL Editor:
```sql
CREATE POLICY "allow_uploads" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'pipump');

CREATE POLICY "allow_public_read" ON storage.objects
FOR SELECT USING (bucket_id = 'pipump');
```

### Realtime not working

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.tokens;
ALTER PUBLICATION supabase_realtime ADD TABLE public.trades;
ALTER PUBLICATION supabase_realtime ADD TABLE public.token_holders;
```

### Pi wallet not connecting

1. Must be opened in **Pi Browser** app on mobile
2. `VITE_PI_SANDBOX=true` for testnet
3. App name in `.env` must match Pi Developer Portal exactly
4. `pi.toml` URL must match live site URL

### Admin shows "Access Denied"

1. Add Pi UID to `.env`:
   ```env
   VITE_ADMIN_UIDS=your_exact_pi_uid
   ```
2. Redeploy: `npm run deploy`
3. Or set manually in Supabase: `users` table → `is_admin = true`

---

## 16. Mainnet Migration

When ready to go live on Pi Mainnet:

### 1. Update Environment

```env
VITE_PI_SANDBOX=false
```

### 2. Pi Developer Portal

- Disable sandbox mode in your app settings

### 3. Sell Payments on Mainnet

On mainnet, the platform must **send Pi to users** when they sell. Options:

**Option A — Manual payouts:**
Admin reviews sell queue in admin dashboard and manually sends Pi via Pi app.

**Option B — Supabase Edge Function:**
```
User sells → Edge Function triggered
→ Calls Pi Server SDK
→ Sends Pi to user automatically
```

**Option C — Node.js backend server:**
Deploy a small Express server that watches for pending sells and processes them with Pi Server SDK.

### 4. Production Checklist

- [ ] `VITE_PI_SANDBOX=false`
- [ ] Pi Portal sandbox disabled
- [ ] Platform wallet funded with Pi (for sells)
- [ ] Tested full buy/sell cycle on mainnet
- [ ] Admin dashboard working
- [ ] Gradution mechanism tested

---

## ⚡ Quick Reference Commands

```bash
npm install --legacy-peer-deps   # Install dependencies
npm run dev                       # Run locally (port 3000)
npm run build                     # Build for production
npm run deploy                    # Build + deploy to GitHub Pages
npm run preview                   # Preview production build
```

## 🔗 App URLs

| Route | Page |
|-------|------|
| `/` | Homepage |
| `/token/:id` | Token detail + trading |
| `/create` | Create new token |
| `/profile` | Your profile |
| `/profile/:uid` | Any user's profile |
| `/admin` | Admin dashboard |

---

## ✅ Launch Checklist

- [ ] GitHub repo created and code pushed
- [ ] Supabase project created
- [ ] `supabase_schema.sql` executed successfully
- [ ] Storage bucket `pipump` created (public)
- [ ] `.env` fully filled in
- [ ] `vite.config.js` base = `/pipump/`
- [ ] `pi.toml` URL updated
- [ ] Pi Developer Portal app URL updated
- [ ] `npm run deploy` successful
- [ ] Site live at `github.io/pipump/`
- [ ] Wallet connects in Pi Browser
- [ ] Token creation works end-to-end
- [ ] Buy/sell works
- [ ] Admin dashboard accessible
- [ ] Admin UID configured

---

*PiPump — Launch your memecoin. Ride the curve. 🚀*
*Built for Pi Network community.*
