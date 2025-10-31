# 🚀 Vercel Deployment Guide - EuroCoin Web Wallet

> **Comprehensive production deployment guide for deploying the EuroCoin Web Wallet to Vercel**

## 📋 Table of Contents

- [Project Overview](#project-overview)
- [Deployment Readiness Assessment](#deployment-readiness-assessment)
- [Prerequisites](#prerequisites)
- [Phase 1: External Services Setup](#phase-1-external-services-setup)
- [Phase 2: Database Configuration](#phase-2-database-configuration)
- [Phase 3: Vercel Project Setup](#phase-3-vercel-project-setup)
- [Phase 4: Environment Variables](#phase-4-environment-variables)
- [Phase 5: Initial Deployment](#phase-5-initial-deployment)
- [Phase 6: Post-Deployment Configuration](#phase-6-post-deployment-configuration)
- [Phase 7: Testing & Verification](#phase-7-testing--verification)
- [Troubleshooting](#troubleshooting)
- [Maintenance](#maintenance)

---

## 📊 Project Overview

**EuroCoin Web Wallet** is a Next.js 16 application with the following stack:

- **Frontend:** Next.js 16 (App Router), React 19, TailwindCSS
- **Authentication:** NextAuth.js v5 (Google OAuth, Email Magic Links)
- **Blockchain:** wagmi v2 + viem (MetaMask integration)
- **Database:** PostgreSQL + Drizzle ORM
- **Cache:** Redis (for sessions, rate limiting)
- **Email:** Resend API
- **Notifications:** Telegram Bot API (Telegraf)
- **Deployment:** Vercel (recommended), Netlify (alternative)

---

## ✅ Deployment Readiness Assessment

### Current Status: **90% Ready for Production** 🟢

#### ✅ Completed Features

| Feature | Status | Notes |
|---------|--------|-------|
| **Authentication System** | ✅ Ready | Google OAuth + Email working |
| **MetaMask Integration** | ✅ Ready | wagmi v2 configured for Sepolia + Mainnet |
| **Database Schema** | ✅ Ready | 12 tables, migrations available |
| **Support Messenger** | ✅ Ready | Real-time support chat with Telegram integration |
| **Exchange Forms** | ✅ Ready | Token exchange + internal requests |
| **Tax Calculator** | ✅ Ready | On-chain tax calculation |
| **Email Notifications** | ✅ Ready | Resend integration |
| **Telegram Bot** | ✅ Ready | Admin notifications + replies |
| **Security Headers** | ✅ Ready | CSP, HSTS, X-Frame-Options configured |
| **TypeScript** | ✅ Ready | Strict mode, fully typed |
| **i18n** | ✅ Ready | Russian + English |

#### ⚠️ Pre-Deployment Requirements

| Task | Priority | Status | Notes |
|------|----------|--------|-------|
| **Production Database** | 🔴 Critical | ❌ Pending | Need Vercel Postgres or external provider |
| **Redis Instance** | 🔴 Critical | ❌ Pending | Upstash Redis recommended for Vercel |
| **Environment Variables** | 🔴 Critical | ❌ Pending | 20+ variables to configure |
| **OAuth Redirect URLs** | 🔴 Critical | ❌ Pending | Update Google Console with production URL |
| **Database Migrations** | 🔴 Critical | ✅ Ready | 7 migration files prepared |
| **Telegram Webhook** | 🟡 Important | ❌ Pending | Set production webhook URL |
| **Domain Configuration** | 🟡 Important | ❌ Pending | Custom domain or Vercel subdomain |
| **Analytics Setup** | 🟢 Optional | ❌ Pending | Google Analytics, Sentry |
| **Rate Limiting** | 🟡 Important | ⚠️ Partial | Currently in-memory, needs Redis |

#### 🔧 Known Limitations

1. **Rate Limiting:** Currently uses in-memory storage (will reset on serverless function restart). Recommend migrating to Upstash Redis.
2. **Session Storage:** Using JWT (good for Vercel), but consider database sessions for enterprise.
3. **File Uploads:** Not implemented (no avatar uploads yet).
4. **Monitoring:** No APM/error tracking configured (recommend Sentry).

---

## 🛠️ Prerequisites

### Required Accounts

- [ ] **Vercel Account** (free tier sufficient for start)
- [ ] **GitHub Account** (for repository hosting)
- [ ] **PostgreSQL Database** (Vercel Postgres, Supabase, or Neon)
- [ ] **Redis Instance** (Upstash Redis recommended)
- [ ] **Resend Account** (email sending)
- [ ] **Google Cloud Console** (OAuth)
- [ ] **Telegram Bot** (notifications)

### Local Development Setup

```bash
# Verify Node.js version
node --version  # Should be v20.17.0 or higher

# Verify npm version
npm --version   # Should be 10.8.2 or higher

# Test build locally
npm run build
npm run start

# Run type checking
npm run type-check
```

---

## Phase 1: External Services Setup

### 1.1 Database: PostgreSQL

#### **Option A: Vercel Postgres** (Recommended for Vercel) 🌟

**Pros:**
- Zero-config integration with Vercel
- Automatic connection pooling
- Built-in backups
- Free tier: 256 MB storage, 60 hours compute

**Setup:**
1. Go to your Vercel project dashboard
2. Navigate to **Storage** tab
3. Click **Create Database** → Select **Postgres**
4. Choose region (closest to your users)
5. Click **Create**
6. Copy `POSTGRES_URL` environment variable

**Pricing:**
- Free: 256 MB storage
- Pro: $0.06/GB storage + compute hours

#### **Option B: Supabase** (Good for complex queries)

**Pros:**
- Full PostgreSQL 15
- Real-time subscriptions
- Built-in authentication (can complement NextAuth)
- Generous free tier: 500 MB, 2GB bandwidth

**Setup:**
1. Sign up at [supabase.com](https://supabase.com)
2. Create new project
3. Go to **Settings** → **Database**
4. Copy **Connection String** (pooler mode)
5. Format: `postgresql://postgres:[password]@[host]:5432/postgres`

**Pricing:**
- Free: 500 MB, 2GB egress
- Pro: $25/month unlimited

#### **Option C: Neon** (Serverless PostgreSQL)

**Pros:**
- Serverless (only pay for active time)
- Instant branching
- Auto-scaling
- Free tier: 3GB storage

**Setup:**
1. Sign up at [neon.tech](https://neon.tech)
2. Create project
3. Copy connection string
4. Enable connection pooling

**Pricing:**
- Free: 3GB storage, 100 compute hours
- Launch: $19/month

### 1.2 Redis: Upstash

**Why Upstash?**
- Serverless (pay-per-request)
- Global edge caching
- REST API (no persistent connections needed)
- Free tier: 10,000 requests/day

**Setup:**
1. Sign up at [upstash.com](https://upstash.com)
2. Create Redis database
3. Select region closest to your Vercel deployment
4. Enable **TLS** and **REST API**
5. Copy credentials:
   ```
   UPSTASH_REDIS_REST_URL=https://your-db.upstash.io
   UPSTASH_REDIS_REST_TOKEN=your-token
   ```

**Pricing:**
- Free: 10,000 commands/day
- Pay as you go: $0.20 per 100K commands

### 1.3 Email: Resend

**Setup:**
1. Sign up at [resend.com](https://resend.com)
2. Add and verify your domain (e.g., `mail.your-domain.com`)
3. Create API key
4. Configure DNS records:
   ```
   Type: TXT
   Name: _resend
   Value: [verification code]
   ```
5. Copy API key: `RESEND_API_KEY=re_...`

**Sender Email:**
```
SENDER_EMAIL=noreply@your-domain.com
RECIPIENT_EMAIL=admin@your-domain.com
```

**Pricing:**
- Free: 3,000 emails/month
- Pro: $20/month for 50,000 emails

### 1.4 Telegram Bot

**Setup:**
1. Open Telegram, search for `@BotFather`
2. Send `/newbot` and follow instructions
3. Copy bot token: `TELEGRAM_API_KEY=123456:ABC-DEF...`
4. Send `/mybots` → Select your bot → **Bot Settings** → **Group Privacy** → **Disable**
5. Add bot to your admin group/channel
6. Get chat ID:
   ```bash
   # Send message to bot, then:
   curl https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates
   ```
7. Copy chat ID from response: `TELEGRAM_MANAGER_CHAT_ID=123456789`

**Environment Variables:**
```env
TELEGRAM_API_KEY=your-bot-token
TELEGRAM_MANAGER_CHAT_ID=your-chat-id
TELEGRAM_ADMIN_CHAT_ID=your-admin-chat-id
```

### 1.5 Google OAuth

**Setup:**
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create new project or select existing
3. Enable **Google+ API**
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Application type: **Web application**
6. Add authorized redirect URIs:
   ```
   https://your-domain.vercel.app/api/auth/callback/google
   https://your-custom-domain.com/api/auth/callback/google
   ```
7. Copy credentials:
   ```
   GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your-client-secret
   ```

**Important:** Update redirect URIs every time you change domain!

---

## Phase 2: Database Configuration

### 2.1 Initial Database Setup

**Option 1: Via Vercel Postgres UI**
- Vercel Postgres includes automatic schema management
- Use Vercel's SQL editor to run migrations

**Option 2: Via Direct Connection**

```bash
# Install PostgreSQL client (if not installed)
brew install postgresql

# Connect to database
psql "postgresql://user:pass@host:5432/dbname?sslmode=require"

# Or use GUI tool (recommended)
# - TablePlus: https://tableplus.com
# - pgAdmin: https://www.pgadmin.org
# - DBeaver: https://dbeaver.io
```

### 2.2 Run Database Migrations

The project has **7 migration files** in `lib/database/migrations/`:

1. `create-nextauth-tables.sql` - NextAuth authentication tables
2. `rename-auth-tables.sql` - Rename to auth_* prefix
3. `add-unique-wallet-to-sessions.sql` - Session management
4. `add_current_stage.sql` - Request tracking
5. `add-user-id-to-requests.sql` - OAuth user tracking
6. `add-support-messenger.sql` - Support chat system
7. `add-user-id-columns.sql` - Additional user tracking

**Execute migrations in order:**

```bash
# Method 1: Using migration script
npm run db:migrate

# Method 2: Manual execution
for file in lib/database/migrations/*.sql; do
  psql "$DATABASE_URL" -f "$file"
done

# Method 3: Via Vercel Postgres UI
# Copy-paste each SQL file content into SQL Editor
```

### 2.3 Verify Database Schema

**Expected tables (12 total):**

```sql
-- Authentication tables
auth_users
auth_accounts
auth_sessions
auth_verification_tokens

-- Request tables
exchange_requests
internal_requests

-- Chatbot tables
chatbot_sessions
chatbot_messages
chatbot_transaction_analysis

-- Support Messenger
support_messages
typing_indicators
```

**Verification query:**

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

---

## Phase 3: Vercel Project Setup

### 3.1 Push Code to GitHub

```bash
# Initialize git (if not done)
git init
git add .
git commit -m "Initial commit for production deployment"

# Create GitHub repository
# Go to github.com and create new repo

# Push code
git remote add origin https://github.com/your-username/web-wallet.git
git branch -M main
git push -u origin main
```

### 3.2 Import to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click **Add New...** → **Project**
3. Import your GitHub repository
4. Configure project:
   - **Framework Preset:** Next.js
   - **Root Directory:** `./` (leave as is)
   - **Build Command:** `npm run build`
   - **Output Directory:** `.next` (auto-detected)
   - **Install Command:** `npm install`

5. **Do NOT deploy yet!** Click **Configure Project** instead

### 3.3 Configure Build Settings

```yaml
# Vercel automatically detects Next.js settings
Framework: Next.js
Node Version: 20.x (use .nvmrc)
Package Manager: npm
```

**Advanced Build Settings:**

```bash
# Build Command (default is fine)
npm run build

# Install Command
npm install

# Ignore Build Step (optional - skip deployment on certain changes)
# [[ "$VERCEL_GIT_COMMIT_MESSAGE" =~ "[skip ci]" ]]
```

---

## Phase 4: Environment Variables

### 4.1 Required Environment Variables

Go to **Vercel Project** → **Settings** → **Environment Variables**

Add the following variables for **Production** environment:

#### **Core Application**

```env
# Node Environment
NODE_ENV=production

# Application URL (update after first deploy)
NEXT_PUBLIC_APP_URL=https://your-project.vercel.app
NEXTAUTH_URL=https://your-project.vercel.app
```

#### **Authentication**

```env
# NextAuth Secret (CRITICAL - generate new one!)
# Generate: openssl rand -base64 32
NEXTAUTH_SECRET=your-production-secret-min-32-chars

# Google OAuth
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
```

#### **Database**

```env
# PostgreSQL Connection String
DATABASE_URL=postgresql://user:pass@host:5432/dbname?sslmode=require

# Database Pool Settings (optional)
DATABASE_POOL_MAX=20
DATABASE_POOL_IDLE_TIMEOUT=30000
```

#### **Redis (Upstash)**

```env
UPSTASH_REDIS_REST_URL=https://your-db.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token
```

#### **Email (Resend)**

```env
RESEND_API_KEY=re_your_api_key
SENDER_EMAIL=noreply@your-domain.com
RECIPIENT_EMAIL=admin@your-domain.com
```

#### **Telegram Bot**

```env
TELEGRAM_API_KEY=your-bot-token
TELEGRAM_MANAGER_CHAT_ID=123456789
TELEGRAM_ADMIN_CHAT_ID=123456789
```

#### **Blockchain Configuration**

```env
# Token Address (update with your production contract)
NEXT_PUBLIC_TOKEN_ADDRESS=0x1234567890123456789012345678901234567890

# Token Details
NEXT_PUBLIC_TOKEN_SYMBOL=COIN
NEXT_PUBLIC_TOKEN_DECIMALS=18

# Network (1 = Mainnet, 11155111 = Sepolia)
NEXT_PUBLIC_CHAIN_ID=1

# RPC URL (use Alchemy or Infura for production)
NEXT_PUBLIC_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/your-api-key
```

#### **Pricing & Tax**

```env
NEXT_PUBLIC_TOKEN_PRICE_USD=1.50
NEXT_PUBLIC_TOKEN_TAX_FUNCTION=taxBps
NEXT_PUBLIC_TOKEN_TAX_BPS=200
NEXT_PUBLIC_TOKEN_TAX_SCALE=10000
```

#### **Feature Flags (Optional)**

```env
NEXT_PUBLIC_ENABLE_OAUTH=true
ENABLE_EMAIL_AUTH=true
DISABLE_EMAIL_AUTH=false
```

#### **Analytics (Optional)**

```env
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
NEXT_PUBLIC_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
```

### 4.2 Environment Variable Security Checklist

- [ ] **NEXTAUTH_SECRET** is unique and at least 32 characters
- [ ] **Database password** contains special characters
- [ ] **API keys** are valid and not from development
- [ ] **Redirect URIs** in OAuth providers match production URL
- [ ] **No sensitive data** in NEXT_PUBLIC_* variables
- [ ] **Preview deployments** use separate environment variables (optional)

---

## Phase 5: Initial Deployment

### 5.1 Deploy to Vercel

1. Click **Deploy** button in Vercel dashboard
2. Wait for build to complete (2-5 minutes)
3. Vercel will:
   - Install dependencies (`npm install`)
   - Run build (`npm run build`)
   - Optimize and cache
   - Deploy to edge network

### 5.2 Monitor Build Logs

Watch for:
- ✅ **Build successful**
- ✅ **No TypeScript errors**
- ✅ **No ESLint warnings** (important ones)
- ⚠️ **Database connection** (might fail on build - that's OK)

**Common build warnings to ignore:**
```
Warning: Extra attributes from the server
Warning: Hydration mismatch
```

### 5.3 Get Production URL

After successful deployment:
- Vercel assigns URL: `https://your-project.vercel.app`
- Copy this URL for next steps

---

## Phase 6: Post-Deployment Configuration

### 6.1 Update OAuth Redirect URIs

#### **Google Cloud Console**

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your project
3. **APIs & Services** → **Credentials**
4. Edit OAuth 2.0 Client ID
5. Add **Authorized redirect URIs**:
   ```
   https://your-project.vercel.app/api/auth/callback/google
   ```
6. Save changes

### 6.2 Update Environment Variables

Return to **Vercel Project Settings** → **Environment Variables**

Update these variables with your production URL:

```env
NEXT_PUBLIC_APP_URL=https://your-project.vercel.app
NEXTAUTH_URL=https://your-project.vercel.app
```

**Redeploy** after updating:
- Vercel Dashboard → **Deployments** → Click **...** → **Redeploy**

### 6.3 Configure Telegram Webhook

**Set webhook URL for Telegram bot:**

```bash
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://your-project.vercel.app/api/telegram-webhook"}'

# Verify webhook
curl "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getWebhookInfo"
```

**Expected response:**
```json
{
  "ok": true,
  "result": {
    "url": "https://your-project.vercel.app/api/telegram-webhook",
    "has_custom_certificate": false,
    "pending_update_count": 0
  }
}
```

### 6.4 Configure Custom Domain (Optional)

1. **Vercel Dashboard** → **Settings** → **Domains**
2. Add your custom domain (e.g., `wallet.your-company.com`)
3. Configure DNS records as instructed by Vercel:
   ```
   Type: CNAME
   Name: wallet
   Value: cname.vercel-dns.com
   ```
4. Wait for SSL certificate (automatic, 1-5 minutes)
5. Update environment variables with new domain
6. Update OAuth redirect URIs with new domain

---

## Phase 7: Testing & Verification

### 7.1 Health Checks

**Basic connectivity:**

```bash
# Test homepage
curl -I https://your-project.vercel.app
# Expected: HTTP/2 200

# Test API routes
curl https://your-project.vercel.app/api/auth/session
# Expected: {"user":null} or session data

# Test auth providers
curl https://your-project.vercel.app/api/auth/providers
# Expected: [{"id":"google","name":"Google",...}]
```

### 7.2 Authentication Testing

**Test Google OAuth:**

1. Open `https://your-project.vercel.app/login`
2. Click **Sign in with Google**
3. Complete OAuth flow
4. Verify redirect to homepage
5. Check session: `https://your-project.vercel.app/api/auth/session`

**Test Email Magic Link:**

1. Enter email on login page
2. Check email inbox
3. Click magic link
4. Verify login successful

### 7.3 Database Verification

**Check that data is being saved:**

```sql
-- Check user creation
SELECT * FROM auth_users LIMIT 5;

-- Check authentication
SELECT * FROM auth_accounts LIMIT 5;

-- Check sessions
SELECT * FROM auth_sessions WHERE expires > NOW();
```

### 7.4 Functionality Testing

**Core features to test:**

- [ ] MetaMask connection
- [ ] Token balance display
- [ ] Exchange form submission
- [ ] Internal request form submission
- [ ] Support Messenger (send message)
- [ ] Telegram notifications (check bot receives messages)
- [ ] Email notifications (check inbox)
- [ ] Tax calculator
- [ ] Language switching (RU/EN)
- [ ] Dark/Light theme toggle

### 7.5 Performance Testing

**Use Vercel Analytics:**

1. Enable Analytics: **Vercel Dashboard** → **Analytics**
2. Monitor:
   - Page load times
   - API response times
   - Core Web Vitals (LCP, FID, CLS)

**Expected performance:**
- **LCP:** < 2.5s ✅
- **FID:** < 100ms ✅
- **CLS:** < 0.1 ✅

**Use Lighthouse:**

```bash
# Install Lighthouse CLI
npm install -g lighthouse

# Run audit
lighthouse https://your-project.vercel.app --view
```

**Target scores:**
- Performance: 90+ ✅
- Accessibility: 95+ ✅
- Best Practices: 95+ ✅
- SEO: 90+ ✅

---

## 🔧 Troubleshooting

### Issue 1: Build Fails with Database Connection Error

**Symptom:**
```
Error: connect ECONNREFUSED
```

**Cause:** Database connection attempted during build time

**Solution:**
Database connections should only happen at runtime. This is expected behavior if migrations run during build. Verify that:

```typescript
// ✅ Good - connection at runtime
export async function GET() {
  const db = await connectDB();
  // ...
}

// ❌ Bad - connection at build time
const db = connectDB(); // This runs during build
```

### Issue 2: OAuth Redirect Error

**Symptom:**
```
Error: redirect_uri_mismatch
```

**Solution:**
1. Double-check redirect URI in Google Console matches exactly
2. Include both Vercel URL and custom domain
3. No trailing slashes
4. HTTPS only (no HTTP)

### Issue 3: Environment Variables Not Working

**Symptom:**
`process.env.MY_VAR is undefined`

**Solution:**
1. Verify variable is added in Vercel dashboard
2. Check you're using correct environment (Production/Preview/Development)
3. Redeploy after adding variables
4. For client-side, ensure variable starts with `NEXT_PUBLIC_`

### Issue 4: Telegram Webhook Not Receiving Messages

**Symptom:**
Bot doesn't respond to messages

**Solution:**

```bash
# Check webhook status
curl "https://api.telegram.org/bot<TOKEN>/getWebhookInfo"

# If pending_update_count > 0, there's an error
# Check Vercel logs for API route errors

# Reset webhook
curl -X POST "https://api.telegram.org/bot<TOKEN>/deleteWebhook"
curl -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook" \
  -d "url=https://your-project.vercel.app/api/telegram-webhook"
```

### Issue 5: Database Connection Pool Exhausted

**Symptom:**
```
Error: Connection pool exhausted
```

**Solution:**

```typescript
// Use connection pooling for serverless
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 1, // Important for serverless!
  idleTimeoutMillis: 30000,
});
```

Or use **Vercel Postgres** which handles this automatically.

### Issue 6: Redis Connection Issues

**Symptom:**
```
Error: Redis connection failed
```

**Solution:**
Use Upstash REST API instead of TCP connection:

```typescript
// ✅ Use REST API
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});
```

### Issue 7: CORS Errors

**Symptom:**
```
Access to fetch at 'https://api...' from origin 'https://your-app.vercel.app' has been blocked by CORS
```

**Solution:**
Ensure API routes include CORS headers:

```typescript
export async function OPTIONS(request: Request) {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
```

---

## 🛠️ Maintenance

### Regular Tasks

**Daily:**
- Monitor Vercel logs for errors
- Check Telegram bot status
- Verify email delivery

**Weekly:**
- Review Analytics (page views, errors)
- Check database size (Vercel Postgres free tier: 256MB)
- Monitor Redis usage (Upstash free tier: 10K req/day)

**Monthly:**
- Review and rotate API keys
- Update dependencies: `npm update`
- Database backup (Vercel Postgres has automatic backups)
- Review and clean old sessions

### Monitoring Setup

**Sentry (Error Tracking):**

```bash
# Install Sentry
npm install @sentry/nextjs

# Initialize
npx @sentry/wizard@latest -i nextjs

# Add DSN to environment variables
NEXT_PUBLIC_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
```

**Vercel Analytics:**

Already included - just enable in dashboard.

**Uptime Monitoring:**

Use external service like:
- [UptimeRobot](https://uptimerobot.com) (free)
- [Pingdom](https://www.pingdom.com)
- [StatusCake](https://www.statuscake.com)

### Backup Strategy

**Database Backups:**

```bash
# Manual backup
pg_dump "$DATABASE_URL" > backup-$(date +%Y%m%d).sql

# Restore from backup
psql "$DATABASE_URL" < backup-20250131.sql
```

**Automated backups:**
- **Vercel Postgres:** Automatic daily backups (7-day retention)
- **Supabase:** Automatic backups (free tier: 7-day retention)
- **Neon:** Point-in-time restore

### Scaling Considerations

**When to upgrade:**

| Metric | Free Tier Limit | Upgrade Trigger |
|--------|-----------------|-----------------|
| Database Size | 256 MB (Vercel) | > 200 MB |
| Redis Requests | 10K/day | > 8K/day |
| Email Sends | 3K/month | > 2.5K/month |
| Function Executions | 100GB-Hours | Consistent high usage |

**Cost estimates after upgrade:**
- Vercel Pro: $20/month
- Database: $20-25/month
- Redis: ~$10/month (usage-based)
- Email: $20/month
- **Total:** ~$70-80/month for moderate traffic

---

## 📊 Deployment Checklist

### Pre-Deployment

- [ ] All environment variables configured
- [ ] Database migrations tested locally
- [ ] OAuth redirect URIs updated
- [ ] Email DNS records verified
- [ ] Telegram webhook URL prepared
- [ ] Production RPC endpoints configured
- [ ] Build passes locally: `npm run build`
- [ ] Type check passes: `npm run type-check`

### During Deployment

- [ ] Code pushed to GitHub
- [ ] Vercel project imported
- [ ] Environment variables added to Vercel
- [ ] Database created and migrations run
- [ ] Redis instance created
- [ ] Initial deployment successful

### Post-Deployment

- [ ] OAuth redirect URIs updated with production URL
- [ ] Environment variables updated with production URL
- [ ] Telegram webhook configured
- [ ] Custom domain configured (if applicable)
- [ ] SSL certificate active
- [ ] All authentication methods tested
- [ ] Core functionality tested
- [ ] Analytics enabled
- [ ] Monitoring configured

---

## 🎯 Success Criteria

Your deployment is successful when:

✅ Website loads at production URL
✅ Google OAuth login works
✅ Email magic link login works
✅ MetaMask connection works
✅ Token balance displays correctly
✅ Forms submit successfully
✅ Telegram notifications arrive
✅ Email notifications arrive
✅ Support Messenger works
✅ No console errors
✅ Lighthouse score > 90

---

## 📞 Support & Resources

**Official Documentation:**
- [Vercel Docs](https://vercel.com/docs)
- [Next.js Docs](https://nextjs.org/docs)
- [NextAuth.js Docs](https://next-auth.js.org)
- [Drizzle ORM Docs](https://orm.drizzle.team)

**Project-Specific:**
- See `docs/architecture.md` for technical details
- See `docs/auth-flow.md` for authentication flow
- See `.env.example` for all environment variables

**Community:**
- Vercel Discord: [discord.gg/vercel](https://discord.gg/vercel)
- Next.js Discord: [discord.gg/nextjs](https://discord.gg/nextjs)

---

**Last Updated:** 2025-10-31
**Version:** 1.0.0
**Deployment Target:** Vercel (Primary), Netlify (Alternative)
