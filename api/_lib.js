// Shared helpers used by api/chat.js, api/data.js, and middleware.js.
// This file is never deployed as a route — Vercel skips anything in /api
// that starts with an underscore.

export const COOKIE_NAME = "lumis_session";

// ---- Password (hardcoded, but only as a salted PBKDF2 hash — the actual
// password "lumisz197" is not stored anywhere in this codebase). -----------
const PASSWORD_SALT_HEX = "3954d78bfc4a58206eb24906704a3978";
const PASSWORD_HASH_HEX =
  "8c872f952892ae68130840c77c14c5a2762b580256deb7dbf43b5457a7b90c62";
const PASSWORD_ITERATIONS = 150000;

function hexToBytes(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  return bytes;
}

function bytesToHex(bytes) {
  return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function timingSafeEqualHex(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function pbkdf2Hex(text, saltHex, iterations) {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(text),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: hexToBytes(saltHex), iterations, hash: "SHA-256" },
    keyMaterial,
    256
  );
  return bytesToHex(new Uint8Array(bits));
}

export async function verifyPassword(candidate) {
  if (typeof candidate !== "string" || !candidate) return false;
  const computed = await pbkdf2Hex(candidate, PASSWORD_SALT_HEX, PASSWORD_ITERATIONS);
  return timingSafeEqualHex(computed, PASSWORD_HASH_HEX);
}

// ---- Signed session cookie (HMAC-SHA256, no external deps) ---------------
async function hmacHex(message, secret) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return bytesToHex(new Uint8Array(sig));
}

export async function createSessionToken() {
  const secret = process.env.SESSION_SECRET || "";
  const expiresAt = Date.now() + 1000 * 60 * 60 * 24 * 30; // 30 days
  const sig = await hmacHex(String(expiresAt), secret);
  return `${expiresAt}.${sig}`;
}

export async function isValidSessionToken(token) {
  if (!token) return false;
  const secret = process.env.SESSION_SECRET || "";
  const [expiresAt, sig] = token.split(".");
  if (!expiresAt || !sig) return false;
  const expected = await hmacHex(expiresAt, secret);
  if (!timingSafeEqualHex(expected, sig)) return false;
  return Date.now() < Number(expiresAt);
}

export function getCookie(req, name) {
  const header = req.headers.get("cookie") || "";
  const match = header.match(new RegExp("(?:^|;\\s*)" + name + "=([^;]+)"));
  return match ? decodeURIComponent(match[1]) : null;
}

export async function isBrowserAuthorized(req) {
  return isValidSessionToken(getCookie(req, COOKIE_NAME));
}

export function isApiKeyAuthorized(req) {
  const auth = req.headers.get("authorization") || "";
  const expected = process.env.LUMIS_API_KEY;
  if (!expected || !auth.startsWith("Bearer ")) return false;
  const token = auth.slice(7).trim();
  return token.length > 0 && token === expected;
}

// ---- Supabase REST (PostgREST) ------------------------------------------
// New-style Supabase keys (sb_publishable_/sb_secret_) must be sent ONLY on
// the apikey header — never duplicated onto Authorization, or PostgREST
// tries to parse it as a JWT and rejects the request.
export function supabaseConfigured() {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_KEY);
}

export async function supabaseFetch(path, options = {}) {
  if (!supabaseConfigured()) return null;
  const base = process.env.SUPABASE_URL.replace(/\/$/, "");
  const url = `${base}/${path.replace(/^\//, "")}`;
  const { prefer, headers, ...rest } = options;
  try {
    return await fetch(url, {
      ...rest,
      headers: {
        apikey: process.env.SUPABASE_KEY,
        "Content-Type": "application/json",
        Prefer: prefer || "return=representation",
        ...(headers || {}),
      },
    });
  } catch {
    return null;
  }
}

// ---- Multi-provider registry ---------------------------------------------
// Each provider is just an OpenAI-compatible base URL + key + model, behind
// a common .call(). Adding a future provider only ever means adding one more
// entry here — nothing else in chat.js, data.js, or index.html has to change.
function openAICompatibleCall({ baseURL, apiKey, model }, messages, { stream, tools } = {}) {
  const body = { model, stream: !!stream, messages };
  if (tools) {
    body.tools = tools;
    body.tool_choice = "auto";
  }
  return fetch(`${baseURL.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify(body),
  });
}

export const PROVIDERS = {
  // ORION — OpenClaude, tuned for code, debugging, and long reasoning.
  orion: {
    label: "ORION",
    tagline: "Deep reasoning & engineering",
    configured: () => Boolean(process.env.ORION_BASE_URL && process.env.ORION_API_KEY),
    call: (messages, opts) =>
      openAICompatibleCall(
        { baseURL: process.env.ORION_BASE_URL, apiKey: process.env.ORION_API_KEY, model: process.env.ORION_MODEL_ID || "claude" },
        messages,
        opts
      ),
  },
  // NOVA — the original freemodel.dev connection. Everyday conversation,
  // writing, and brainstorming.
  nova: {
    label: "NOVA",
    tagline: "Conversation, writing & ideas",
    configured: () => Boolean(process.env.AI_BASE_URL && process.env.AI_API_KEY && process.env.AI_MODEL_ID),
    call: (messages, opts) =>
      openAICompatibleCall(
        { baseURL: process.env.AI_BASE_URL, apiKey: process.env.AI_API_KEY, model: process.env.AI_MODEL_ID },
        messages,
        opts
      ),
  },
  // INFINITY — Hotbot, a 700+ model aggregator. Model id is resolved
  // dynamically (see listInfinityModels below) rather than hardcoded.
  infinity: {
    label: "INFINITY",
    tagline: "700+ models, picks what fits",
    configured: () => Boolean(process.env.HOTBOT_BASE_URL && process.env.HOTBOT_API_KEY),
    call: (messages, opts) =>
      openAICompatibleCall(
        {
          baseURL: process.env.HOTBOT_BASE_URL,
          apiKey: process.env.HOTBOT_API_KEY,
          model: opts.model || process.env.HOTBOT_DEFAULT_MODEL || "auto",
        },
        messages,
        opts
      ),
  },
};

export function anyProviderConfigured() {
  return Object.values(PROVIDERS).some((p) => p.configured());
}

// Auto mode: route by a simple heuristic today; once Infinity's model list
// carries real capability tags (vision, reasoning, context length), this can
// pick by those instead of keywords, with no change needed anywhere else.
const CODE_HINTS = /```|\bfunction\b|\bclass\b|\bdef\b|\bimport\b|\berror\b|\bbug\b|stack trace|\bregex\b|\bapi\b|database|\bsql\b|\bjson\b|exception/i;

export function resolveProvider(requested, userText) {
  if (requested && requested !== "auto" && PROVIDERS[requested]) return requested;
  if (CODE_HINTS.test(userText || "") && PROVIDERS.orion.configured()) return "orion";
  if (PROVIDERS.nova.configured()) return "nova";
  if (PROVIDERS.orion.configured()) return "orion";
  if (PROVIDERS.infinity.configured()) return "infinity";
  return "nova";
}

// Fetches Infinity's live model list (OpenAI-style GET /models). No
// capability metadata is invented — only what Hotbot actually reports.
export async function listInfinityModels() {
  if (!PROVIDERS.infinity.configured()) return { models: [], configured: false };
  try {
    const res = await fetch(`${process.env.HOTBOT_BASE_URL.replace(/\/$/, "")}/models`, {
      headers: { Authorization: `Bearer ${process.env.HOTBOT_API_KEY}` },
    });
    if (!res.ok) return { models: [], configured: true, error: "Hotbot returned an error." };
    const data = await res.json();
    const models = (data.data || data.models || []).map((m) =>
      typeof m === "string" ? { id: m } : { id: m.id, owned_by: m.owned_by }
    );
    return { models, configured: true };
  } catch {
    return { models: [], configured: true, error: "Couldn't reach Hotbot." };
  }
}

export const SYSTEM_PROMPT = `You are Lumis AI, the personal AI assistant of Prateek Pandey (also known as Developer Pratik). This is a private assistant used only by Prateek — not a public chatbot. Be direct, practical, and concise. Think like an experienced senior engineer: when several solutions exist, recommend the best one, explain why briefly, and mention real trade-offs. Be proactive about suggesting improvements when it genuinely helps. Avoid unnecessary preamble or robotic filler.

Code completeness is non-negotiable: when asked to build or fix something, always output the complete implementation, in full, every time. Never shorten, summarize, or omit sections of generated code. Never write placeholders like "// existing code", "// rest unchanged", "// continue", or "// omitted" in place of real code — write the actual lines instead. If a complete answer would run long, keep going across as much of your response as needed rather than truncating; never ask whether to continue, and never skip a requested line.

You have tools for web search and for managing a personal memory store about Prateek. Use web_search for anything time-sensitive, current, or outside your training knowledge. Use save_memory whenever Prateek asks you to remember, save, or store something — in any language or phrasing ("remember this", "yaad rakhna", "save this", "store this in memory") — saving a short, clear statement of the fact. Use forget_memory when he asks you to forget or remove something, describing what to forget. Use send_email when he asks you to email, send, or mail something — write the actual content yourself, then call the tool with a subject and the finished body. Don't narrate that you're using a tool; just use it naturally and confirm briefly afterward.`;

export const TOOLS = [
  {
    type: "function",
    function: {
      name: "web_search",
      description: "Search the internet for current information, news, or anything that might be outside your training knowledge.",
      parameters: {
        type: "object",
        properties: { query: { type: "string", description: "The search query." } },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "save_memory",
      description: "Save a fact, preference, or instruction about Prateek to long-term memory, for use in future conversations.",
      parameters: {
        type: "object",
        properties: { content: { type: "string", description: "A short, clear statement of what to remember." } },
        required: ["content"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "forget_memory",
      description: "Remove a previously saved memory that matches the given description.",
      parameters: {
        type: "object",
        properties: { query: { type: "string", description: "A description of what to forget, used to find matching memories." } },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "send_email",
      description: "Send an email. Defaults to Prateek's own inbox unless he names a different recipient.",
      parameters: {
        type: "object",
        properties: {
          to: { type: "string", description: "Recipient email address. Omit to use the default inbox." },
          subject: { type: "string", description: "Email subject line." },
          body: { type: "string", description: "The full email body, already written out." },
        },
        required: ["subject", "body"],
      },
    },
  },
];

// ---- Web search (Tavily) -------------------------------------------------
export async function tavilySearch(query) {
  const key = process.env.TAVILY_API_KEY;
  if (!key) return { results: [] };
  try {
    const res = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({ query, search_depth: "basic" }),
    });
    if (!res.ok) return { results: [] };
    const data = await res.json();
    const results = (data.results || []).slice(0, 5).map((r) => ({
      title: r.title || r.url,
      url: r.url,
      snippet: (r.content || "").slice(0, 220),
    }));
    return { results };
  } catch {
    return { results: [] };
  }
}

// ---- Email (Gmail SMTP via a plain RFC 822 message over a TLS socket
// substitute: Vercel's Edge runtime has no raw TCP sockets, so sending mail
// happens through a small Node serverless function instead — see
// api/send-mail.js, which this file's send_email handling in chat.js calls
// internally over HTTP.) -----------------------------------------------
export async function sendEmailViaInternalApi(origin, { to, subject, body }) {
  try {
    const res = await fetch(`${origin}/api/send-mail`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-internal-key": process.env.SESSION_SECRET || "" },
      body: JSON.stringify({ to, subject, body }),
    });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, ...data };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}
