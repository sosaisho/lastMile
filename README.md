# LastMile — Estate Guide

LastMile is a compassionate, AI-powered estate administration guide that walks executors and family members through every step of settling a loved one's estate. It generates a personalized, prioritized task list, drafts letters and notifications, and tracks progress — all in a private, session-based interface.

Built at **EmpireHacks 2026** (Cornell Tech × Columbia × Gona Semiconductors) using the Anthropic API.

---

## What it does

After a brief intake (relationship, state, assets, digital accounts, benefits, survivors, and will status), LastMile:

- **Generates a tailored checklist** — 18–26 tasks built deterministically from what the user reported, across Government & Legal, Financial Accounts, Property & Insurance, Digital & Subscriptions, Notifications, and Survivor Benefits. AI then enriches each task with state-specific court names, form numbers, and deadlines.
- **Flags complexity** — a deterministic rule engine scans the intake for high-risk conditions (no will with real estate, cryptocurrency, minor beneficiaries, business debts) and logs clear warnings with legal citations.
- **Guides each task step by step** — bank notifications, employer HR letters, life insurance claims, SSA/VA workflows, streaming service cancellations, and more.
- **Drafts public-facing letters** — streaming, word-by-word, ready to copy or download.
- **Checks every draft** — regex-based PII detection (SSN, account numbers, DOB), a mandatory human review gate, and an Agent Trace panel showing every AI step with its legal basis.
- **Escalates appropriately** — flags probate, cryptocurrency access risk, minor beneficiary guardianship, and business debt liability, with attorney referrals by state.
- **Tracks progress** — death certificate copy counts, institution response log, deadline reminders, and print-to-PDF export.
- **Saves and resumes** — all state lives in `localStorage`; close the tab and return where you left off.

---

## Agent architecture

LastMile uses 8 specialized agents. The task list is always built deterministically first — AI enriches and checks but never generates the core checklist from scratch.

| Agent | Type | Role |
|-------|------|------|
| Task Generation | Deterministic | Builds the task list from intake data; every task is tied directly to something the user reported |
| AI Enrichment | LLM | Adds state-specific court names, form numbers, deadlines, and official `.gov` source URLs to task descriptions |
| Complexity Check | Deterministic | Evaluates the intake against formal legal rules (RUFADAA, intestacy, Garn-St. Germain, COBRA) and flags elevated-risk conditions |
| General Assistant | Rule-based | Applies scope guardrails before any LLM work begins; blocks off-topic requests |
| Communication | LLM (streaming) | Drafts bank letters, employer HR notifications, life insurance claims, and generic notifications |
| Verify | Rule-based (regex) | Scans every draft for PII before the send modal opens |
| Document Parsing | LLM | Extracts institution and employer names from uploaded tax returns and bank statements using PII-obfuscated content |
| Chat | LLM | Context-aware Q&A with mandatory source citations and an uncertainty rule |

See [`AGENTS.md`](AGENTS.md) for full documentation of each agent's role, system prompts, guardrails, and trace events.

---

## Repository structure

```
passage-v2.html         # App shell — HTML + CSS, no inline JS
js/
  state.js              # Global state, localStorage persistence, anthropicFetch()
  guardrails.js         # PII detection patterns and scope guardrail list
  knowledge.js          # Curated legal citations, official URLs, task option lists
  utils.js              # Shared helpers (AI draft disclaimer, copy/download, sub-cards)
  agents.js             # Agent trace, send modal, toast, scope guardrail check
  tasks.js              # Task generation (deterministic), AI enrichment, complexity check
  onboarding.js         # Intake flow, document upload, PII obfuscation
  chat.js               # Chat agent with source citation parsing
  render.js             # Workflow dispatcher, options panel, call script generator, link chips
  main.js               # App entry point, API connectivity check, API key modal
  workflows/
    bank.js             # Multi-step bank notification workflow
    other.js            # Employer, SSA, VA, life insurance, streaming, generic workflows
server/
  index.js              # Express API: Anthropic proxy + bank orchestration pipeline
  knowledge/banks.json  # Institution contact knowledge base
  lib/knowledge.js      # findBankContact() helper
  lib/guardrails.js     # Server-side blocked-phrase list
  package.json
  .env.example
AGENTS.md               # Full agent documentation (roles, prompts, guardrails, trace events)
```

---

## Getting started (local setup)

### One command

```bash
./start.sh
```

That's it. On first run this installs dependencies, starts the server, and opens `http://localhost:8787/passage-v2.html` in your browser automatically. No `.env` file required — if no API key is found, the app will prompt you for one.

Alternatively:

```bash
npm start        # same as start.sh, without auto-opening the browser
npm run dev      # same but with file watching (restarts server on changes)
```

### API key

The app will show a prompt on first load if no API key is configured. Paste your Anthropic API key (`sk-ant-api03-...`) into the field — it is saved to `localStorage` and restored automatically on every future visit. Get a key at [console.anthropic.com](https://console.anthropic.com).

If you prefer to configure the key server-side (keeps it out of the browser entirely):

```bash
cp server/.env.example server/.env
# Edit server/.env and set ANTHROPIC_API_KEY=sk-ant-api03-...
```

### Reset to onboarding

```javascript
localStorage.clear(); location.reload();
```

### Point at a deployed backend

```html
<script>window.PASSAGE_API_BASE = 'https://your-api.example.com';</script>
```

---

## API endpoints

The frontend and backend run on the same port (`8787`). The server serves `passage-v2.html` and the `js/` folder as static files, so no separate file server is needed.

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Liveness check |
| `GET` | `/passage-v2.html` | Frontend app |
| `POST` | `/v1/messages` | Anthropic proxy — API key stays server-side, supports streaming |
| `POST` | `/api/orchestrate/bank-draft` | Multi-agent bank letter pipeline (SSE) |

### Bank draft pipeline (`/api/orchestrate/bank-draft`)

Streams Server-Sent Events with `type` values of `trace`, `draft_delta`, and `done`:

```
General assistant → Search agent (knowledge base) → Communication agent (streaming) → Verify agent
```

---

## Environment variables

| Variable | Description |
|----------|-------------|
| `ANTHROPIC_API_KEY` | Required. Your Anthropic API key (`sk-ant-api03-...`). |
| `PORT` | Optional. Defaults to `8787`. |

---

## How to host

**Frontend** — any static host (no server required in browser-only mode):
- [Netlify](https://netlify.com), [Vercel](https://vercel.com), or [Cloudflare Pages](https://pages.cloudflare.com): connect the repo, publish directory `/`, default page `passage-v2.html`.
- [GitHub Pages](https://pages.github.com): enable Pages on `main`.

In browser-only mode, users enter their own API key on first visit via the key modal.

**Backend** — any Node-capable platform:
- [Railway](https://railway.app), [Render](https://render.com), [Fly.io](https://fly.io), or [Google Cloud Run](https://cloud.google.com/run): deploy the `server/` directory, set `ANTHROPIC_API_KEY` as a secret environment variable.

Set `window.PASSAGE_API_BASE` in the frontend to your deployed API URL.

---

## Design principles

- **Privacy first** — all sensitive data lives in the browser session and localStorage only; nothing is persisted server-side.
- **Deterministic core, AI-assisted detail** — the task list is always built from what the user reported, not hallucinated. AI adds state-specific guidance on top.
- **PII obfuscation before LLM** — SSNs, account numbers, dates, phone numbers, email addresses, and street addresses are stripped from documents before any content is sent to an LLM.
- **Placeholders over invention** — AI drafts use `[brackets]` for any unknown field rather than generating plausible-sounding but unverified information.
- **Human in the loop** — every letter requires the user to read, review, and manually send. No automated submissions.
- **Guardrails** — out-of-scope requests (asset maximization, will contests, tax avoidance, fraud) are blocked before any LLM call.
- **Traceability** — every agent action is logged with the reasoning, legal citation, and source URL that drove it.

---

## Tech stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| UI | Vanilla HTML / CSS / JavaScript | No framework; all DOM manipulation by hand |
| Fonts | Playfair Display + DM Sans | Loaded from Google Fonts |
| AI model | Anthropic `claude-sonnet-4-20250514` | Used for enrichment, letter drafting, call scripts, document parsing, and chat |
| Streaming | Anthropic streaming API + `ReadableStream` | Word-by-word letter and call script generation |
| Backend | Node.js + Express | Thin proxy that keeps the API key server-side; also runs the multi-agent bank pipeline |
| Document parsing | PDF.js (client-side) | Text extraction from uploaded PDFs before PII obfuscation and LLM parsing |
| Persistence | Browser `localStorage` | Full session state; no database |
| Hosting (frontend) | Any static host | Works browser-only via API key modal |
| Hosting (backend) | Any Node.js platform | Railway, Render, Fly.io, GCR |
