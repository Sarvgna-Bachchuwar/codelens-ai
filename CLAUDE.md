# CodeLens AI — Project Context

## What this project is
A full-stack web app where developers connect a GitHub repository,
run an AI-powered code analysis, and view findings, architecture maps,
and modernization recommendations in a dashboard.

Built as a portfolio project targeting a Full Stack Product Engineer
role at Mactores (Aedeon product). It mirrors Aedeon's core product:
reading codebases, surfacing findings, building architecture maps,
and generating AI-powered modernization recommendations.

### The problem it solves
Without this app: a developer joining a new project manually checks
controllers, models, services, routes, specs, and dependencies.
This takes days.

With this app: they add the repo, run analysis, and within minutes
see total files, findings, high-risk issues, architecture map, and
AI suggestions for where to start.

---

## Tech stack
- Framework: Next.js 14 (App Router)
- Language: TypeScript — strict mode, no `any`
- Styling: Tailwind CSS + shadcn/ui
- Auth: NextAuth.js — GitHub OAuth only
- ORM: Prisma
- Database: PostgreSQL (Neon.tech — free tier)
- Graph UI: React Flow (architecture map)
- Charts: Recharts (dashboard metrics)
- AI: Anthropic Claude API (claude-haiku-3-5) — NOT OpenAI
- File fetching: Octokit (GitHub REST API — no cloning)
- Testing: Vitest + React Testing Library + Playwright
- CI: GitHub Actions
- Deployment: Vercel (free tier)

---

## Core rules — always follow these
- TypeScript strict mode everywhere. No `any`, no `as unknown`
- Use server components by default. Add `"use client"` only when needed
- All reusable logic goes in `lib/` — never in components or API routes
- Use Prisma for all database access — never raw SQL
- Never hardcode secrets — always use `process.env`
- Always handle loading and error states in UI
- Every feature needs tests before moving to the next one
- Keep it simple — no over-engineering, no premature abstraction
- No Redis, no BullMQ, no queues — analysis runs in a simple async API route
- No websockets — use polling for analysis status

---

## Database schema (see prisma/schema.prisma for full source)

```prisma
model User {
  id           String       @id @default(cuid())
  email        String?      @unique
  name         String?
  image        String?
  githubToken  String?
  workspaces   Workspace[]
  createdAt    DateTime     @default(now())
}

model Workspace {
  id           String       @id @default(cuid())
  name         String
  userId       String
  user         User         @relation(fields: [userId], references: [id])
  repositories Repository[]
  createdAt    DateTime     @default(now())
}

model Repository {
  id           String        @id @default(cuid())
  workspaceId  String
  workspace    Workspace     @relation(fields: [workspaceId], references: [id])
  name         String
  url          String
  branch       String        @default("main")
  projectType  ProjectType
  analysisRuns AnalysisRun[]
  createdAt    DateTime      @default(now())
}

model AnalysisRun {
  id               String           @id @default(cuid())
  repositoryId     String
  repository       Repository       @relation(fields: [repositoryId], references: [id])
  status           RunStatus        @default(PENDING)
  totalFiles       Int              @default(0)
  totalFindings    Int              @default(0)
  highRiskCount    Int              @default(0)
  coverageScore    Int              @default(0)
  healthScore      Int              @default(0)
  findings         Finding[]
  archNodes        ArchNode[]
  archEdges        ArchEdge[]
  recommendations  Recommendation[]
  startedAt        DateTime         @default(now())
  completedAt      DateTime?
}

model Finding {
  id            String      @id @default(cuid())
  analysisRunId String
  analysisRun   AnalysisRun @relation(fields: [analysisRunId], references: [id])
  filePath      String
  severity      Severity
  category      String
  title         String
  description   String
  suggestion    String
  line          Int?
  aiSummary     String?
}

model ArchNode {
  id            String      @id @default(cuid())
  analysisRunId String
  analysisRun   AnalysisRun @relation(fields: [analysisRunId], references: [id])
  label         String
  type          NodeType
  filePath      String?
}

model ArchEdge {
  id            String      @id @default(cuid())
  analysisRunId String
  analysisRun   AnalysisRun @relation(fields: [analysisRunId], references: [id])
  sourceId      String
  targetId      String
  label         String?
}

model Recommendation {
  id            String      @id @default(cuid())
  analysisRunId String
  analysisRun   AnalysisRun @relation(fields: [analysisRunId], references: [id])
  title         String
  reason        String
  suggestion    String
  priority      Priority
}

enum ProjectType { RAILS NODE REACT GENERIC }
enum RunStatus   { PENDING RUNNING COMPLETED FAILED }
enum Severity    { HIGH MEDIUM LOW }
enum NodeType    { CONTROLLER SERVICE MODEL DATABASE ROUTE COMPONENT }
enum Priority    { HIGH MEDIUM LOW }
```

---

## How analysis works (simple flow)

```
User submits repo URL + branch + project type
          ↓
API validates repo via Octokit (is it accessible?)
          ↓
Creates AnalysisRun (status: PENDING)
          ↓
Fetches file tree via GitHub API
Filters out: node_modules / .git / tmp / log / vendor / dist / build
Focuses on: .rb .js .ts .tsx .jsx .json .yml .sql
          ↓
Runs rule-based checks on each file
          ↓
Builds architecture nodes + edges from file structure
          ↓
Sends HIGH severity findings to Claude API for summaries
Generates recommendations via Claude API
          ↓
Updates AnalysisRun → status: COMPLETED
          ↓
Frontend polls /api/analysis/:id/status every 2s
Redirects to dashboard when complete
```

---

## Rule engine — finding types

| Rule | Trigger | Severity |
|---|---|---|
| LARGE_FILE | File > 300 lines | MEDIUM |
| MISSING_TEST | No matching spec/test file | MEDIUM |
| HARDCODED_ENV | API key / secret / password in code | HIGH |
| LONG_METHOD | Function > 30 lines | LOW |
| TODO_COMMENT | TODO or FIXME present | LOW |
| N_PLUS_ONE | Potential N+1 query pattern | HIGH |
| DEPRECATED_DEP | Outdated package in package.json or Gemfile | MEDIUM |

---

## User flow (how users use the app)

1. Open app → login with GitHub
2. Create a workspace (e.g. "My Engineering Workspace")
3. Add a repository (URL + branch + project type)
4. Click "Run Analysis"
5. Wait for analysis (status: Pending → Running → Completed)
6. View findings dashboard — metric cards + findings list
7. Click a finding to see details + AI summary
8. Open architecture tab — see visual flow graph
9. Open recommendations tab — read AI suggestions

---

## MVP scope — build only these

- [ ] GitHub OAuth login
- [ ] Workspace creation
- [ ] Add repository form
- [ ] Analysis pipeline (fetch + rules + arch map)
- [ ] Findings dashboard (metric cards + list)
- [ ] Finding detail (file, severity, suggestion, AI summary)
- [ ] Architecture map (React Flow)
- [ ] AI recommendations (Claude API)
- [ ] Testing infrastructure (Vitest + Playwright + CI)
- [ ] Deploy to Vercel with live URL
- [ ] Strong README with demo link

## Do NOT build in MVP
- Email/password auth
- Team workspaces (multi-user)
- PDF/Markdown/JSON export
- Real-time updates (polling is fine)
- Redis or BullMQ
- Payment or billing
- Dark mode toggle

---

## Environment variables

```
DATABASE_URL=           # Neon PostgreSQL connection string
GITHUB_CLIENT_ID=       # GitHub OAuth app client ID
GITHUB_CLIENT_SECRET=   # GitHub OAuth app client secret
NEXTAUTH_SECRET=        # Random secret string
NEXTAUTH_URL=           # http://localhost:3000 or Vercel URL
ANTHROPIC_API_KEY=      # Claude API key
```

---

## Testing requirements

- Vitest for unit tests (one per rule) and API tests
- React Testing Library for component tests
- Playwright for E2E: login → create workspace → add repo → view findings
- Coverage thresholds enforced in vitest.config.ts:
  - lines: 80%
  - functions: 80%
  - branches: 70%
- GitHub Actions CI runs on every PR: typecheck → lint → test → coverage

---

## CI pipeline

```yaml
# .github/workflows/ci.yml
name: CI
on: [pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - run: npm run typecheck
      - run: npm run lint
      - run: npm run test:coverage
```

---

## Decisions made
- No Redis/BullMQ — analysis runs synchronously in API route
- No websockets — frontend polls /status every 2 seconds
- Claude API called only for HIGH severity findings (saves credits)
- Mock Claude API in all tests — never call real API in test environment
- GitHub OAuth only — no email/password in MVP
- Octokit for file fetching — no git clone (works on Vercel serverless)

---

## How to work with Claude Code
- Always read CLAUDE.md before starting any task
- Build one feature at a time — finish and test before moving on
- Write tests immediately after each feature, not at the end
- If something is unclear, ask before writing code
- Prefer the simplest working solution
- When using Claude API, always mock responses in tests
- After each session update the MVP checklist above
