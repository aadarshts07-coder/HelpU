# 🚀 Deploying HELP U to Render

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy)

This guide walks you through deploying **HELP U – Autonomous AI Job Application & Resume Agent** to [Render](https://render.com) for production hosting.

---

## 📋 Table of Contents
1. [Overview & Prerequisites](#-overview--prerequisites)
2. [Method 1: 1-Click Blueprint Deployment (Recommended)](#-method-1-1-click-blueprint-deployment-recommended)
3. [Method 2: Manual Step-by-Step Deployment](#-method-2-manual-step-by-step-deployment)
4. [Environment Variables Reference](#-environment-variables-reference)
5. [Database Setup (PostgreSQL)](#-database-setup-postgresql)
6. [Render Free Tier: Limitations & Workarounds](#-render-free-tier-limitations--workarounds)
7. [Custom Domain & Automatic SSL](#-custom-domain--automatic-ssl)
8. [Troubleshooting & FAQ](#-troubleshooting--faq)

---

## 🌟 Overview & Prerequisites

### Prerequisites:
- A [Render](https://render.com) account (free to sign up, no credit card required for free tier).
- A [GitHub](https://github.com) or [GitLab](https://gitlab.com) account with your HELP U repository pushed.
- (Optional) An Anthropic API key if you wish to use Claude 3.5 Sonnet directly (built-in smart ATS synthesizer works out-of-the-box if omitted).

---

## ⚡ Method 1: 1-Click Blueprint Deployment (Recommended)

HELP U includes a pre-configured `render.yaml` Blueprint file that provisions both the **Web Service** and the **PostgreSQL Database** automatically with generated secrets.

### Steps:
1. Push your latest code (including `render.yaml`) to GitHub:
   ```bash
   git add .
   git commit -m "Add Render deployment blueprint"
   git push origin main
   ```
2. Log in to [dashboard.render.com](https://dashboard.render.com).
3. Click **New +** in the top navigation bar and select **Blueprint**.
4. Connect your **HELP U** GitHub repository.
5. Render will detect `render.yaml` and display the resources to create:
   - **help-u-web** (Next.js 14 Web Service)
   - **help-u-db** (Managed PostgreSQL Database)
6. Click **Apply**.
7. Render will build and deploy your application. Once finished, your live URL will be:
   ```
   https://help-u-web.onrender.com
   ```

---

## 🛠️ Method 2: Manual Step-by-Step Deployment

If you prefer to configure your services manually in the Render dashboard:

### Step 1: Create the PostgreSQL Database
1. In the Render Dashboard, click **New +** → **PostgreSQL**.
2. Configure the database settings:
   - **Name:** `helpu-db`
   - **Database:** `helpu`
   - **User:** `helpu`
   - **Region:** Choose the region closest to your users (e.g., `Oregon`, `Frankfurt`).
   - **Plan:** `Free` (or `Starter` for production permanent persistence).
3. Click **Create Database**.
4. Once provisioned, locate the **Connections** section:
   - Copy the **Internal Database URL** (e.g. `postgres://helpu:password@dpg-...-a/helpu`).

---

### Step 2: Create the Web Service
1. In the Render Dashboard, click **New +** → **Web Service**.
2. Select **Build and deploy from a Git repository** and connect your repository.
3. Configure the Web Service:
   - **Name:** `help-u` (your URL will be `https://help-u.onrender.com`)
   - **Region:** Same region as your database (e.g., `Oregon`).
   - **Branch:** `main`
   - **Root Directory:** Leave blank (defaults to `./`).
   - **Runtime:** `Node`
   - **Build Command:**
     ```bash
     npm install && npm run build
     ```
   - **Start Command:**
     ```bash
     npm run start
     ```
   - **Plan:** `Free` (or `Starter` for 24/7 uptime without sleep).

---

### Step 3: Configure Health Check Path
In the Web Service creation page, expand **Advanced** and set:
- **Health Check Path:** `/api/health`

Render will ping this endpoint to verify zero-downtime deployment health before switching live traffic.

---

## 🔑 Environment Variables Reference

Under the **Environment** tab of your Render Web Service, add the following variables:

| Variable | Required | Description | Example / Default |
| :--- | :---: | :--- | :--- |
| `NODE_ENV` | **Yes** | Node environment mode | `production` |
| `NEXT_PUBLIC_APP_URL` | **Yes** | Public canonical URL of your site | `https://help-u.onrender.com` |
| `NEXTAUTH_URL` | **Yes** | Auth callback root URL | `https://help-u.onrender.com` |
| `DATABASE_URL` | **Yes** | PostgreSQL connection string | `postgres://helpu:...@.../helpu` |
| `CREDENTIAL_ENCRYPTION_KEY` | **Yes** | 32-char key for AES-256 password encryption | *(Click "Generate" in Render or use 32 random chars)* |
| `CREDENTIAL_SALT` | **Yes** | Cryptographic salt for key derivation | *(Random string, e.g. `helpu_salt_secure_2026`)* |
| `NEXTAUTH_SECRET` | **Yes** | JWT session token encryption secret | *(Random 32+ character string)* |
| `NEXT_PUBLIC_DEMO_EMAIL` | Optional | Pre-filled demo user email on login page | `alex.morgan@example.com` |
| `NEXT_PUBLIC_DEMO_PASSWORD` | Optional | Pre-filled demo user password | `password123` |
| `DEFAULT_DAILY_APPLICATION_LIMIT` | Optional | Maximum daily applications allowed | `20` |
| `DEFAULT_MATCH_THRESHOLD` | Optional | Minimum match score percentage to apply | `70` |
| `DEFAULT_REVIEW_MODE` | Optional | Auto-submit vs review mode | `ask_before_submitting` |
| `ANTHROPIC_API_KEY` | Optional | Claude API Key for AI resume & scoring | `sk-ant-api03-...` *(Built-in smart fallback if unset)* |
| `FREEHIRE_API_KEY` | Optional | FreeHire Search API key for commercial tiers | *(Leave blank for keyless personal tier)* |
| `FREEHIRE_COMMERCIAL_MODE` | Optional | Whether commercial licensing is active | `false` |
| `REDIS_URL` | Optional | Redis server URL for BullMQ | `redis://...` *(Built-in async engine works if unset)* |
| `SMTP_HOST` | Optional | SMTP Host for email status updates | `smtp.gmail.com` |
| `SMTP_PORT` | Optional | SMTP Port | `587` |
| `SMTP_USER` | Optional | SMTP Username / Email | `your-email@gmail.com` |
| `SMTP_PASS` | Optional | SMTP App Password | `your-app-password` |
| `SMTP_FROM` | Optional | From email header | `"HELP U" <notifications@helpu.app>` |

> [!TIP]
> Click **Generate** in Render's dashboard for `CREDENTIAL_ENCRYPTION_KEY`, `CREDENTIAL_SALT`, and `NEXTAUTH_SECRET` to automatically create cryptographically secure 256-bit random strings.

---

## 🗄️ Database Setup (PostgreSQL)

When deploying on Render with PostgreSQL, you can sync your database schema using Prisma:

### Running Database Migrations
You can append `npx prisma db push` to your Build Command in Render:
```bash
npx prisma db push && npm run build
```
This automatically updates your database tables whenever you deploy new schema changes without wiping existing user profiles or application history.

---

## ⚠️ Render Free Tier: Limitations & Workarounds

If you are using Render's **Free Tier**, please keep these two behaviors in mind:

### 1. Inactivity Spin-Down (Cold Starts)
* **Behavior:** Free Render Web Services spin down after **15 minutes of inactivity**. The next request can take **30–50 seconds** to wake up.
* **Workarounds:**
  - **Upgrade to Starter Plan ($7/mo):** Keeps the service always-on with zero cold starts.
  - **Uptime Monitoring Ping:** Use a free ping service like [UptimeRobot](https://uptimerobot.com) or [cron-job.org](https://cron-job.org) to ping your health endpoint `https://your-app.onrender.com/api/health` every **10 minutes**.

### 2. Free Database Expiration (30 Days)
* **Behavior:** Render free PostgreSQL databases expire and are deleted **30 days** after creation.
* **Workarounds:**
  - **Upgrade Render Database to Starter ($6/mo):** Never expires, includes automated daily backups.
  - **Use a Free Permanent PostgreSQL Provider:** Connect an external free database from [Neon](https://neon.tech) or [Supabase](https://supabase.com). Paste their connection string into `DATABASE_URL` in your Render Environment tab!

---

## 🌐 Custom Domain & Automatic SSL

To connect your own domain (e.g., `helpu.ai` or `jobs.yourdomain.com`):

1. In Render, open your Web Service and navigate to **Settings** → **Custom Domains**.
2. Click **Add Custom Domain** and enter your domain name (e.g., `app.yourdomain.com`).
3. Render will display the required DNS records:
   - **Type:** `CNAME`
   - **Name:** `app` (or `@` for root domain with ANAME/ALIAS)
   - **Value:** `your-app.onrender.com`
4. Add the record in your domain registrar (Cloudflare, GoDaddy, Namecheap, etc.).
5. Render automatically issues and renews a free Let's Encrypt SSL/TLS certificate within minutes.

---

## ❓ Troubleshooting & FAQ

### 1. "Build exceeded memory limit"
* **Solution:** Next.js can consume memory during static page optimization. In your Render Web Service settings under **Environment**, add:
  ```env
  NODE_OPTIONS="--max-old-space-size=1536"
  ```

### 2. "Port already in use" or "Service failed to bind to port"
* **Solution:** Render sets the `$PORT` environment variable dynamically (usually port `10000`). HELP U's `npm run start` script is pre-configured with `next start -H 0.0.0.0`, which automatically binds to `$PORT` without conflicts.

### 3. "Self-signed certificate in certificate chain" / PostgreSQL SSL Error
* **Solution:** If connecting to an external PostgreSQL provider requiring SSL, ensure `?sslmode=require` is appended to your `DATABASE_URL`:
  ```
  postgresql://user:pass@ep-xyz.neon.tech/neondb?sslmode=require
  ```

### 4. Health Check Fails
* **Solution:** Verify that `/api/health` returns `200 OK`. You can test this locally or via curl:
  ```bash
  curl -I https://your-app.onrender.com/api/health
  ```
  Expected response:
  ```http
  HTTP/2 200
  content-type: application/json
  {"status":"ok","service":"HELP U - AI Auto Apply"}
  ```

---

## 📄 License & Support
Built with ❤️ for HELP U. Need help? Open an issue or check the official [Render Documentation](https://render.com/docs).
