# CodeLens AI

AI-powered code analysis tool — connect a GitHub repository, run analysis, and get findings, architecture maps, and modernization recommendations in minutes.

---

## The Problem

When a developer joins a new project, they spend days manually reading controllers, models, services, routes, specs, and dependencies just to understand where the risk is and where to start.

**CodeLens AI cuts that down to minutes.** Add the repo URL, run analysis, and immediately see total files, high-risk findings, architecture flow, and AI-generated suggestions for where to focus.

---

## Demo

> Live: _add Vercel URL here after deploy_

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript — strict mode |
| Styling | Tailwind CSS + shadcn/ui |
| Auth | NextAuth.js — GitHub OAuth |
| ORM | Prisma 7 |
| Database | PostgreSQL (Neon.tech) |
| Graph UI | React Flow |
| Charts | Recharts |
| AI | Anthropic Claude API (claude-haiku-3-5) |
| File fetching | Octokit (GitHub REST API) |
| Testing | Vitest + React Testing Library + Playwright |
| CI | GitHub Actions |
| Deployment | Vercel |

---

## How It Works

```
Connect GitHub repo → Run analysis → View dashboard
        ↓
  File tree fetched via GitHub API (no cloning)
        ↓
  Rule-based checks on every file:
  - LARGE_FILE, MISSING_TEST, HARDCODED_ENV
  - LONG_METHOD, TODO_COMMENT, N_PLUS_ONE, DEPRECATED_DEP
        ↓
  Architecture map built from file structure
        ↓
  HIGH severity findings → Claude API for AI summaries
  Claude generates modernization recommendations
        ↓
  Dashboard: metric cards + findings list + architecture graph
```

---

## Local Setup

### Prerequisites
- Node.js 20+
- A [Neon.tech](https://neon.tech) account (free tier)
- A [GitHub OAuth App](https://github.com/settings/developers)
- An [Anthropic API key](https://console.anthropic.com)

### Steps

```bash
# 1. Clone the repo
git clone https://github.com/Sarvgna-Bachchuwar/codelens-ai.git
cd codelens-ai

# 2. Use Node 20
nvm use 20

# 3. Install dependencies
npm install

# 4. Set up environment variables
cp .env.example .env
# Edit .env and fill in all values

# 5. Generate Prisma client
npx prisma generate

# 6. Run database migrations
npx prisma migrate dev --name init

# 7. Start dev server
npm run dev
```

Open [http://localhost:3001](http://localhost:3001).

---

## Environment Variables

Create a `.env` file at the project root:

```bash
# Neon PostgreSQL connection string
# Get from: neon.tech → your project → Connection Details
DATABASE_URL=postgresql://user:password@host/neondb?sslmode=require

# GitHub OAuth App credentials
# Get from: github.com → Settings → Developer settings → OAuth Apps
# Callback URL: http://localhost:3001/api/auth/callback/github
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=

# Random secret for NextAuth session signing
# Generate with: openssl rand -base64 32
NEXTAUTH_SECRET=

# Base URL of your app
NEXTAUTH_URL=http://localhost:3001

# Anthropic Claude API key
# Get from: console.anthropic.com
ANTHROPIC_API_KEY=
```

---

## Architecture Overview

```
app/
├── (auth)/login/            — GitHub OAuth sign-in page
├── (dashboard)/
│   ├── dashboard/           — Workspace + repo overview
│   ├── add-repo/            — Add repository form
│   └── repos/[id]/
│       ├── page.tsx         — Findings dashboard
│       ├── architecture/    — React Flow graph
│       └── recommendations/ — AI suggestions
├── api/
│   ├── auth/                — NextAuth route handler
│   ├── analysis/            — Trigger + poll analysis runs
│   ├── repos/               — Repo CRUD
│   ├── workspaces/          — Workspace CRUD
│   ├── architecture/        — Arch nodes + edges
│   └── recommendations/     — AI recommendations
lib/
├── analysis/                — Rule engine + runner
├── auth/                    — NextAuth config
└── db/                      — Prisma client
```

---

## Deploying to Vercel

1. Push this repo to GitHub (already done)
2. Go to [vercel.com/new](https://vercel.com/new) → import the repo
3. Add all environment variables from the section above
4. Set `NEXTAUTH_URL` to your Vercel deployment URL (e.g. `https://codelens-ai.vercel.app`)
5. Update your GitHub OAuth App callback URL to:
   `https://your-app.vercel.app/api/auth/callback/github`
6. Click Deploy

---

## Running Tests

```bash
# Unit + integration tests
npm run test

# With coverage report
npm run test:coverage

# E2E tests (requires dev server running)
npm run test:e2e

# Type check
npm run typecheck
```

---

## Project Status

Built as a portfolio project targeting a Full Stack Product Engineer role at Mactores (Aedeon product). Mirrors Aedeon's core workflow: reading codebases, surfacing findings, building architecture maps, and generating AI-powered modernization recommendations.
