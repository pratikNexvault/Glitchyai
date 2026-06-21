import {
  COOKIE_NAME,
  verifyPassword,
  createSessionToken,
  isBrowserAuthorized,
  supabaseFetch,
  supabaseConfigured,
  PROVIDERS,
  listInfinityModels,
} from "./_lib.js";

export const config = { runtime: "edge" };

export default async function handler(req) {
  const url = new URL(req.url);
  const action = url.searchParams.get("action");

  try {
    if (action === "login") return handleLogin(req);

    if (!(await isBrowserAuthorized(req))) {
      return json({ error: "Unauthorized" }, 401);
    }

    if (action === "conversations") return handleConversations(url);
    if (action === "messages") return handleMessages(url);
    if (action === "summarize") return handleSummarize(req);
    if (action === "models") return handleModels();

    return json({ error: "Unknown action" }, 400);
  } catch {
    return json({ error: "Something went wrong." }, 500);
  }
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });
}

async function handleLogin(req) {
  const body = await req.json().catch(() => ({}));
  const ok = await verifyPassword(body.password || "");
  if (!ok) return json({ error: "Incorrect password" }, 401);

  const token = await createSessionToken();
  const res = json({ ok: true });
  res.headers.set(
    "Set-Cookie",
    `${COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${60 * 60 * 24 * 30}`
  );
  return res;
}

async function handleConversations(url) {
  if (!supabaseConfigured()) return json({ conversations: [] });
  const q = url.searchParams.get("q");
  let path = "conversations?select=id,title,updated_at&order=updated_at.desc&limit=50";
  if (q) path += `&title=ilike.${encodeURIComponent(`*${q}*`)}`;
  const res = await supabaseFetch(path);
  const rows = res && res.ok ? await res.json().catch(() => []) : [];
  return json({ conversations: Array.isArray(rows) ? rows : [] });
}

async function handleMessages(url) {
  if (!supabaseConfigured()) return json({ messages: [] });
  const conversationId = url.searchParams.get("conversation_id");
  if (!conversationId) return json({ messages: [] });
  const res = await supabaseFetch(
    `messages?conversation_id=eq.${encodeURIComponent(conversationId)}&select=role,content&order=created_at.asc`
  );
  const rows = res && res.ok ? await res.json().catch(() => []) : [];
  return json({ messages: Array.isArray(rows) ? rows : [] });
}

async function handleSummarize(req) {
  if (!supabaseConfigured() || !PROVIDERS.nova.configured()) return json({ ok: false });
  const body = await req.json().catch(() => ({}));
  const conversationId = body.conversationId;
  if (!conversationId) return json({ ok: false });

  const res = await supabaseFetch(
    `messages?conversation_id=eq.${encodeURIComponent(conversationId)}&select=role,content&order=created_at.asc`
  );
  const rows = res && res.ok ? await res.json().catch(() => []) : [];
  if (!Array.isArray(rows) || rows.length < 2) return json({ ok: false });

  const transcript = rows.map((r) => `${r.role}: ${r.content}`).join("\n").slice(0, 6000);

  const upstream = await PROVIDERS.nova.call(
    [
      {
        role: "system",
        content:
          "Summarize the following conversation in 1-2 short sentences, capturing any facts, preferences, or decisions worth remembering long-term. Be concise and write in third person about Prateek.",
      },
      { role: "user", content: transcript },
    ],
    { stream: false }
  );

  if (!upstream || !upstream.ok) return json({ ok: false });
  const data = await upstream.json().catch(() => null);
  const summary = data?.choices?.[0]?.message?.content;
  if (!summary) return json({ ok: false });

  await supabaseFetch("memories", {
    method: "POST",
    body: JSON.stringify({ type: "summary", content: summary, conversation_id: conversationId }),
  });

  return json({ ok: true });
}

async function handleModels() {
  const data = await listInfinityModels();
  return json(data);
}
