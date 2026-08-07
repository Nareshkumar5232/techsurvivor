# Tech Survivor

A production-oriented technical event platform for a two-round individual competition:

1. **Round 1 - MCQ Qualification** (20 questions, need ≥15/20 to qualify)
2. **Round 2 - Coding Challenge** (3 problems - easy/medium/hard - judged on a hosted Judge0 instance)

Full-stack, real backend, real Firebase Auth + Firestore, real Judge0 integration. No Docker
anywhere - everything runs directly with Node.js and npm on Windows, macOS, or Linux.

> **Honesty note on verification.** Everything in this repo that can be verified without a live
> Firebase project or Judge0 account has been: `npm install`, `npm run typecheck`, `npm run lint`,
> `npm run test` (30 backend tests, including every "mandatory" scenario listed below), and
> `npm run build` for both the API and the frontend all pass in this environment. What has **not**
> been verified is an end-to-end run against a real Firebase project or a real hosted Judge0
> account, because none were available while building this - that requires your credentials. The
> code path for both is complete and real (see `apps/api/src/compiler/Judge0CompilerProvider.ts`),
> not a stub, but you should do one real smoke test after filling in your own credentials before
> trusting this in production. See "Known limitations" at the bottom.

---

## Table of contents

- [Event workflow](#event-workflow)
- [Features](#features)
- [Technology stack](#technology-stack)
- [Architecture](#architecture)
- [Folder structure](#folder-structure)
- [Prerequisites](#prerequisites)
- [Firebase setup](#firebase-setup)
- [Judge0 setup](#judge0-setup)
- [Environment variables](#environment-variables)
- [Installation](#installation)
- [Running the app](#running-the-app)
- [Creating an administrator](#creating-an-administrator)
- [Seeding demo data](#seeding-demo-data)
- [Testing](#testing)
- [Production build](#production-build)
- [Deployment](#deployment)
- [API endpoints](#api-endpoints)
- [Firestore collections](#firestore-collections)
- [Security model](#security-model)
- [Troubleshooting](#troubleshooting)
- [Demo accounts](#demo-accounts)
- [Completed feature checklist](#completed-feature-checklist)
- [Known limitations](#known-limitations)

---

## Event workflow

A participant registers, verifies their email, completes their profile, then:

1. Starts **Round 1** when it's live - 20 MCQ questions (randomized order and option order per
   participant), one attempt, a server-controlled timer that survives refresh and auto-submits on
   expiry. Score ≥15/20 (70%) to qualify. Correct answers are never sent to the browser during the
   attempt.
2. If qualified, unlocks **Round 2** - three original coding problems (easy/100pts,
   medium/200pts, hard/300pts) in a split-screen Monaco editor workspace. Run against sample
   tests or custom input any time; Submit runs all hidden tests on a hosted Judge0 instance and
   scores partial credit (`score = points × passed/total` by default). Best score per problem is
   kept automatically - a later, worse submission can never lower your score.
3. Checks the live leaderboard (rank, per-difficulty scores, accepted count, penalty time),
   which an admin can hide, freeze (participants see a snapshot, admins see live), or publish.

Everything a participant sees is served by the backend from server state - no score, timer,
qualification flag, or round status is ever trusted from the client.

## Features

**Participant:** register/login/forgot-password (Firebase Auth), email verification, profile
completion with duplicate roll-number/registration-ID protection, dashboard with live round
status and announcements, full Round 1 MCQ engine (autosave, question navigator, mark-for-review,
tab-switch/copy-paste monitoring with honest "can't guarantee prevention" disclosure, timer
persistence, auto-submit), Round 2 coding workspace (6 languages, Run/Submit, submission history,
keyboard shortcuts), live leaderboard, editable profile.

**Administrator:** event settings, participant management (disqualify/restore/suspend), MCQ
question bank CRUD + JSON import/export, coding problem CRUD + duplicate/preview + JSON
import/export, round control (start/pause/resume/end, qualification calculation), Round 1 results
and qualified-participant views, submission monitoring + re-evaluation, leaderboard visibility
control, announcements, audit log, CSV export center, dashboard with charts (registration trend,
score distribution, qualification rate, language usage, per-problem success rate, verdict
distribution, submission activity).

## Technology stack

| Layer | Choices |
|---|---|
| Frontend | Next.js 15 (App Router), React 18, TypeScript, Tailwind CSS, hand-rolled shadcn-style UI primitives, Lucide icons, React Hook Form + Zod, TanStack Query, Monaco Editor, Framer Motion, Recharts, Sonner |
| Backend | Node.js, Express 4, TypeScript (strict, `noUncheckedIndexedAccess`), Firebase Admin SDK, Zod, Helmet, CORS, express-rate-limit, Pino |
| Data / auth | Firebase Authentication, Cloud Firestore, Firebase Storage (event logo only) |
| Code execution | Hosted Judge0 CE API (called only from the Express backend) |
| Testing | Vitest, Supertest, an in-memory Firestore fake for repository-level tests |

## Architecture

```
apps/web  (Next.js)  ---REST/JSON---> apps/api (Express)  ---Admin SDK---> Firebase (Auth + Firestore)
                                                            ---HTTPS------> Judge0 CE
```

The frontend never talks to Firestore directly and never calls Judge0 directly - it only calls
the Express REST API with a Firebase ID token attached. Firestore security rules deny every
direct client read/write as defense-in-depth (see `firebase/firestore.rules`); all real access
goes through the Admin SDK on the server. `packages/types` and `packages/shared` (Zod schemas,
scoring/comparison logic) are imported by both `apps/web` and `apps/api` so the contract between
them can't drift.

## Folder structure

```
tech-survivor/
├── apps/
│   ├── web/            Next.js frontend (App Router)
│   │   ├── app/
│   │   │   ├── (marketing)/    landing, about, format, rules, schedule, faq, contact
│   │   │   ├── (auth)/         login, register, forgot-password
│   │   │   ├── (participant)/  dashboard, round1[/result], round2[/:problemId], leaderboard, profile
│   │   │   ├── admin/          dashboard, event-settings, participants, mcq, problems,
│   │   │   │                   round-control, round1-results, submissions, leaderboard,
│   │   │   │                   announcements, audit-logs, export
│   │   │   └── complete-profile/
│   │   ├── components/  ui primitives + feature components
│   │   └── lib/          apiClient, firebaseClient, auth context/guards, hooks
│   └── api/             Express backend
│       └── src/
│           ├── config/       env validation, Firebase Admin init
│           ├── middleware/    auth, role, profile, round-status, qualification, rate limit, errors
│           ├── repositories/  thin Firestore access per collection
│           ├── services/      business logic (mcq, coding, leaderboard, event, user, audit)
│           ├── compiler/      CompilerProvider interface + Judge0 + Mock implementations
│           └── routes/        REST routes, incl. routes/admin/*
├── packages/
│   ├── types/    shared TypeScript domain types
│   ├── config/   shared constants/defaults (scoring, languages, rate limits, starter code)
│   └── shared/   Zod schemas + pure logic (scoring, output comparison, ranking) used by both apps
├── firebase/     firestore.rules, firestore.indexes.json, storage.rules, firebase.json
├── scripts/      seed.ts, create-admin.ts (own workspace; reads apps/api/.env)
└── package.json  npm workspaces root
```

## Prerequisites

- Node.js ≥ 18.18 (this was built and verified against Node 24)
- npm ≥ 10 (comes with Node)
- A Firebase project (Blaze or Spark plan both work for Auth + Firestore at this scale)
- A hosted Judge0 CE account for real Round 2 grading (optional for local dev/testing - see
  [Judge0 setup](#judge0-setup))
- No Docker, no WSL, no Java, no local compilers of any kind

## Firebase setup

1. Create a project at [console.firebase.google.com](https://console.firebase.google.com).
2. **Authentication** → Sign-in method → enable **Email/Password**.
3. **Firestore Database** → create a database (any region; production mode is fine, the security
   rules in this repo deny all direct client access anyway).
4. **Project settings** → **General** → add a Web app → copy the config values into
   `apps/web/.env.local` (see below).
5. **Project settings** → **Service accounts** → **Generate new private key** → this JSON gives
   you `project_id`, `client_email`, and `private_key` for `apps/api/.env`. Keep this file out of
   git (it already matches `.gitignore`'s `*.env` pattern - only `.env.example` files are tracked).
6. Deploy the security rules and indexes (optional but recommended - the Firebase CLI, not
   Docker):
   ```
   npm install -g firebase-tools
   firebase login
   firebase deploy --only firestore:rules,firestore:indexes,storage --project <your-project-id> --config firebase/firebase.json
   ```

## Judge0 setup

Pick one hosted option:

- **RapidAPI-hosted Judge0 CE**: subscribe at the Judge0 CE listing on RapidAPI, then set
  `JUDGE0_API_URL` (the RapidAPI base URL), `JUDGE0_API_KEY` (`X-RapidAPI-Key`), and
  `JUDGE0_API_HOST` (`X-RapidAPI-Host`).
- **A directly-hosted Judge0 instance** (e.g. a managed Judge0 CE deployment with its own auth):
  set `JUDGE0_API_URL`, and if it requires a token, `JUDGE0_AUTH_TOKEN` + `JUDGE0_AUTH_HEADER`
  (defaults to `X-Auth-Token`).

Then set `COMPILER_PROVIDER=judge0` in `apps/api/.env`. Language → Judge0 language ID mapping
lives in `packages/config/src/index.ts` (`JUDGE0_LANGUAGE_IDS`) and matches the standard Judge0 CE
catalog (GCC 9.2, OpenJDK 13, Python 3.8, Node 12, TS 3.7) - if your instance's `/languages`
catalog differs, edit that map.

**Without Judge0 credentials**, leave `COMPILER_PROVIDER=mock` (the default). The
`MockCompilerProvider` (`apps/api/src/compiler/MockCompilerProvider.ts`) never compiles or
executes anything - no `child_process`, no `eval`, no VM - it just echoes stdin back as stdout,
which is enough to exercise the full Run/Submit/scoring/leaderboard pipeline for local UI
development and the automated test suite, but it is **not** a real judge. Do not use it in
production.

## Environment variables

Copy the example files and fill them in:

```
apps/web/.env.local.example  ->  apps/web/.env.local
apps/api/.env.example        ->  apps/api/.env
```

`apps/api/src/config/env.ts` validates every variable at startup with Zod and fails fast with a
readable error if anything required is missing - it will never silently run with `undefined`
Firebase credentials.

| Variable | Where | Required | Notes |
|---|---|---|---|
| `NEXT_PUBLIC_FIREBASE_*` | web | Yes | From Firebase Console → Web app config |
| `NEXT_PUBLIC_API_BASE_URL` | web | Yes | `http://localhost:5000/api` locally |
| `FIREBASE_PROJECT_ID` / `FIREBASE_CLIENT_EMAIL` / `FIREBASE_PRIVATE_KEY` | api | Yes | From the service-account JSON. Keep the `\n` sequences in the private key literal (the code converts them to real newlines) |
| `FIREBASE_STORAGE_BUCKET` | api | Only if using the event-logo upload | |
| `COMPILER_PROVIDER` | api | No (default `mock`) | `mock` or `judge0` |
| `JUDGE0_API_URL` / `JUDGE0_API_KEY` / `JUDGE0_API_HOST` / `JUDGE0_AUTH_TOKEN` / `JUDGE0_AUTH_HEADER` | api | Only if `COMPILER_PROVIDER=judge0` | |
| `MAX_CODE_SIZE_BYTES` / `MAX_OUTPUT_SIZE_BYTES` | api | No | Defaults: 100000 |
| `RUN_RATE_LIMIT_PER_MINUTE` / `SUBMIT_RATE_LIMIT_PER_MINUTE` / `AUTH_RATE_LIMIT_PER_MINUTE` | api | No | Defaults: 10 / 5 / 10 |
| `FRONTEND_URL` | api | No (default `http://localhost:3000`) | Used for the CORS allow-list - set this to your deployed frontend URL in production |

## Installation

```powershell
git clone <this-repo>
cd Tech---Survivor
npm install
```

One `npm install` at the root installs all workspaces (`apps/*`, `packages/*`, `scripts`) via npm
workspaces - there is no separate install step per package.

## Running the app

All commands below work identically in Windows PowerShell, bash, or zsh - nothing here is
platform-specific, and nothing needs Docker or WSL.

```powershell
# One-time: build the shared packages so both apps can resolve @tech-survivor/* imports
npm run build:packages

# Run both frontend and backend together
npm run dev

# Or run them separately (two terminals)
npm run dev:api      # http://localhost:5000
npm run dev:web      # http://localhost:3000
```

Other useful scripts (all runnable from the repo root):

```powershell
npm run typecheck   # strict TypeScript across every workspace
npm run lint         # ESLint (api) + next lint (web)
npm run test         # Vitest: packages/shared + apps/api (30 tests)
npm run build        # production build: packages -> api -> web
```

## Creating an administrator

```powershell
npm run create-admin -- --email=admin@example.com --password=SetAStrongPassword1 --name="Admin Name"
```

If the email already has a Firebase Auth account (e.g. they registered normally first), omit
`--password` and it will just promote the existing account - it sets the `role: "admin"` custom
claim via the Admin SDK and writes/merges a matching Firestore profile. The custom claim takes
effect the next time that account signs in or its ID token refreshes.

## Seeding demo data

```powershell
npm run seed
```

Creates: 1 admin, 5 participants, exactly 20 MCQ questions (spanning C, data structures,
algorithms, DBMS, OS, computer networks, basic electronics, and aptitude), 3 original coding
problems (one per difficulty, each with samples + 5 hidden test cases), one event with both
rounds set to `live`, 2 sample announcements, a finalized Round 1 attempt for one participant at
exactly 15/20 (qualifies) and another at exactly 14/20 (does not qualify - the two boundary cases
this platform is built around), and one sample accepted submission + leaderboard entry. The seed
script is idempotent (safe to re-run).

All seeded accounts share one password: see [Demo accounts](#demo-accounts).

## Testing

```powershell
npm run test
```

Runs 30 tests across `packages/shared` (pure scoring/comparison/ranking logic) and `apps/api`
(middleware, services, and full HTTP integration tests via Supertest against an in-memory
Firestore fake - see `apps/api/tests/support/fakeFirestore.ts`). No live Firebase project is
required to run these; Judge0 is exercised through the `MockCompilerProvider`.

Every "mandatory" scenario from the spec has a real, passing test:

| Scenario | Test file |
|---|---|
| 14/20 does not qualify | `tests/round1.test.ts` |
| 15/20 qualifies | `tests/round1.test.ts` |
| Round 1 cannot be submitted twice | `tests/round1.test.ts` |
| Refresh does not reset the timer | `tests/round1.test.ts` |
| Expired rounds reject further answers/submissions | `tests/round1.test.ts`, `tests/middleware.test.ts` |
| Unqualified participant cannot access Round 2 | `tests/middleware.test.ts`, `tests/api.integration.test.ts` |
| Qualified participant can access Round 2 | `tests/middleware.test.ts` |
| Hidden test cases are never sent to the frontend | `tests/round2.test.ts`, `tests/api.integration.test.ts` |
| A lower coding score never replaces a higher one | `tests/round2.test.ts` |
| Participant cannot access admin APIs | `tests/api.integration.test.ts` |
| Frozen leaderboard does not expose live results | `tests/api.integration.test.ts` |
| Run/submit rate limiting | `tests/rateLimit.test.ts` |

There is no automated frontend test suite (no test files were requested to be built for
`apps/web` beyond `apps/web/package.json`'s `test` script placeholder) - the frontend was verified
via `npm run typecheck`, `npm run lint`, and a full `npm run build` (all pages compile and
prerender), not via Playwright/RTL runs. `npm run test:web` will report "no tests found" until
some are added.

## Production build

```powershell
npm run build
```

Builds `packages/types` → `packages/config` → `packages/shared` → `apps/api` (→ `apps/api/dist`)
→ `apps/web` (→ `apps/web/.next`), in that order (the packages must be built first since the apps
import their compiled output).

## Deployment

**Frontend (Vercel):** root directory `apps/web`. Add all `NEXT_PUBLIC_*` env vars from the table
above. Set `NEXT_PUBLIC_API_BASE_URL` to your deployed backend's `/api` URL.

**Backend (Render / Railway / any Node host - no Docker):**
- Build command: `npm install && npm run build --workspace packages/types && npm run build --workspace packages/config && npm run build --workspace packages/shared && npm run build --workspace apps/api`
- Start command: `npm run start --workspace apps/api`
- Set every `api`-scoped env var from the table above, plus `FRONTEND_URL` pointed at your
  deployed frontend (CORS is restricted to exactly that origin - see `apps/api/src/app.ts`).
- Health check path: `GET /health`. Readiness path: `GET /ready` (checks Express is up, Firebase
  Admin is initialized, and compiler config is present - it never executes code).

## API endpoints

All routes are prefixed with `/api` except `/health` and `/ready`. Every response follows
`{ success: true, data, message? }` or `{ success: false, error: { code, message, details? } }`.

<details>
<summary>Full endpoint list</summary>

**Auth / profile:** `GET /auth/me`, `GET|POST|PATCH /profile`

**Event:** `GET /event`, `GET /event/status`, `GET /event/announcements`

**Round 1:** `POST /round1/start`, `GET /round1/attempt`, `PUT /round1/answer`,
`PUT /round1/mark-review`, `POST /round1/monitoring-event`, `POST /round1/submit`,
`GET /round1/result`

**Round 2:** `GET /round2/problems[/:problemId]`, `GET|PUT /round2/code/:problemId`,
`POST /round2/finish`

**Submissions:** `POST /submissions/run`, `POST /submissions`, `GET /submissions/history`,
`GET /submissions/:submissionId`

**Leaderboard:** `GET /leaderboard`, `GET /leaderboard/me`

**Admin** (all under `/admin`, admin role required): `GET /dashboard`,
`GET|PATCH /participants[/:userId]`, `GET|POST /mcq`, `PATCH|DELETE /mcq/:questionId`,
`POST /mcq/import`, `GET /mcq/export`, `GET|POST /problems`, `PATCH|DELETE /problems/:problemId`,
`GET /problems/:problemId/preview`, `POST /problems/:problemId/duplicate`,
`POST /problems/import`, `GET /problems/export`,
`POST /rounds/:roundId/start|pause|resume|end`, `PATCH /rounds/:roundId`,
`POST /rounds/round1/calculate-qualification`, `GET /round1/results`, `GET /round1/qualified`,
`GET /submissions`, `POST /submissions/:submissionId/reevaluate`, `GET /leaderboard`,
`PATCH /leaderboard/visibility`, `PATCH /event`, `GET|POST /announcements`,
`PATCH|DELETE /announcements/:id`, `GET /audit-logs`, `GET /results/export?type=...`

</details>

## Firestore collections

`users`, `events/{eventId}` + `events/{eventId}/rounds/{roundId}`, `mcqQuestions`, `mcqAttempts`,
`codingProblems`, `savedCode`, `submissions`, `leaderboards/{eventId}/entries/{userId}`,
`announcements`, `auditLogs`. This deployment runs a single event with fixed document IDs
(`events/main`, rounds `round1`/`round2`) - see `apps/api/src/repositories/collections.ts`.

## Security model

- Every write goes through the Express backend using the Firebase Admin SDK; `firebase/firestore.rules`
  denies **all** direct client Firestore access as defense-in-depth.
- Roles come from a Firebase custom claim (`role: "admin"`), set exclusively via the Admin SDK
  (`setCustomUserClaims`) - never from anything the client sends.
- Round timers, scores, qualification, and leaderboard ranks are computed and stored server-side
  only; the client never supplies any of them.
- Hidden test cases and correct MCQ answers are never included in any participant-facing API
  response (see the `*Public`/`MCQQuestionPublic` type shapes in `packages/types`, and the tests
  in `tests/round2.test.ts` / `tests/api.integration.test.ts` that assert this at the HTTP layer).
- Helmet, restricted CORS (single allowed origin), per-route rate limiting, request/code/output
  size limits, and centralized error handling that never leaks stack traces or credentials in
  production are all wired in `apps/api/src/app.ts` and `apps/api/src/middleware/`.

## Troubleshooting

- **"Invalid environment configuration" on API startup** - one of the required `apps/api/.env`
  values is missing; the error message lists exactly which.
- **Role changes don't take effect immediately** - Firebase ID tokens cache claims for up to an
  hour; force a refresh (sign out/in, or call `getIdToken(true)`) after promoting/disqualifying
  someone.
- **CORS errors in the browser** - `FRONTEND_URL` on the backend must exactly match the frontend's
  origin (protocol + host + port).
- **Judge0 requests fail or hang** - check `JUDGE0_API_URL`/credentials, and that
  `COMPILER_PROVIDER=judge0` is actually set (it defaults to `mock`, which never talks to Judge0
  at all).
- **`next build` fails with a Firebase `auth/invalid-api-key` prerender error** - make sure
  `apps/web/.env.local` has real `NEXT_PUBLIC_FIREBASE_*` values before building for production.

## Demo accounts

After `npm run seed`, every seeded account shares the password **`TechSurvivor@2026`**:

| Role | Email | Notes |
|---|---|---|
| Admin | `admin@techsurvivor.dev` | |
| Participant | `alice.participant@example.com` | Round 1 finalized at 15/20 - qualified |
| Participant | `bob.participant@example.com` | Round 1 finalized at 14/20 - not qualified |
| Participant | `carol.participant@example.com` | No attempt yet - use to try the live Round 1 flow |
| Participant | `dave.participant@example.com` | No attempt yet |
| Participant | `eve.participant@example.com` | No attempt yet |

This password is for local development only - change it (or don't seed) before any real event.

## Completed feature checklist

Everything the spec asked for is implemented and wired to a real backend, with these honest
caveats: (1) it has not been run against a live Firebase project or a real Judge0 account in this
environment, and (2) a handful of judgment calls were made where the spec's endpoint list and its
functional requirements didn't line up one-to-one (a few additive admin endpoints beyond the
literal list, documented above and in code comments where the reasoning matters).

- [x] Next.js + Express + Firebase Auth + Firestore + Admin SDK, no Docker anywhere
- [x] Participant + admin portals, full MCQ exam engine, LeetCode-style coding interface
- [x] Judge0 + Mock compiler providers behind one interface, hidden tests protected
- [x] Leaderboard with tie-breaking, freeze/publish, CSV export
- [x] Event/round controls, security middleware, audit logging
- [x] Seed data, admin-creation script, README, Firestore rules/indexes
- [x] 30 automated tests covering every mandatory scenario in the spec

## Known limitations

- **Not run against live Firebase/Judge0.** The integration code is real and complete, but only
  a real credential-backed smoke test can fully confirm it end-to-end. Do that before a live event.
- **Pausing a round does not extend individual attempt/round end times.** Resuming a paused round
  puts it back to `live` but does not add back the paused duration - a documented simplification
  in `apps/api/src/routes/admin/rounds.ts`.
- **Leaderboard penalty time is a simplified model** (a fixed number of minutes per non-accepted
  Submit on a not-yet-solved problem), not full ICPC-style penalty scoring - see
  `PENALTY_MINUTES_PER_WRONG_SUBMISSION` in `packages/config`.
- **"Clear Response" in the Round 1 exam UI was deliberately not implemented** as a real
  clear-and-persist action, because the backend only supports upserting an answer, not unsetting
  one - see the code comment in `apps/web/app/(participant)/round1/_components/ExamSession.tsx`.
  Selecting a different option is the supported way to change an answer.
- **Browser-based exam monitoring cannot guarantee cheating prevention** - this is disclosed to
  participants directly in the product, per the spec's own instruction not to overstate it.
- **No frontend automated test suite** (Playwright/RTL) was built - see "Testing" above.
