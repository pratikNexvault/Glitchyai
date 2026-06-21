# Lumis AI

Prateek Pandey's personal AI assistant. Private — not a public chatbot.

## Files

- `index.html` — the entire app: chat UI, model switcher, history sidebar, markdown/code rendering. No build step.
- `middleware.js` — gates the whole site behind your password.
- `api/chat.js` — the brain: routes to ORION/NOVA/INFINITY, retrieves memory, runs tools (search/memory/email), streams the answer, saves history. Also doubles as your own external API.
- `api/data.js` — login, conversation list + search, loading old chats, background summaries, Infinity's live model list.
- `api/send-mail.js` — actually sends email via Gmail SMTP (needs Node, not Edge — SMTP needs a real TCP socket).
- `api/_lib.js` — shared helpers (never deployed as a route). All three providers live here.
- `vercel.json`, `package.json`, `.env.example`, `.gitignore` — project basics.

## 1. Set environment variables

Copy every value from `.env.example` into Vercel → Project → Settings →
Environment Variables. A few are already filled in (Supabase, SMTP user,
session secret, your Lumis API key) — the rest you fill in as you get them:

- **NOVA** — paste your freemodel.dev `AI_API_KEY`. Already working otherwise.
- **ORION** — needs `ORION_BASE_URL` + `ORION_API_KEY` from OpenClaude. Until
  then, selecting ORION just says "not connected yet."
- **INFINITY** — needs `HOTBOT_BASE_URL` + `HOTBOT_API_KEY` from Hotbot. Same deal.
- **Search** — get a free `TAVILY_API_KEY` at tavily.com.
- **Email** — paste your Gmail app password into `SMTP_PASSWORD`.

## 2. Create the Supabase tables

Open your Supabase project → SQL Editor → run this once:

```sql
create table conversations (
  id uuid primary key,
  title text not null default 'Untitled chat',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references conversations(id) on delete cascade,
  role text not null check (role in ('user','assistant')),
  content text not null,
  created_at timestamptz not null default now()
);

create table memories (
  id uuid primary key default gen_random_uuid(),
  type text not null default 'fact',
  content text not null,
  conversation_id uuid references conversations(id) on delete set null,
  created_at timestamptz not null default now()
);

-- RLS is off on purpose: the publishable key is never sent to the browser,
-- only used server-side inside api/_lib.js. Only your own Vercel functions
-- ever call Supabase.
alter table conversations disable row level security;
alter table messages disable row level security;
alter table memories disable row level security;
```

## 3. Deploy

Push to GitHub, import in Vercel (framework preset: Other), add the env
vars above, deploy. First visit asks for the password — `lumisz197`,
hashed in `api/_lib.js` so it's never stored in plain text anywhere.

## How the moving pieces fit together

- **Model switcher** — Auto / ORION / NOVA / INFINITY in the header. Auto
  currently routes by a simple keyword check (code-shaped messages →
  ORION if connected, otherwise NOVA). Every reply shows a small
  "⚡ Routed to ___" tag.
- **Memory** — say "remember this", "yaad rakhna", "save this" in any
  phrasing, in any language — Lumis calls a tool that writes to the
  `memories` table. "Forget that" deletes matching rows. Memory belongs to
  Lumis, not to any one model — switching ORION/NOVA/INFINITY mid-chat
  doesn't lose anything, since every provider reads the same Supabase memory
  block before answering.
- **Web search** — Lumis decides on its own when to search, shows sources
  as clickable pills under the answer.
- **Email** — "generate 10 cat names and email them" → Lumis writes the
  content, calls `send_email`, which goes out from `lumis.chat@gmail.com`
  to `pratikpandey318@gmail.com` by default, or wherever you specify.
- **History** — every exchange is saved; the sidebar lists real
  conversations with working search; clicking one reloads it. Leaving a
  conversation (hitting New Chat) fires a background summary into memory.
- **Your own API** — `https://<deployment>/v1/chat/completions` with
  `Authorization: Bearer <LUMIS_API_KEY>` works like any OpenAI-compatible
  endpoint, routed to NOVA, usable from any other tool or script.

## Still pending (needs real credentials/docs from you)

- **ORION / INFINITY going live** — just needs their base URL + key.
- **Infinity's rich model browser** (vision/reasoning/context-length tags
  per model) — `api/data.js?action=models` already fetches Hotbot's live
  model list, but capability tags aren't part of the standard `/models`
  response, so showing them needs Hotbot's actual docs first rather than
  guessed/fake labels.
- **Settings/Profile pages** — SMTP, search, and provider config currently
  live in env vars (same pattern as everything else here). A UI for editing
  them can be added without touching this architecture, if you want it.
- **File upload (images/PDF/docs)** — not started yet; flagged separately
  since binary handling needs its own careful pass.
