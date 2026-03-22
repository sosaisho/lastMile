import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { findBankContact } from './lib/knowledge.js';
import { shouldBlockUserMessage, checkDraftSensitivity, COMM_AGENT_PII_RULE } from './lib/guardrails.js';

const PORT = Number(process.env.PORT) || 8787;
const ANTHROPIC = 'https://api.anthropic.com/v1/messages';

// Prefer ANTHROPIC_API_KEY from the host (e.g. Vercel → Project → Settings → Environment Variables).
// Optional fallback for private deploys only — if you paste a real key here and push to a public repo, the key is exposed.
const SERVER_ANTHROPIC_KEY_FALLBACK = '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';

/** Read at request time so serverless runtimes see Vercel-injected env (avoids build-time inlining). */
function getAnthropicApiKey() {
  const fromHost = String(process.env['ANTHROPIC_API_KEY'] ?? '').trim();
  const fallback = String(SERVER_ANTHROPIC_KEY_FALLBACK ?? '').trim();
  return fromHost || fallback;
}
const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '2mb' }));

// Serve the frontend (passage-v2.html + js/ folder) from the same port.
// This means no second terminal — everything runs on http://localhost:8787.
app.use(express.static(join(__dirname, '..')));

app.get('/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'passage-server',
    aiConfigured: !!getAnthropicApiKey(),
  });
});

/** Anthropic-compatible streaming proxy — API key stays server-side */
app.post('/v1/messages', async (req, res) => {
  const anthropicApiKey = getAnthropicApiKey();
  if (!anthropicApiKey) {
    res.status(503).json({ error: 'ANTHROPIC_API_KEY not configured on server' });
    return;
  }
  try {
    const upstream = await fetch(ANTHROPIC, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicApiKey,
        'anthropic-version': req.headers['anthropic-version'] || '2023-06-01',
      },
      body: JSON.stringify(req.body),
    });
    const ct = upstream.headers.get('content-type');
    if (ct) res.setHeader('Content-Type', ct);
    res.status(upstream.status);
    if (!upstream.body) {
      const t = await upstream.text();
      res.send(t);
      return;
    }
    const reader = upstream.body.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(Buffer.from(value));
    }
    res.end();
  } catch (e) {
    console.error('proxy error', e);
    if (!res.headersSent) res.status(500).json({ error: 'Proxy failed' });
  }
});

/**
 * Multi-agent bank draft: General → Search (knowledge) → Communication (stream) → Verify
 * Streams SSE: { type: 'trace'|'draft_delta'|'done', ... }
 */
app.post('/api/orchestrate/bank-draft', async (req, res) => {
  const anthropicApiKey = getAnthropicApiKey();
  if (!anthropicApiKey) {
    res.status(503).json({ error: 'ANTHROPIC_API_KEY not configured' });
    return;
  }
  const body = req.body || {};
  // Guardrail 1 (General Assistant) — reject out-of-scope requests before any agent runs
  const lastUserChat = body.lastUserMessage || '';
  if (shouldBlockUserMessage(lastUserChat)) {
    res.status(400).json({ error: 'blocked', message: 'Request blocked by policy' });
    return;
  }

  const {
    bankName = '',
    acctType = '',
    acctNum = '',
    context = '',
    notes = '',
    taxContext = '',
    formContext = '',
    information = {},
  } = body;

  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  const send = (obj) => {
    res.write(`data: ${JSON.stringify(obj)}\n\n`);
  };

  const info = findBankContact(bankName);
  send({
    type: 'trace',
    traceType: 'step',
    label: 'General assistant',
    text: `Coordinating bank notification for ${bankName || 'institution'}.`,
  });
  const webHref = info.web && !info.web.startsWith('Search') ? info.web : null;
  send({
    type: 'trace',
    traceType: 'action',
    label: 'Search agent',
    text: `Knowledge repository: matched ${info.name} — ${info.dept}. Reference: curated institution directory (no live web crawl).`,
    href: webHref,
  });

  const deceased = information.deceasedName || '';
  const executor = information.executorRelationship || '';
  const state = information.state || '';
  const today = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const userContent = `Draft a bank estate notification letter.
Bank: ${info.name}
Department: ${info.dept}
Account type: ${acctType || 'not specified'}
Account last 4 digits: ${acctNum ? `ending in ${acctNum}` : 'not specified'}
Context: ${context || 'none'}
Deceased: ${deceased || '[name]'}
State: ${state || '[state]'}
Executor: ${executor || '[relationship]'}
Date: ${today}
Additional notes: ${notes || 'none'}${taxContext}${formContext}`;

  let draft = '';
  try {
    const upstream = await fetch(ANTHROPIC, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicApiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 800,
        stream: true,
        system:
          COMM_AGENT_PII_RULE +
          ' You are a compassionate estate specialist. Draft a professional, warm bank estate notification letter. Use plain language. Formal but kind. Sign from executor perspective. Do not use em dashes. Do not mention artificial intelligence.',
        messages: [{ role: 'user', content: userContent }],
      }),
    });

    if (!upstream.ok || !upstream.body) {
      send({ type: 'error', message: await upstream.text() });
      send({ type: 'done', fullDraft: '', error: true });
      res.end();
      return;
    }

  // Guardrail 3 (Communication Agent) — PII prohibition is enforced via system prompt
  send({
    type: 'trace',
    traceType: 'action',
    label: 'Communication agent',
    text: 'Drafting letter. PII guardrail active: SSNs, full account numbers, and dates of birth are prohibited from output.',
  });

  const reader = upstream.body.getReader();
    const dec = new TextDecoder();
    let buffer = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += dec.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const raw = line.slice(6);
        if (raw === '[DONE]') continue;
        try {
          const j = JSON.parse(raw);
          if (j.type === 'content_block_delta' && j.delta?.text) {
            draft += j.delta.text;
            send({ type: 'draft_delta', text: j.delta.text });
          }
        } catch {
          /* ignore */
        }
      }
    }
  } catch (e) {
    console.error('orchestrate draft error', e);
    send({ type: 'error', message: String(e.message || e) });
    send({ type: 'done', fullDraft: draft, error: true });
    res.end();
    return;
  }

  // Guardrail 2 (Verify Agent) — validate draft against information repo and run full sensitivity check
  send({
    type: 'trace',
    traceType: 'verify',
    label: 'Verify agent',
    text: 'Checking draft against information repository: names, placeholders, sensitive data patterns…',
  });

  const issues = [];

  // Cross-reference: deceased name from information repository
  if (deceased && draft && !draft.toLowerCase().includes(deceased.toLowerCase().split(' ')[0])) {
    issues.push({ msg: 'Deceased first name may be missing or mismatched — cross-reference with intake', sev: 'warn' });
  }

  // Placeholder check: warn if [brackets] remain for key fields
  const unresolvedBrackets = (draft.match(/\[(?!REDACTED)[^\]]{2,40}\]/g) || []);
  if (unresolvedBrackets.length > 0) {
    issues.push({ msg: `Unresolved placeholder(s): ${unresolvedBrackets.slice(0, 3).join(', ')} — fill in before sending`, sev: 'warn' });
  }

  // Guardrail 1 — run full PII/sensitivity scan on the output
  const sensitivityIssues = checkDraftSensitivity(draft);
  issues.push(...sensitivityIssues);

  const errors = issues.filter((i) => i.sev === 'error');
  const warns = issues.filter((i) => i.sev === 'warn');

  let verifyText = '';
  if (errors.length > 0) {
    verifyText = `Errors found — must fix before sending: ${errors.map((i) => i.msg).join('; ')}`;
  } else if (warns.length > 0) {
    verifyText = `Warnings: ${warns.map((i) => i.msg).join('; ')}. Human review required.`;
  } else {
    verifyText = 'All automated checks passed. Human review and executor confirmation still required before sending.';
  }

  send({
    type: 'trace',
    traceType: 'verify',
    label: 'Verify agent',
    text: verifyText,
    verifyIssues: issues,
  });

  send({ type: 'done', fullDraft: draft });
  res.end();
});

// In Vercel serverless, the app is exported as the handler — listen() is not called.
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`\n  Passage is running.\n`);
    console.log(`  Open: http://localhost:${PORT}/passage-v2.html\n`);
    if (!getAnthropicApiKey()) {
      console.log(`  No ANTHROPIC_API_KEY — set it in server/.env (local) or Vercel env (deployed).\n`);
    }
  });
}

export default app;
