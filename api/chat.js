import {
  SYSTEM_PROMPT,
  TOOLS,
  PROVIDERS,
  resolveProvider,
  anyProviderConfigured,
  isBrowserAuthorized,
  isApiKeyAuthorized,
  supabaseFetch,
  supabaseConfigured,
  tavilySearch,
  sendEmailViaInternalApi,
} from "./_lib.js";

export const config = { runtime: "edge" };

export default async function handler(req) {
  try {
    if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

    const externalMode = isApiKeyAuthorized(req);
    if (!externalMode && !(await isBrowserAuthorized(req))) {
      return new Response("Unauthorized", { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const clientMessages = Array.isArray(body.messages) ? body.messages : [];
    const conversationId = typeof body.conversationId === "string" ? body.conversationId : null;
    const requestedProvider = typeof body.provider === "string" ? body.provider : "auto";

    if (!anyProviderConfigured()) {
      return plainText(
        "Lumis AI isn't connected to any model yet. Add at least one provider's keys (NOVA needs AI_BASE_URL/AI_API_KEY/AI_MODEL_ID) in your Vercel environment variables and redeploy."
      );
    }

    // External callers (your own Lumis API key, used from anywhere else) get
    // a clean, stateless OpenAI-style proxy on NOVA — no memory, tools, or history.
    if (externalMode) {
      return proxyPlain(clientMessages);
    }

    const lastUserText = [...clientMessages].reverse().find((m) => m.role === "user")?.content || "";
    const providerId = resolveProvider(requestedProvider, lastUserText);
    const provider = PROVIDERS[providerId];

    if (!provider.configured()) {
      return plainText(
        `<<<MODEL>>>${providerId}<<<END_MODEL>>>${provider.label} isn't connected yet — add its API key in your Vercel environment variables and redeploy, or pick a different model for now.`
      );
    }

    const memoryBlock = await loadMemoryBlock();
    const baseMessages = [{ role: "system", content: SYSTEM_PROMPT + memoryBlock }, ...clientMessages];
    const origin = new URL(req.url).origin;

    return streamWithTools(baseMessages, clientMessages, conversationId, origin, provider, providerId);
  } catch {
    return plainText("Something went wrong on Lumis AI's side. Please try again.");
  }
}

function plainText(text) {
  return new Response(text, { status: 200, headers: { "Content-Type": "text/plain; charset=utf-8" } });
}

async function* iterateSSE(body) {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const payload = trimmed.slice(5).trim();
      if (payload === "[DONE]") continue;
      try {
        yield JSON.parse(payload);
      } catch {
        // Skip partial/malformed chunks.
      }
    }
  }
}

async function loadMemoryBlock() {
  if (!supabaseConfigured()) return "";
  const res = await supabaseFetch("memories?select=content&order=created_at.desc&limit=40");
  if (!res || !res.ok) return "";
  const rows = await res.json().catch(() => []);
  if (!Array.isArray(rows) || !rows.length) return "";
  return "\n\nThings you already know about Prateek, from earlier conversations:\n" + rows.map((r) => `- ${r.content}`).join("\n");
}

async function proxyPlain(clientMessages) {
  if (!PROVIDERS.nova.configured()) {
    return plainText("Lumis AI's external API needs NOVA connected (AI_BASE_URL/AI_API_KEY/AI_MODEL_ID) first.");
  }
  const upstream = await PROVIDERS.nova.call([{ role: "system", content: SYSTEM_PROMPT }, ...clientMessages], { stream: true });
  if (!upstream || !upstream.ok || !upstream.body) {
    return plainText("Lumis AI's model provider returned an error.");
  }
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      for await (const json of iterateSSE(upstream.body)) {
        const delta = json.choices?.[0]?.delta?.content;
        if (delta) controller.enqueue(encoder.encode(delta));
      }
      controller.close();
    },
  });
  return new Response(stream, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}

function streamWithTools(baseMessages, clientMessages, conversationId, origin, provider, providerId) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      controller.enqueue(encoder.encode(`<<<MODEL>>>${providerId}<<<END_MODEL>>>`));

      let finalText = "";
      let sources = [];

      async function runPass(messages, allowTools) {
        const upstream = await provider.call(messages, { stream: true, tools: allowTools ? TOOLS : undefined });
        if (!upstream || !upstream.ok || !upstream.body) {
          const msg = `${provider.label} returned an error. Please try again.`;
          finalText += msg;
          controller.enqueue(encoder.encode(msg));
          return null;
        }

        let sawContent = false;
        const toolCalls = {};

        for await (const json of iterateSSE(upstream.body)) {
          const delta = json.choices?.[0]?.delta;
          if (!delta) continue;

          if (delta.content) {
            sawContent = true;
            finalText += delta.content;
            controller.enqueue(encoder.encode(delta.content));
          }

          if (delta.tool_calls) {
            for (const tc of delta.tool_calls) {
              const idx = tc.index ?? 0;
              if (!toolCalls[idx]) toolCalls[idx] = { id: "", name: "", arguments: "" };
              if (tc.id) toolCalls[idx].id = tc.id;
              if (tc.function?.name) toolCalls[idx].name += tc.function.name;
              if (tc.function?.arguments) toolCalls[idx].arguments += tc.function.arguments;
            }
          }
        }

        if (sawContent) return null;
        const calls = Object.values(toolCalls).filter((c) => c.name);
        return calls.length ? calls : null;
      }

      const calls = await runPass(baseMessages, true);

      if (calls) {
        const assistantToolMsg = {
          role: "assistant",
          content: null,
          tool_calls: calls.map((c, i) => ({
            id: c.id || `call_${i}_${Math.random().toString(36).slice(2)}`,
            type: "function",
            function: { name: c.name, arguments: c.arguments || "{}" },
          })),
        };

        const toolResultMessages = [];
        for (let i = 0; i < calls.length; i++) {
          const call = calls[i];
          let args = {};
          try {
            args = JSON.parse(call.arguments || "{}");
          } catch {
            args = {};
          }
          const result = await runTool(call.name, args, origin);
          if (call.name === "web_search" && Array.isArray(result.results)) {
            sources = sources.concat(result.results);
          }
          toolResultMessages.push({
            role: "tool",
            tool_call_id: assistantToolMsg.tool_calls[i].id,
            content: JSON.stringify(result),
          });
        }

        if (sources.length) {
          controller.enqueue(encoder.encode(`<<<SOURCES>>>${JSON.stringify(sources)}<<<END_SOURCES>>>`));
        }

        await runPass([...baseMessages, assistantToolMsg, ...toolResultMessages], false);
      }

      if (supabaseConfigured() && conversationId) {
        await persistConversation(conversationId, clientMessages, finalText).catch(() => {});
      }

      controller.close();
    },
  });

  return new Response(stream, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}

async function runTool(name, args, origin) {
  if (name === "web_search") {
    const { results } = await tavilySearch(args.query || "");
    return { results };
  }
  if (name === "save_memory") {
    if (!supabaseConfigured()) return { saved: false, note: "Memory isn't configured yet." };
    const res = await supabaseFetch("memories", {
      method: "POST",
      body: JSON.stringify({ type: "fact", content: String(args.content || "").slice(0, 1000) }),
    });
    return { saved: Boolean(res && res.ok) };
  }
  if (name === "forget_memory") {
    if (!supabaseConfigured()) return { forgotten: 0, note: "Memory isn't configured yet." };
    const pattern = encodeURIComponent(`*${String(args.query || "").slice(0, 200)}*`);
    const res = await supabaseFetch(`memories?content=ilike.${pattern}`, {
      method: "DELETE",
      prefer: "return=representation",
    });
    const rows = res && res.ok ? await res.json().catch(() => []) : [];
    return { forgotten: Array.isArray(rows) ? rows.length : 0 };
  }
  if (name === "send_email") {
    return sendEmailViaInternalApi(origin, { to: args.to, subject: args.subject, body: args.body });
  }
  return { error: "Unknown tool" };
}

async function persistConversation(conversationId, clientMessages, assistantText) {
  const lastUser = [...clientMessages].reverse().find((m) => m.role === "user");
  if (!lastUser) return;

  const existing = await supabaseFetch(`conversations?id=eq.${conversationId}&select=id`);
  const rows = existing && existing.ok ? await existing.json().catch(() => []) : [];

  if (!rows.length) {
    await supabaseFetch("conversations", {
      method: "POST",
      body: JSON.stringify({ id: conversationId, title: String(lastUser.content).slice(0, 60) }),
    });
  } else {
    await supabaseFetch(`conversations?id=eq.${conversationId}`, {
      method: "PATCH",
      body: JSON.stringify({ updated_at: new Date().toISOString() }),
    });
  }

  await supabaseFetch("messages", {
    method: "POST",
    body: JSON.stringify([
      { conversation_id: conversationId, role: "user", content: lastUser.content },
      { conversation_id: conversationId, role: "assistant", content: assistantText },
    ]),
  });
}
