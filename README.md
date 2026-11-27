# 🤖 HELP U — Autonomous AI Job Application & Resume Agent

> **HELP U** is an autonomous, end-to-end full-stack web application that takes candidate profile details, builds an ATS-optimized resume using Claude 3.5 Sonnet, searches major job portals (LinkedIn, Indeed, Naukri, Greenhouse, Lever), scores compatibility (0–100), applies automatically using Playwright with stealth controls, and tracks progress with full audit screenshots and multi-channel notifications.

---

## 🌟 Key Features

1. **Multi-Step Profile Builder**:
   - Structured wizard: Personal & contact info, education, work experience, categorized skills, certifications, portfolio projects, languages.
   - Targeting preferences: Target job titles, preferred locations, minimum/maximum compensation, and work arrangement (`remote`, `hybrid`, `onsite`, `any`).
2. **AI Resume & Tailored Cover Letter Engine (Claude API)**:
   - Synthesizes 100% ATS-compliant resume bullets using the XYZ impact formula (`Accomplished X as measured by Y by doing Z`).
   - Live visual document preview with real-time inline editing.
   - Dual-format export: **Microsoft Word (.docx)** (generated via `docx`) and **Print PDF**.
   - Custom tailored cover letter generator crafted specifically for target companies and job descriptions.
3. **Cross-Portal Job Scraping & Discovery**:
   - Background worker searches LinkedIn, Indeed, Naukri, and direct applicant tracking systems (Greenhouse, Lever, Ashby, Workday).
   - Extracts job title, company, location, salary range, description, and direct apply link.
4. **Intelligent Match Scorer (0–100)**:
   - Claude evaluates candidate background against job requirements.
   - Generates score, alignment strengths, and missing skill suggestions.
   - Submits only to jobs meeting the user-configured threshold (default: 70%+).
5. **Stealth Playwright Automation Worker**:
   - Fills complex application forms with profile data.
   - Answers situational and qualification questions using Claude API.
   - Uploads dynamically tailored resume files.
   - Human-like random typing delays (40–120ms/keystroke) and mouse movement pacing to respect rate limits.
   - Captures full-page screenshots at each stage for transparent audit logging.
6. **Safety & Obstacle Detection**:
   - **CAPTCHA & Cloudflare Turnstile Detection**: Detects bot challenges and pauses safely instead of guessing or getting banned.
   - **Login Wall Detection**: Detects 2FA or portal account walls and requests manual user intervention.
   - **Review Mode Switch**: Choose between **"Auto-submit"** (full autonomy) and **"Ask me before submitting"** (pauses after filling form for 1-click user review).
7. **Application Tracker Table**:
   - Interactive table with filters (`Applied`, `Pending review`, `Needs manual action`, `Interview`, `Failed`), search, and sorting.
   - Full screenshot viewer modal with step-by-step audit trail and direct portal links.
8. **Security & Privacy**:
   - **AES-256-GCM Encryption**: All stored portal passwords and session credentials are encrypted at rest.
   - **Explicit Consent**: Required safety consent modal before automation begins.
   - **GDPR Compliance**: Instant JSON data export and permanent account purge (`DELETE` confirmation).
9. **Multi-Channel Notifications**:
   - Real-time in-app notification center with unread badges.
   - Responsive HTML email notifications (via Nodemailer) with direct tracker links.

---

## 🏗️ Architecture & Project Structure

```
helpu/
├── app/
│   ├── layout.tsx              # Root Next.js layout & global styling
│   ├── page.tsx                # High-converting Landing page
│   ├── login/page.tsx          # Sign-in & 1-click demo login
│   ├── dashboard/page.tsx      # Overview metrics, charts & recent submissions
│   ├── profile/page.tsx        # Multi-step Profile Builder wizard
│   ├── resume/page.tsx         # AI Resume preview, live editor & cover letter generator
│   ├── jobs/page.tsx           # Job discovery, portal scraper & batch apply
│   ├── tracker/page.tsx        # Application tracker table & screenshot audit modal
│   ├── notifications/page.tsx  # In-app notifications center
│   ├── settings/page.tsx       # Daily limits, blacklist, credentials & privacy
│   └── api/
│       ├── profile/route.ts    # User profile CRUD
│       ├── settings/route.ts   # Rate limits, review mode & encrypted credentials
│       ├── resume/             # Generate ATS resume, cover letter & export DOCX
│       ├── jobs/               # Portal search & LLM match scoring
│       ├── apply/              # Queue applications, manual approvals & status
│       ├── notifications/      # Read/unread notifications
│       └── data/               # GDPR export & account purge
├── components/
│   ├── Navbar.tsx              # Brand header, notifications popover & pause pill
│   ├── Sidebar.tsx             # Main dashboard navigation
│   ├── StatsCard.tsx           # KPI metrics card
│   ├── ATSResumePreview.tsx    # ATS formatted resume viewer & editor
│   ├── ScreenshotModal.tsx     # Full-page screenshot log & approval modal
│   └── ConsentModal.tsx        # Security & privacy authorization screen
├── lib/
│   ├── ai.ts                   # Anthropic Claude API client & prompt engineer
│   ├── crypto.ts               # AES-256-GCM encryption for portal credentials
│   ├── db.ts                   # Database store & Prisma ORM abstraction
│   ├── email.ts                # Nodemailer HTML status email dispatcher
│   ├── queue.ts                # BullMQ + Redis queue & async execution fallback
│   ├── resumeDocx.ts           # Microsoft Word (.docx) generator
│   ├── storage.ts              # Local & CDN screenshot/resume file manager
│   └── types.ts                # TypeScript interfaces & enums
├── workers/
│   ├── playwrightRunner.ts     # Playwright automation engine, delays & captcha checks
│   ├── jobScraper.ts           # Cross-portal job search & LLM scoring
│   └── jobQueueWorker.ts       # Standalone BullMQ background job processor
├── scripts/
│   ├── worker.js               # Background worker CLI entrypoint
│   └── test-playwright.js      # Verification test suite
├── prisma/
│   └── schema.prisma           # PostgreSQL Prisma schema
├── .env.example                # Example environment variables
└── README.md
```

---

## 🌐 Production Deployment

- **Render Deployment Guide**: See [RENDER_DEPLOY.md](file:///c:/Users/aadar/OneDrive/Desktop/project%201/RENDER_DEPLOY.md) for 1-click Render blueprint (`render.yaml`), PostgreSQL database setup, and environment variables.
- **Docker Compose**: Production multi-container stack with Caddy automated SSL is configured in `docker-compose.yml`.

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy)

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js (v18+)
- (Optional) Redis server for BullMQ (if omitted, HELP U seamlessly uses its built-in async execution engine)
- (Optional) Anthropic Claude API Key (if omitted, HELP U uses its built-in smart ATS generator fallback)

### 2. Installation
```bash
git clone https://github.com/your-username/help-u.git
cd help-u
npm install
```

### 3. Environment Configuration
Copy the example environment file:
```bash
cp .env.example .env.local
```
Update `.env.local` with your configuration:
```env
# Anthropic Claude API
ANTHROPIC_API_KEY="your-anthropic-api-key"

# AES-256 Secret for stored credentials
CREDENTIAL_ENCRYPTION_KEY="your-secure-32-byte-secret-key!"

# Database URL (PostgreSQL or local SQLite)
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/helpu?schema=public"

# Redis URL for BullMQ (optional)
REDIS_URL="redis://localhost:6379"

# Email notifications (optional)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER=""
SMTP_PASS=""
```

### 4. Running the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🤖 Running the Playwright Background Worker

HELP U includes a standalone worker powered by **BullMQ** and **Playwright**:

```bash
npm run worker
```

The worker continuously monitors the queue `helpu-applications`, processes jobs with configurable concurrency, navigates job portals, uploads tailored resumes, captures screenshots, and reports status back to the dashboard and via email.

> **💡 Zero-Friction Fallback**: Even if Redis is not running locally, the Next.js web application automatically processes applications asynchronously in the background so you can test all features out-of-the-box!

---

## 🧪 Verification & Testing

To run the verification test suite:
```bash
node scripts/test-playwright.js
```
Expected output:
```
====================================================
🚀 Running HELP U Verification Test Suite
====================================================
✅ Directory verified: data
✅ Directory verified: public/screenshots
✅ Directory verified: public/resumes
✅ Playwright engine loaded successfully
✅ AES-256-GCM Credential encryption validated
====================================================
🎉 HELP U Core Engine components verified successfully!
====================================================
```

---

## 🔒 Security, Ethics & Privacy
- **AES-256-GCM Encryption**: User passwords for job portals are never stored in plain text.
- **Audit Logs**: Every single automated action is photographed via Playwright and logged in the Application Tracker.
- **Review Mode**: Users can force manual approval before submission.
- **CAPTCHA & Challenge Respect**: The worker never attempts to bypass or crack CAPTCHAs; it pauses immediately and notifies the candidate.
- **GDPR Compliant**: Includes one-click JSON data export and permanent account deletion.

---

## 🌐 Job Search Data Source: FreeHire Integration & Legal Attribution

HELP U incorporates live tech job search powered by **[FreeHire](https://freehire.me/)** (open-source repository: [github.com/strelov1/freehire](https://github.com/strelov1/freehire)):
- **Open Source License**: FreeHire is open-source under the **MIT License** (Copyright (c) 2026 freehire contributors).
- **Attribution**: Job search results sourced via the FreeHire API are labeled *"Jobs powered by freehire"*.
- **Data Licence Compliance**: Under the [FreeHire Data Licence](https://freehire.me/terms#data-licence):
  - Keyless API access is permitted for personal, developmental, and non-commercial usage.
  - To utilize the API within a commercial product, provide a paid API plan key via the `FREEHIRE_API_KEY` environment variable.
  - Raw job postings may not be resold or redistributed as a standalone dataset or feed.
  - Applications respect rate limits and query only the public `/api/v1/jobs/search` and `/api/v1/suggest` endpoints without crawling site pages.

---

## 📄 License
MIT License. Built with ❤️ by HELP U.
