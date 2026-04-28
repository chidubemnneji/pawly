# Pawly

The calm, breed-aware AI app for dog parents.

Pawly is a Next.js 15 (App Router) web app with Prisma + PostgreSQL, Auth.js v5, and the Anthropic Claude SDK powering the in-app care companion. Designed to deploy to **Vercel** (app) + **Railway** (Postgres).

---

## What's inside

```
pawly/
├─ app/                       # Next.js App Router
│  ├─ (app)/                  # Authenticated app shell + 4 views (today, profile, health, chat)
│  ├─ api/                    # Route handlers (auth, onboarding, dogs, tasks, health, chat)
│  ├─ breeds/                 # Public SEO breed pages
│  ├─ login/                  # Sign-in
│  ├─ onboarding/             # 8-step wizard
│  ├─ globals.css
│  ├─ layout.tsx
│  └─ page.tsx                # Landing
├─ components/
│  ├─ landing/                # Marketing page sections
│  ├─ app/                    # In-app components (chat, task card, nav, dog switcher)
│  ├─ ui/                     # Primitives (button, card)
│  ├─ icons.tsx
│  └─ logo.tsx
├─ lib/
│  ├─ ai.ts                   # Claude integration (model selection, system prompt, triage)
│  ├─ auth.ts                 # Auth.js v5 + demo-mode fallback
│  ├─ breeds.ts               # 40+ breed catalogue
│  ├─ tasks.ts                # buildTasksForDog() — pure task generator
│  ├─ utils.ts                # Date/age/portion helpers
│  ├─ active-dog.ts           # Resolve `?dog=` to a Dog
│  └─ db.ts                   # Prisma client singleton
├─ prisma/
│  ├─ schema.prisma
│  └─ seed.ts                 # Demo Bella the Cockapoo
├─ middleware.ts              # Edge route gate
├─ types/next-auth.d.ts
├─ tailwind.config.ts
└─ next.config.mjs
```

---

## Quick start (local)

You'll need Node 20+ and a Postgres instance. The fastest path is Railway (see below) — but a local Postgres works fine too.

```bash
git clone <your-repo> pawly
cd pawly
npm install                  # or pnpm/yarn

cp .env.example .env
# Edit .env — at minimum set DATABASE_URL.

npx prisma migrate dev       # creates schema in your DB
npm run db:seed              # seeds Bella the Cockapoo (optional)

npm run dev                  # http://localhost:3000
```

In demo mode (`PAWLY_DEMO_MODE=true`, the default in `.env.example`), no auth is required — the app uses a singleton demo user. Perfect for previewing.

---

## Environment variables

See `.env.example` for the full list. The essentials:

| Variable | Required | Notes |
|---|---|---|
| `DATABASE_URL` | **yes** | Postgres connection string from Railway |
| `AUTH_SECRET` | yes (prod) | Generate with `openssl rand -base64 32` |
| `PAWLY_DEMO_MODE` | optional | Set `true` to skip auth (uses a singleton demo user). Set `false` in prod. |
| `ANTHROPIC_API_KEY` | optional | When set, chat uses Claude. When unset, falls back to a built-in mock so the app stays usable. |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | optional | Enables Google sign-in. |
| `AUTH_RESEND_KEY` / `AUTH_EMAIL_FROM` | optional | Enables email magic links via Resend. |
| `NEXT_PUBLIC_APP_URL` | optional | Your production URL (used for OG tags). |

**Auth setup is opt-in.** Pawly works in three flavours:
1. **Demo mode** (`PAWLY_DEMO_MODE=true`): no auth, single shared user. Great for testing.
2. **Google OAuth**: set `AUTH_GOOGLE_ID` + `AUTH_GOOGLE_SECRET`.
3. **Email magic links**: set `AUTH_RESEND_KEY` + `AUTH_EMAIL_FROM`.

You can enable both Google and email at the same time.

---

## Deploy: Railway (database)

1. Create a new project in [Railway](https://railway.app).
2. **Add → Database → PostgreSQL.**
3. Once provisioned, open the Postgres service and copy `DATABASE_URL` from the **Connect** tab. Use the **public** URL (e.g. `postgres://postgres:...@junction.proxy.rlwy.net:port/railway`) so Vercel can reach it.
4. Keep that URL handy — you'll paste it into Vercel.

> Tip: For migrations from your laptop, `DATABASE_URL` should be the public URL. Vercel's prod runtime can use the internal one if you also deploy the app to Railway, but for Vercel-hosted apps stick with the public URL.

---

## Deploy: Vercel (app)

1. Push this repo to GitHub.
2. In [Vercel](https://vercel.com), **New Project → Import** your GitHub repo.
3. Framework: **Next.js** (auto-detected). Build command: leave default. Root: leave default.
4. **Environment Variables** — paste at minimum:
   - `DATABASE_URL` (from Railway)
   - `AUTH_SECRET` (`openssl rand -base64 32`)
   - `ANTHROPIC_API_KEY` (from console.anthropic.com — optional but recommended)
   - One of:
     - `PAWLY_DEMO_MODE=true` (no auth, easiest for first deploy), **or**
     - `AUTH_GOOGLE_ID` + `AUTH_GOOGLE_SECRET`, **or**
     - `AUTH_RESEND_KEY` + `AUTH_EMAIL_FROM`.
   - `NEXT_PUBLIC_APP_URL=https://your-app.vercel.app`
5. **Deploy.** Vercel will run `prisma generate && next build` (see `package.json`).
6. After the first deploy, run migrations against your Railway DB **once**:
   ```bash
   # locally, with .env pointing at production DATABASE_URL
   npx prisma migrate deploy
   # optionally seed the demo dog:
   npm run db:seed
   ```

For subsequent migrations: commit your `prisma/migrations/*` folder and re-run `prisma migrate deploy` against prod.

### Custom domain on Vercel

Vercel → Project → Settings → Domains → add `pawly.app` (or yours). Point your DNS A/CNAME as instructed.

---

## How the AI works

`lib/ai.ts` is the heart of Pawly's differentiation.

- **System prompt** is built per-message from the *full dog profile*: name, breed, age, weight, conditions, allergies, food, exercise plan, plus injected breed facts. ChatGPT can answer "is X kg healthy for a Cockapoo." Only Pawly can answer "is **Bella** healthy."
- **Triage** runs first. A keyword classifier flags emergencies (seizures, bloat, toxins, etc.). For ambiguous symptoms (vomiting, lethargy), it escalates to **Claude Haiku 4.5** — a cheap call that returns just `URGENT` or `NORMAL`.
- **Main responses** come from **Claude Sonnet 4.6**. Last 10 messages are included as conversation history.
- **Graceful fallback**: when `ANTHROPIC_API_KEY` is missing, the app uses a profile-aware mock so dev and demos still feel alive.

Models are pinned in `lib/ai.ts`:
```ts
const MODEL_MAIN = 'claude-sonnet-4-6';
const MODEL_TRIAGE = 'claude-haiku-4-5-20251001';
```

---

## Design system

Tokens live in `tailwind.config.ts`. The palette is intentionally warm and not-very-tech:

| | |
|---|---|
| `cream` | `#FAF6F0` — page background |
| `moss` | `#3F6B4E` — primary, brand |
| `terracotta` | `#C9694B` — accent |
| `biscuit` | `#E9C9A0` — soft accent |
| `ink` | `#1F2A24` — text |

Type pairing: **Fraunces** (display) + **Inter** (body), loaded via `next/font/google`.

---

## Useful scripts

```bash
npm run dev                   # dev server
npm run build                 # prisma generate + next build
npm run start                 # prod server
npm run db:migrate            # prisma migrate dev (creates new migration)
npm run db:migrate:deploy     # prisma migrate deploy (apply migrations to prod)
npm run db:push               # prisma db push (no migration history — dev only)
npm run db:seed               # seed Bella the Cockapoo
npm run db:studio             # open Prisma Studio
```

---

## Roadmap (post-MVP)

See `Pawly_PRD.md` for the full PRD. The launch checklist is intentionally short:

- [ ] Replace mock chat with real Claude key in production
- [ ] Add Vercel cron for daily task regeneration (`POST /api/cron/build-tasks`)
- [ ] Wire web push notifications (Vercel/Web Push)
- [ ] Add affiliate links (insurance, fresh food) — non-paywall monetisation
- [ ] Multi-dog UI polish (the data model already supports it)
- [ ] PWA install prompts for iOS/Android home screen

---

## License

Proprietary — © Pawly. All rights reserved.

---

Built with 🐾 for dogs everywhere.
