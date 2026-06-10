import { useState, useEffect, useRef, useCallback } from "react";

/* ─────────────────────────────────────────────
   DESIGN TOKENS  (creamy palette)
───────────────────────────────────────────── */
const T = {
  cream: "#fdf8f0", cream2: "#faf3e8", cream3: "#f5ead6",
  gold: "#c9973a", goldLight: "#e8c06a", goldSoft: "#fdf3dc",
  rose: "#e8846a", roseLight: "#f0a896", roseSoft: "#fde8e2",
  teal: "#4a9b8e", tealLight: "#72b8ad", tealSoft: "#e0f2ef",
  ink: "#2a1f12", muted: "#8a7560",
  border: "rgba(201,151,58,0.18)",
  card: "rgba(253,248,240,0.95)",
  cardDark: "rgba(26,20,16,0.95)",
};

/* ─────────────────────────────────────────────
   GLOBAL STYLES  (injected once)
───────────────────────────────────────────── */
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=JetBrains+Mono:wght@400;500&display=swap');

  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Outfit',sans-serif;background:${T.cream};color:${T.ink};overflow:hidden}

  .aios-root{width:100%;height:100vh;display:flex;flex-direction:column;position:relative;overflow:hidden;background:${T.cream}}
  .aios-root.dark{background:#1a1410;color:#f5e8d0}
  .aios-root.dark .card-el{background:rgba(32,25,18,0.96)!important;border-color:rgba(201,151,58,0.12)!important}
  .aios-root.dark .sidebar-el{background:rgba(24,18,13,0.97)!important}
  .aios-root.dark .inp{background:rgba(40,30,20,0.8)!important;color:#f5e8d0!important}
  .aios-root.dark .muted-text{color:#a08060!important}
  .aios-root.dark .ink-text{color:#f5e8d0!important}

  /* blobs */
  .blob{position:absolute;border-radius:50%;filter:blur(80px);opacity:.32;pointer-events:none;animation:blobmove 12s ease-in-out infinite}
  .blob2{animation-duration:9s;animation-delay:-4s;animation-direction:reverse}
  .blob3{animation-duration:14s;animation-delay:-7s}
  @keyframes blobmove{0%,100%{transform:translate(0,0) scale(1)}33%{transform:translate(28px,-18px) scale(1.06)}66%{transform:translate(-18px,22px) scale(.94)}}

  /* scrollbar */
  ::-webkit-scrollbar{width:5px;height:5px}
  ::-webkit-scrollbar-track{background:transparent}
  ::-webkit-scrollbar-thumb{background:rgba(201,151,58,0.25);border-radius:99px}
  ::-webkit-scrollbar-thumb:hover{background:${T.gold}}

  /* animations */
  @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
  @keyframes fadeIn{from{opacity:0}to{opacity:1}}
  @keyframes spin{to{transform:rotate(360deg)}}
  @keyframes gradShift{0%,100%{background-position:0% 50%}50%{background-position:100% 50%}}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
  @keyframes msgIn{from{opacity:0;transform:translateY(8px) scale(.98)}to{opacity:1;transform:none}}
  @keyframes typing{0%,100%{opacity:.3}50%{opacity:1}}

  .fade-up{animation:fadeUp .45s ease both}
  .fade-in{animation:fadeIn .3s ease both}

  /* sidebar nav item */
  .nav-item{display:flex;align-items:center;gap:9px;padding:8px 10px;border-radius:10px;cursor:pointer;font-size:13.5px;font-weight:400;color:${T.muted};transition:all .15s;border:1px solid transparent;text-decoration:none;user-select:none}
  .nav-item:hover{background:rgba(201,151,58,0.07);color:${T.ink}}
  .nav-item.active{background:rgba(201,151,58,0.13);color:${T.gold};font-weight:600;border-color:rgba(201,151,58,0.18)}

  /* card hover */
  .hover-lift{transition:transform .2s,box-shadow .2s;cursor:pointer}
  .hover-lift:hover{transform:translateY(-2px);box-shadow:0 8px 32px rgba(201,151,58,0.14)!important}

  /* code */
  .code-block{background:${T.cream3};border:1px solid rgba(201,151,58,0.2);border-radius:12px;padding:14px 16px;font-family:'JetBrains Mono',monospace;font-size:12.5px;overflow-x:auto;line-height:1.6}
  .dark .code-block{background:rgba(40,30,20,0.8)!important}

  /* pill */
  .pill{display:inline-flex;align-items:center;gap:3px;padding:2px 9px;border-radius:99px;font-size:11px;font-weight:600;letter-spacing:.3px}

  /* input base */
  .inp{width:100%;background:rgba(253,248,240,0.8);border:1px solid ${T.border};border-radius:12px;padding:9px 13px;font-family:'Outfit',sans-serif;font-size:13.5px;color:${T.ink};outline:none;transition:border-color .2s,box-shadow .2s}
  .inp:focus{border-color:${T.gold};box-shadow:0 0 0 3px rgba(201,151,58,.12)}
  .inp::placeholder{color:${T.muted}}

  /* btn */
  .btn-ink{background:${T.ink};color:${T.goldLight};border:none;border-radius:11px;padding:9px 18px;font-family:'Outfit',sans-serif;font-size:13.5px;font-weight:600;cursor:pointer;transition:all .18s;display:inline-flex;align-items:center;gap:7px}
  .btn-ink:hover{transform:translateY(-1px);box-shadow:0 4px 16px rgba(42,31,18,.22)}
  .btn-ink:disabled{opacity:.5;cursor:not-allowed;transform:none}
  .btn-gold{background:linear-gradient(135deg,${T.gold},${T.goldLight});color:#fdf8f0;border:none;border-radius:11px;padding:9px 18px;font-family:'Outfit',sans-serif;font-size:13.5px;font-weight:600;cursor:pointer;transition:all .18s;display:inline-flex;align-items:center;gap:7px}
  .btn-gold:hover{transform:translateY(-1px);box-shadow:0 4px 20px rgba(201,151,58,.35)}
  .btn-ghost{background:transparent;color:${T.muted};border:1px solid ${T.border};border-radius:11px;padding:9px 18px;font-family:'Outfit',sans-serif;font-size:13.5px;font-weight:500;cursor:pointer;transition:all .18s;display:inline-flex;align-items:center;gap:7px}
  .btn-ghost:hover{background:${T.goldSoft};color:${T.ink};border-color:${T.gold}}

  /* message bubbles */
  .msg-user{background:${T.ink};color:${T.goldLight};border-radius:18px 4px 18px 18px;padding:11px 16px;font-size:14px;line-height:1.55;max-width:78%;animation:msgIn .25s ease both;align-self:flex-end}
  .msg-ai{background:${T.card};border:1px solid ${T.border};border-radius:4px 18px 18px 18px;padding:11px 16px;font-size:14px;line-height:1.65;max-width:84%;animation:msgIn .25s ease both;align-self:flex-start;box-shadow:0 2px 10px rgba(201,151,58,.06)}
  .dark .msg-ai{background:rgba(36,27,18,.95)!important}

  /* typing dots */
  .dot{width:6px;height:6px;border-radius:99px;background:${T.gold};animation:typing 1.2s ease infinite}
  .dot:nth-child(2){animation-delay:.2s}
  .dot:nth-child(3){animation-delay:.4s}

  /* gradient title */
  .grad-text{background:linear-gradient(135deg,${T.gold} 0%,${T.rose} 45%,${T.teal} 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;background-size:200%;animation:gradShift 5s ease infinite}

  /* skeleton */
  @keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
  .skeleton{background:linear-gradient(90deg,${T.cream2} 25%,${T.cream3} 50%,${T.cream2} 75%);background-size:200%;animation:shimmer 1.6s infinite;border-radius:8px}

  /* mobile */
  @media(max-width:768px){
    .sidebar-el{transform:translateX(-100%);transition:transform .28s ease;position:fixed!important;z-index:100!important;height:100vh}
    .sidebar-el.open{transform:translateX(0)}
    .main-panel{margin-left:0!important}
    .hide-mobile{display:none!important}
  }
`;

/* ─────────────────────────────────────────────
   ICONS (inline SVG — no external deps)
───────────────────────────────────────────── */
const Icon = ({ name, size = 16, color = "currentColor", style = {} }) => {
  const paths = {
    home: "M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z M9 22V12h6v10",
    chat: "M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z",
    code: "M16 18l6-6-6-6 M8 6l-6 6 6 6",
    search: "M11 17A6 6 0 1011 5a6 6 0 000 12z M21 21l-4.35-4.35",
    brain: "M9.5 2A2.5 2.5 0 017 4.5v0A2.5 2.5 0 014.5 7H4a2 2 0 00-2 2v2a2 2 0 002 2h.5A2.5 2.5 0 017 15.5v0A2.5 2.5 0 019.5 18H11v2a2 2 0 004 0v-2h1.5A2.5 2.5 0 0119 15.5v0A2.5 2.5 0 0121.5 13H22a2 2 0 000-4h-.5A2.5 2.5 0 0119 6.5v0A2.5 2.5 0 0116.5 4H15V2a2 2 0 00-4 0v2H9.5z",
    folder: "M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z",
    file: "M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8",
    db: "M12 2C6.48 2 2 4.02 2 6.5v11C2 19.98 6.48 22 12 22s10-2.02 10-4.5v-11C22 4.02 17.52 2 12 2zM12 4c4.42 0 8 1.57 8 3.5S16.42 11 12 11 4 9.43 4 7.5 7.58 4 12 4zm8 12.5c0 1.93-3.58 3.5-8 3.5s-8-1.57-8-3.5v-2c1.73 1.24 4.7 2 8 2s6.27-.76 8-2v2z",
    bot: "M12 2a2 2 0 012 2c0 .74-.4 1.38-1 1.73V7h3a3 3 0 013 3v8a3 3 0 01-3 3H8a3 3 0 01-3-3v-8a3 3 0 013-3h3V5.73A2 2 0 0110 4a2 2 0 012-2zM9 12a1.5 1.5 0 100 3 1.5 1.5 0 000-3zm6 0a1.5 1.5 0 100 3 1.5 1.5 0 000-3z",
    settings: "M12 15a3 3 0 100-6 3 3 0 000 6z M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z",
    logout: "M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4 M16 17l5-5-5-5 M21 12H9",
    sun: "M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42M12 5a7 7 0 100 14A7 7 0 0012 5z",
    moon: "M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z",
    plus: "M12 5v14M5 12h14",
    send: "M22 2L11 13 M22 2l-7 20-4-9-9-4 20-7z",
    upload: "M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4 M17 8l-5-5-5 5 M12 3v12",
    trash: "M3 6h18 M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6 M10 11v6 M14 11v6 M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2",
    copy: "M20 9h-9a2 2 0 00-2 2v9a2 2 0 002 2h9a2 2 0 002-2v-9a2 2 0 00-2-2z M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1",
    check: "M20 6L9 17l-5-5",
    x: "M18 6L6 18M6 6l12 12",
    menu: "M3 12h18M3 6h18M3 18h18",
    arrow: "M5 12h14M12 5l7 7-7 7",
    sparkle: "M12 3l1.68 5.17H20l-4.76 3.46L17.1 17 12 13.54 6.9 17l1.86-5.37L4 8.17h6.32z",
    shield: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
    note: "M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8",
    download: "M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4 M7 10l5 5 5-5 M12 15V3",
    refresh: "M23 4v6h-6 M1 20v-6h6 M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15",
    user: "M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2 M12 11a4 4 0 100-8 4 4 0 000 8z",
    zap: "M13 2L3 14h9l-1 8 10-12h-9l1-8z",
    book: "M4 19.5A2.5 2.5 0 016.5 17H20 M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z",
    key: "M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4",
    eye: "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z M12 12a3 3 0 100-6 3 3 0 000 6z",
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" style={style}>
      {(paths[name] || "").split(" M").map((d, i) => (
        <path key={i} d={i === 0 ? d : "M" + d} />
      ))}
    </svg>
  );
};

/* ─────────────────────────────────────────────
   BRAND CONFIG  (edit brand.json in real app)
───────────────────────────────────────────── */
const BRAND = {
  app_name: "My AI",
  tagline: "Your Personal AI Operating System",
  logo: null, // set to image URL to show logo
};

/* ─────────────────────────────────────────────
   AI CHAT  (calls Anthropic via Claude-in-Claude)
───────────────────────────────────────────── */
const AI_MODES = {
  general:   { label: "General",   emoji: "💬", prompt: "You are a helpful, warm personal AI assistant. Be concise and thoughtful." },
  coding:    { label: "Coding",    emoji: "💻", prompt: "You are an expert software engineer. Write clean, production-ready code with comments. Use markdown code blocks." },
  research:  { label: "Research",  emoji: "🔍", prompt: "You are a thorough research assistant. Synthesize information clearly with headers and key points." },
  study:     { label: "Study",     emoji: "📚", prompt: "You are a patient study tutor. Break down complex topics with analogies and clear examples." },
  project:   { label: "Project",   emoji: "🗂️", prompt: "You are a strategic project manager. Help plan, break down goals, and organize tasks clearly." },
  knowledge: { label: "Knowledge", emoji: "🧠", prompt: "You are a knowledge assistant. Reference the user's notes and documents when answering." },
};

async function callAI(messages, mode = "general", onChunk) {
  const systemPrompt = AI_MODES[mode]?.prompt || AI_MODES.general.prompt;
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        system: systemPrompt,
        messages: messages.filter(m => m.role !== "system").map(m => ({
          role: m.role, content: m.content
        })),
      }),
    });
    const data = await res.json();
    const text = data.content?.map(b => b.text || "").join("") || "I couldn't process that. Please check your API connection.";
    onChunk(text);
    return text;
  } catch {
    const err = "Unable to reach AI. In the deployed app, connect your API key in Settings.";
    onChunk(err);
    return err;
  }
}

/* ─────────────────────────────────────────────
   STORAGE  (in-memory for demo)
───────────────────────────────────────────── */
const useStore = () => {
  const [conversations, setConversations] = useState([
    { id: "1", title: "FastAPI JWT auth guide", mode: "coding", msgs: [
      { role: "user", content: "Build me a FastAPI endpoint with JWT auth" },
      { role: "assistant", content: "```python\nfrom fastapi import Depends, HTTPException\nfrom fastapi.security import HTTPBearer\nfrom jose import jwt\n\nbearer = HTTPBearer()\nSECRET = \"your-secret\"\n\n@router.get(\"/protected\")\nasync def protected(token=Depends(bearer)):\n    try:\n        payload = jwt.decode(token.credentials, SECRET, algorithms=[\"HS256\"])\n        return {\"user\": payload[\"sub\"]}\n    except:\n        raise HTTPException(401, \"Invalid token\")\n```\nThis endpoint verifies a JWT bearer token and returns the user from the payload." }
    ]},
    { id: "2", title: "Research: LLM overview", mode: "research", msgs: [] },
  ]);
  const [memories, setMemories] = useState([
    { id: "1", type: "INSTRUCTION", title: "Prefer TypeScript", content: "Always use TypeScript over JavaScript for new projects", tags: ["coding"], importance: 8 },
    { id: "2", type: "FACT", title: "Tech stack", content: "I use Next.js, FastAPI, PostgreSQL, and Redis", tags: ["stack"], importance: 7 },
    { id: "3", type: "NOTE", title: "Project goals", content: "Building a SaaS platform for freelancers — launch by Q3", tags: ["project"], importance: 6 },
  ]);
  const [knowledgeFiles, setKnowledgeFiles] = useState([
    { id: "1", name: "system-design-notes.md", type: "text/markdown", size: 12400, createdAt: new Date(Date.now()-86400000*2) },
    { id: "2", name: "api-docs.pdf", type: "application/pdf", size: 89000, createdAt: new Date(Date.now()-86400000*5) },
  ]);
  const [projects, setProjects] = useState([
    { id: "1", name: "Freelancer SaaS", status: "ACTIVE", type: "web", tasks: [
      { id: "t1", title: "Design auth flow", done: true },
      { id: "t2", title: "Build API endpoints", done: false },
      { id: "t3", title: "Write unit tests", done: false },
    ]},
    { id: "2", name: "Telegram Bot", status: "ACTIVE", type: "bot", tasks: [
      { id: "t4", title: "Set up grammy", done: true },
      { id: "t5", title: "Add AI responses", done: false },
    ]},
  ]);
  const [notes, setNotes] = useState([
    { id: "1", title: "Architecture decisions", content: "Using Next.js App Router with server actions for mutations. Prisma for ORM.", tags: ["coding","arch"], pinned: true },
    { id: "2", title: "Daily standup", content: "- Fixed auth bug\n- Started on file upload feature\n- Next: knowledge search", tags: ["work"], pinned: false },
  ]);
  return { conversations, setConversations, memories, setMemories, knowledgeFiles, setKnowledgeFiles, projects, setProjects, notes, setNotes };
};

/* ─────────────────────────────────────────────
   MARKDOWN RENDERER  (simple)
───────────────────────────────────────────── */
function renderMarkdown(text) {
  if (!text) return "";
  return text
    .replace(/```(\w*)\n?([\s\S]*?)```/g, (_, lang, code) =>
      `<pre class="code-block"><code>${code.replace(/</g,"&lt;").replace(/>/g,"&gt;")}</code></pre>`)
    .replace(/`([^`]+)`/g, `<code style="background:${T.cream3};border-radius:4px;padding:2px 6px;font-family:'JetBrains Mono',monospace;font-size:.875em">$1</code>`)
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/^### (.+)$/gm, `<h3 style="font-family:'Cormorant Garamond',serif;font-size:17px;margin:12px 0 6px;color:${T.ink}">$1</h3>`)
    .replace(/^## (.+)$/gm, `<h2 style="font-family:'Cormorant Garamond',serif;font-size:20px;margin:14px 0 6px;color:${T.ink}">$1</h2>`)
    .replace(/^- (.+)$/gm, `<div style="display:flex;gap:6px;margin:3px 0"><span style="color:${T.gold}">•</span><span>$1</span></div>`)
    .replace(/\n\n/g, "<br><br>")
    .replace(/\n/g, "<br>");
}

/* ─────────────────────────────────────────────
   COMPONENTS
───────────────────────────────────────────── */

/* Card */
const Card = ({ children, style = {}, className = "", onClick }) => (
  <div
    className={`card-el ${className}`}
    onClick={onClick}
    style={{
      background: T.card, border: `1px solid ${T.border}`, borderRadius: 22,
      boxShadow: "0 3px 16px rgba(201,151,58,.07)", ...style
    }}
  >
    {children}
  </div>
);

/* Tag pill */
const Pill = ({ label, color = "gold" }) => {
  const colors = {
    gold: { bg: T.goldSoft, c: T.gold },
    teal: { bg: T.tealSoft, c: T.teal },
    rose: { bg: T.roseSoft, c: T.rose },
    muted: { bg: T.cream3, c: T.muted },
  };
  const { bg, c } = colors[color] || colors.gold;
  return (
    <span className="pill" style={{ background: bg, color: c, border: `1px solid ${c}33` }}>
      {label}
    </span>
  );
};

/* Spinner */
const Spinner = ({ size = 16 }) => (
  <div style={{ width: size, height: size, border: `2px solid ${T.goldSoft}`, borderTop: `2px solid ${T.gold}`, borderRadius: "50%", animation: "spin .8s linear infinite" }} />
);

/* ── CHAT PANEL ── */
const ChatPanel = ({ conversations, setConversations, dark }) => {
  const [activeChatId, setActiveChatId] = useState(conversations[0]?.id || null);
  const [input, setInput] = useState("");
  const [mode, setMode] = useState("general");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(null);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  const activeChat = conversations.find(c => c.id === activeChatId);
  const msgs = activeChat?.msgs || [];

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, loading]);

  function newChat() {
    const id = Date.now().toString();
    setConversations(prev => [{ id, title: "New conversation", mode, msgs: [] }, ...prev]);
    setActiveChatId(id);
  }

  async function sendMessage() {
    if (!input.trim() || loading) return;
    const text = input.trim();
    setInput("");
    setLoading(true);

    const userMsg = { role: "user", content: text };
    setConversations(prev => prev.map(c =>
      c.id === activeChatId
        ? { ...c, title: c.msgs.length === 0 ? text.slice(0, 40) : c.title, msgs: [...c.msgs, userMsg] }
        : c
    ));

    const history = [...msgs, userMsg];
    await callAI(history, mode, (reply) => {
      const aiMsg = { role: "assistant", content: reply };
      setConversations(prev => prev.map(c =>
        c.id === activeChatId ? { ...c, msgs: [...c.msgs.filter(m => m !== userMsg), userMsg, aiMsg] } : c
      ));
    });
    setLoading(false);
    inputRef.current?.focus();
  }

  function copyMsg(content, id) {
    navigator.clipboard.writeText(content);
    setCopied(id);
    setTimeout(() => setCopied(null), 1500);
  }

  return (
    <div style={{ display: "flex", height: "100%", gap: 0 }}>
      {/* Conversation list */}
      <div style={{ width: 220, borderRight: `1px solid ${T.border}`, display: "flex", flexDirection: "column", flexShrink: 0 }} className="hide-mobile">
        <div style={{ padding: "16px 12px 10px" }}>
          <button className="btn-ink" onClick={newChat} style={{ width: "100%", justifyContent: "center", fontSize: 13 }}>
            <Icon name="plus" size={14} /> New Chat
          </button>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "0 8px 12px" }}>
          {conversations.map(c => (
            <div
              key={c.id}
              onClick={() => setActiveChatId(c.id)}
              style={{
                padding: "9px 10px", borderRadius: 10, cursor: "pointer", marginBottom: 3,
                background: c.id === activeChatId ? "rgba(201,151,58,.12)" : "transparent",
                border: `1px solid ${c.id === activeChatId ? T.border : "transparent"}`,
                transition: "all .15s"
              }}
            >
              <div style={{ fontSize: 12.5, fontWeight: c.id === activeChatId ? 600 : 400, color: c.id === activeChatId ? T.gold : T.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {c.title}
              </div>
              <div style={{ display: "flex", gap: 5, marginTop: 4, alignItems: "center" }}>
                <span style={{ fontSize: 10 }}>{AI_MODES[c.mode]?.emoji || "💬"}</span>
                <span style={{ fontSize: 10, color: T.muted }}>{c.msgs.length} msgs</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {/* Header */}
        <div style={{ padding: "12px 20px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 20 }}>{AI_MODES[mode]?.emoji}</span>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: T.ink }}>{activeChat?.title || "New Conversation"}</div>
              <div style={{ fontSize: 11, color: T.muted }}>Mode: {AI_MODES[mode]?.label}</div>
            </div>
          </div>
          {/* Mode switcher */}
          <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
            {Object.entries(AI_MODES).map(([k, v]) => (
              <button
                key={k}
                onClick={() => setMode(k)}
                style={{
                  background: mode === k ? T.ink : "transparent",
                  color: mode === k ? T.goldLight : T.muted,
                  border: `1px solid ${mode === k ? T.ink : T.border}`,
                  borderRadius: 8, padding: "4px 9px", fontSize: 11, fontWeight: 500, cursor: "pointer", transition: "all .15s"
                }}
              >
                {v.emoji} {v.label}
              </button>
            ))}
          </div>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
          {msgs.length === 0 && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 12, opacity: .6 }}>
              <span style={{ fontSize: 40 }}>{AI_MODES[mode]?.emoji}</span>
              <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 22, color: T.ink }}>Start a {AI_MODES[mode]?.label} conversation</div>
              <div style={{ fontSize: 13, color: T.muted, textAlign: "center", maxWidth: 320 }}>
                {mode === "coding" && "Ask me to write, debug, or explain code"}
                {mode === "research" && "Give me a topic to research deeply"}
                {mode === "study" && "Tell me what you're learning"}
                {mode === "project" && "Describe your project goals"}
                {mode === "knowledge" && "Ask about your uploaded documents"}
                {mode === "general" && "Ask me anything"}
              </div>
            </div>
          )}
          {msgs.map((m, i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: m.role === "user" ? "flex-end" : "flex-start" }}>
              <div
                className={m.role === "user" ? "msg-user" : "msg-ai"}
                dangerouslySetInnerHTML={m.role === "assistant" ? { __html: renderMarkdown(m.content) } : undefined}
              >
                {m.role === "user" ? m.content : undefined}
              </div>
              {m.role === "assistant" && (
                <button
                  onClick={() => copyMsg(m.content, i)}
                  style={{ background: "none", border: "none", cursor: "pointer", color: T.muted, display: "flex", alignItems: "center", gap: 4, fontSize: 11, padding: "2px 4px" }}
                >
                  <Icon name={copied === i ? "check" : "copy"} size={11} color={copied === i ? T.teal : T.muted} />
                  {copied === i ? "Copied" : "Copy"}
                </button>
              )}
            </div>
          ))}
          {loading && (
            <div className="msg-ai" style={{ display: "flex", alignItems: "center", gap: 6, padding: "12px 16px" }}>
              <div className="dot" /><div className="dot" /><div className="dot" />
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div style={{ padding: "14px 20px", borderTop: `1px solid ${T.border}`, flexShrink: 0 }}>
          <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
            <textarea
              ref={inputRef}
              className="inp"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              placeholder={`Message ${BRAND.app_name} (${AI_MODES[mode]?.label} mode) — Enter to send`}
              rows={1}
              style={{ resize: "none", flex: 1, minHeight: 42, maxHeight: 160, overflowY: "auto", borderRadius: 14, lineHeight: 1.5 }}
              onInput={e => { e.target.style.height = "auto"; e.target.style.height = e.target.scrollHeight + "px"; }}
            />
            <button className="btn-ink" onClick={sendMessage} disabled={loading || !input.trim()} style={{ padding: "10px 14px", borderRadius: 12, flexShrink: 0 }}>
              {loading ? <Spinner size={15} /> : <Icon name="send" size={15} />}
            </button>
          </div>
          <div style={{ fontSize: 11, color: T.muted, marginTop: 6, textAlign: "center" }}>
            Shift+Enter for new line · Powered by {BRAND.app_name}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ── MEMORY PANEL ── */
const MemoryPanel = ({ memories, setMemories }) => {
  const [form, setForm] = useState({ type: "NOTE", title: "", content: "", tags: "" });
  const [search, setSearch] = useState("");
  const [adding, setAdding] = useState(false);

  const TYPES = ["NOTE", "INSTRUCTION", "FACT", "PREFERENCE", "SUMMARY", "PROJECT"];
  const typeColor = { NOTE: "gold", INSTRUCTION: "teal", FACT: "rose", PREFERENCE: "gold", SUMMARY: "muted", PROJECT: "teal" };

  function addMemory() {
    if (!form.title.trim()) return;
    setMemories(prev => [{ id: Date.now().toString(), ...form, tags: form.tags.split(",").map(t=>t.trim()).filter(Boolean), importance: 5, createdAt: new Date() }, ...prev]);
    setForm({ type: "NOTE", title: "", content: "", tags: "" });
    setAdding(false);
  }

  const filtered = memories.filter(m =>
    !search || m.title.toLowerCase().includes(search.toLowerCase()) || m.content.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ padding: 24, height: "100%", overflowY: "auto" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 26, fontWeight: 500, color: T.ink }}>Memory</h2>
          <p style={{ fontSize: 13, color: T.muted }}>{memories.length} items stored · persists across sessions</p>
        </div>
        <button className="btn-ink" onClick={() => setAdding(!adding)}><Icon name="plus" size={14} /> Add Memory</button>
      </div>

      {/* Add form */}
      {adding && (
        <Card style={{ padding: 20, marginBottom: 20 }} className="fade-up">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: T.muted, display: "block", marginBottom: 5 }}>TYPE</label>
              <select className="inp" value={form.type} onChange={e => setForm({...form, type: e.target.value})} style={{ cursor: "pointer" }}>
                {TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: T.muted, display: "block", marginBottom: 5 }}>TAGS (comma separated)</label>
              <input className="inp" value={form.tags} onChange={e => setForm({...form, tags: e.target.value})} placeholder="coding, project, idea" />
            </div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: T.muted, display: "block", marginBottom: 5 }}>TITLE</label>
            <input className="inp" value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="Memory title..." />
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: T.muted, display: "block", marginBottom: 5 }}>CONTENT</label>
            <textarea className="inp" rows={3} value={form.content} onChange={e => setForm({...form, content: e.target.value})} placeholder="What should I remember?" style={{ resize: "vertical" }} />
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button className="btn-ink" onClick={addMemory}>Save Memory</button>
            <button className="btn-ghost" onClick={() => setAdding(false)}>Cancel</button>
          </div>
        </Card>
      )}

      {/* Search */}
      <div style={{ position: "relative", marginBottom: 18 }}>
        <Icon name="search" size={14} color={T.muted} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
        <input className="inp" style={{ paddingLeft: 34 }} value={search} onChange={e => setSearch(e.target.value)} placeholder="Search memories..." />
      </div>

      {/* List */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 14 }}>
        {filtered.map((m, i) => (
          <Card key={m.id} className="hover-lift fade-up" style={{ padding: 18, animationDelay: `${i*0.04}s` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
              <Pill label={m.type} color={typeColor[m.type] || "muted"} />
              <button onClick={() => setMemories(prev => prev.filter(x => x.id !== m.id))} style={{ background: "none", border: "none", cursor: "pointer", color: T.muted }}>
                <Icon name="trash" size={13} />
              </button>
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: T.ink, marginBottom: 6 }}>{m.title}</div>
            <div style={{ fontSize: 12.5, color: T.muted, lineHeight: 1.5, marginBottom: 10, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{m.content}</div>
            <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
              {m.tags.map(t => <span key={t} style={{ background: T.cream3, color: T.muted, borderRadius: 6, fontSize: 10, padding: "2px 7px", fontWeight: 500 }}>{t}</span>)}
            </div>
          </Card>
        ))}
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign: "center", color: T.muted, padding: 40 }}>
          <Icon name="brain" size={32} color={T.border} style={{ margin: "0 auto 10px", display: "block" }} />
          {search ? "No matching memories" : "No memories yet — add your first one"}
        </div>
      )}
    </div>
  );
};

/* ── KNOWLEDGE PANEL ── */
const KnowledgePanel = ({ knowledgeFiles, setKnowledgeFiles }) => {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);

  function handleFiles(files) {
    const newFiles = Array.from(files).map(f => ({
      id: Date.now().toString() + Math.random(),
      name: f.name, type: f.type, size: f.size, createdAt: new Date()
    }));
    setKnowledgeFiles(prev => [...newFiles, ...prev]);
  }

  const fmtSize = b => b > 1e6 ? `${(b/1e6).toFixed(1)} MB` : `${(b/1e3).toFixed(0)} KB`;
  const fmtDate = d => new Date(d).toLocaleDateString("en", { month: "short", day: "numeric" });
  const fileIcon = t => t.includes("pdf") ? "📄" : t.includes("image") ? "🖼️" : t.includes("csv") || t.includes("sheet") ? "📊" : t.includes("word") ? "📝" : "📋";

  return (
    <div style={{ padding: 24, height: "100%", overflowY: "auto" }}>
      <div style={{ marginBottom: 22 }}>
        <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 26, fontWeight: 500, color: T.ink }}>Knowledge Base</h2>
        <p style={{ fontSize: 13, color: T.muted }}>Upload docs · AI searches before answering · PDF, DOCX, TXT, CSV, MD</p>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
        onClick={() => inputRef.current?.click()}
        style={{
          border: `2px dashed ${dragging ? T.gold : T.border}`,
          borderRadius: 20, padding: 36, textAlign: "center", cursor: "pointer", marginBottom: 22,
          background: dragging ? T.goldSoft : "transparent",
          transition: "all .2s"
        }}
      >
        <input ref={inputRef} type="file" multiple accept=".pdf,.txt,.md,.docx,.csv,.zip" style={{ display: "none" }} onChange={e => handleFiles(e.target.files)} />
        <Icon name="upload" size={28} color={dragging ? T.gold : T.muted} style={{ margin: "0 auto 10px", display: "block" }} />
        <div style={{ fontSize: 15, fontWeight: 600, color: dragging ? T.gold : T.ink, marginBottom: 4 }}>
          {dragging ? "Drop to upload" : "Drop files or click to browse"}
        </div>
        <div style={{ fontSize: 12, color: T.muted }}>PDF · TXT · DOCX · CSV · MD · ZIP — up to 50MB each</div>
      </div>

      {/* Files list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {knowledgeFiles.map((f, i) => (
          <Card key={f.id} className="hover-lift fade-up" style={{ padding: "14px 18px", animationDelay: `${i*0.05}s` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ fontSize: 28, flexShrink: 0 }}>{fileIcon(f.type)}</div>
              <div style={{ flex: 1, overflow: "hidden" }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: T.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.name}</div>
                <div style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>{fmtSize(f.size)} · {fmtDate(f.createdAt)}</div>
              </div>
              <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                <span className="pill" style={{ background: T.tealSoft, color: T.teal, border: `1px solid ${T.teal}33` }}>Indexed</span>
                <button onClick={() => setKnowledgeFiles(prev => prev.filter(x => x.id !== f.id))} style={{ background: "none", border: "none", cursor: "pointer", color: T.muted }}>
                  <Icon name="trash" size={14} />
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {knowledgeFiles.length === 0 && (
        <div style={{ textAlign: "center", color: T.muted, padding: 40 }}>
          <Icon name="db" size={32} color={T.border} style={{ margin: "0 auto 10px", display: "block" }} />
          No documents yet — upload your first one above
        </div>
      )}
    </div>
  );
};

/* ── PROJECTS PANEL ── */
const ProjectsPanel = ({ projects, setProjects }) => {
  const [activeProj, setActiveProj] = useState(projects[0]?.id || null);
  const [newTask, setNewTask] = useState("");
  const [addingProj, setAddingProj] = useState(false);
  const [newProjName, setNewProjName] = useState("");

  const proj = projects.find(p => p.id === activeProj);
  const statusColor = { ACTIVE: "teal", PAUSED: "gold", COMPLETED: "rose", ARCHIVED: "muted" };
  const done = proj?.tasks.filter(t => t.done).length || 0;
  const total = proj?.tasks.length || 0;
  const pct = total ? Math.round(done / total * 100) : 0;

  function addTask() {
    if (!newTask.trim() || !activeProj) return;
    setProjects(prev => prev.map(p => p.id === activeProj ? { ...p, tasks: [...p.tasks, { id: Date.now().toString(), title: newTask.trim(), done: false }] } : p));
    setNewTask("");
  }

  function toggleTask(taskId) {
    setProjects(prev => prev.map(p => p.id === activeProj ? { ...p, tasks: p.tasks.map(t => t.id === taskId ? { ...t, done: !t.done } : t) } : p));
  }

  function addProject() {
    if (!newProjName.trim()) return;
    const id = Date.now().toString();
    setProjects(prev => [...prev, { id, name: newProjName.trim(), status: "ACTIVE", type: "general", tasks: [] }]);
    setActiveProj(id);
    setNewProjName("");
    setAddingProj(false);
  }

  return (
    <div style={{ display: "flex", height: "100%", gap: 0 }}>
      {/* Project list */}
      <div style={{ width: 220, borderRight: `1px solid ${T.border}`, display: "flex", flexDirection: "column", flexShrink: 0 }} className="hide-mobile">
        <div style={{ padding: "16px 12px 10px" }}>
          <button className="btn-ink" onClick={() => setAddingProj(true)} style={{ width: "100%", justifyContent: "center", fontSize: 13 }}>
            <Icon name="plus" size={14} /> New Project
          </button>
        </div>
        {addingProj && (
          <div style={{ padding: "0 12px 12px" }}>
            <input className="inp" style={{ marginBottom: 8, fontSize: 13 }} value={newProjName} onChange={e => setNewProjName(e.target.value)} placeholder="Project name..." onKeyDown={e => e.key === "Enter" && addProject()} autoFocus />
            <div style={{ display: "flex", gap: 6 }}>
              <button className="btn-ink" onClick={addProject} style={{ flex: 1, justifyContent: "center", fontSize: 12, padding: "7px" }}>Add</button>
              <button className="btn-ghost" onClick={() => setAddingProj(false)} style={{ fontSize: 12, padding: "7px 10px" }}>✕</button>
            </div>
          </div>
        )}
        <div style={{ flex: 1, overflowY: "auto", padding: "0 8px 12px" }}>
          {projects.map(p => (
            <div key={p.id} onClick={() => setActiveProj(p.id)} style={{
              padding: "10px 10px", borderRadius: 10, cursor: "pointer", marginBottom: 4,
              background: p.id === activeProj ? "rgba(201,151,58,.12)" : "transparent",
              border: `1px solid ${p.id === activeProj ? T.border : "transparent"}`,
              transition: "all .15s"
            }}>
              <div style={{ fontSize: 13, fontWeight: p.id === activeProj ? 600 : 400, color: p.id === activeProj ? T.gold : T.ink, marginBottom: 4 }}>{p.name}</div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Pill label={p.status} color={statusColor[p.status]} />
                <span style={{ fontSize: 10.5, color: T.muted }}>{p.tasks.filter(t=>t.done).length}/{p.tasks.length}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Project detail */}
      <div style={{ flex: 1, padding: 24, overflowY: "auto" }}>
        {proj ? (
          <>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <div>
                <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 26, color: T.ink, marginBottom: 4 }}>{proj.name}</h2>
                <div style={{ display: "flex", gap: 8 }}>
                  <Pill label={proj.status} color={statusColor[proj.status]} />
                  <span style={{ fontSize: 12, color: T.muted }}>Type: {proj.type}</span>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 24, fontWeight: 700, color: T.ink }}>{pct}%</div>
                <div style={{ fontSize: 11, color: T.muted }}>{done}/{total} done</div>
              </div>
            </div>

            {/* Progress bar */}
            <div style={{ background: T.cream3, borderRadius: 99, height: 6, marginBottom: 24, overflow: "hidden" }}>
              <div style={{ background: `linear-gradient(90deg,${T.gold},${T.goldLight})`, height: "100%", width: `${pct}%`, borderRadius: 99, transition: "width .4s ease" }} />
            </div>

            {/* Add task */}
            <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
              <input className="inp" style={{ flex: 1 }} value={newTask} onChange={e => setNewTask(e.target.value)} placeholder="Add a task..." onKeyDown={e => e.key === "Enter" && addTask()} />
              <button className="btn-ink" onClick={addTask}><Icon name="plus" size={14} /></button>
            </div>

            {/* Tasks */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {proj.tasks.map(t => (
                <div key={t.id} onClick={() => toggleTask(t.id)}
                  style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, cursor: "pointer", transition: "all .15s" }}
                >
                  <div style={{ width: 20, height: 20, borderRadius: 6, border: `2px solid ${t.done ? T.teal : T.border}`, background: t.done ? T.tealSoft : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all .15s" }}>
                    {t.done && <Icon name="check" size={11} color={T.teal} />}
                  </div>
                  <span style={{ fontSize: 14, color: t.done ? T.muted : T.ink, textDecoration: t.done ? "line-through" : "none", transition: "all .15s" }}>{t.title}</span>
                </div>
              ))}
              {proj.tasks.length === 0 && (
                <div style={{ textAlign: "center", color: T.muted, padding: 30, fontSize: 13 }}>No tasks yet — add your first one above</div>
              )}
            </div>
          </>
        ) : (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", flexDirection: "column", gap: 10, opacity: .6 }}>
            <Icon name="folder" size={36} color={T.border} />
            <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 20, color: T.ink }}>Select or create a project</div>
          </div>
        )}
      </div>
    </div>
  );
};

/* ── NOTES PANEL ── */
const NotesPanel = ({ notes, setNotes }) => {
  const [active, setActive] = useState(notes[0]?.id || null);
  const [editing, setEditing] = useState(false);

  const note = notes.find(n => n.id === active);

  function newNote() {
    const id = Date.now().toString();
    setNotes(prev => [{ id, title: "Untitled note", content: "", tags: [], pinned: false, createdAt: new Date() }, ...prev]);
    setActive(id);
    setEditing(true);
  }

  function update(field, val) {
    setNotes(prev => prev.map(n => n.id === active ? { ...n, [field]: val } : n));
  }

  return (
    <div style={{ display: "flex", height: "100%", gap: 0 }}>
      {/* Note list */}
      <div style={{ width: 230, borderRight: `1px solid ${T.border}`, display: "flex", flexDirection: "column", flexShrink: 0 }} className="hide-mobile">
        <div style={{ padding: "16px 12px 10px" }}>
          <button className="btn-ink" onClick={newNote} style={{ width: "100%", justifyContent: "center", fontSize: 13 }}>
            <Icon name="plus" size={14} /> New Note
          </button>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "0 8px 12px" }}>
          {[...notes].sort((a,b) => b.pinned - a.pinned).map(n => (
            <div key={n.id} onClick={() => { setActive(n.id); setEditing(false); }} style={{
              padding: "10px 10px", borderRadius: 10, cursor: "pointer", marginBottom: 4,
              background: n.id === active ? "rgba(201,151,58,.12)" : "transparent",
              border: `1px solid ${n.id === active ? T.border : "transparent"}`,
              transition: "all .15s"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 3 }}>
                {n.pinned && <Icon name="sparkle" size={10} color={T.gold} />}
                <div style={{ fontSize: 13, fontWeight: n.id === active ? 600 : 400, color: n.id === active ? T.gold : T.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{n.title}</div>
              </div>
              <div style={{ fontSize: 11, color: T.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{n.content.slice(0, 50) || "Empty note"}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Editor */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {note ? (
          <>
            <div style={{ padding: "14px 24px", borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
              <input
                value={note.title}
                onChange={e => update("title", e.target.value)}
                style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 22, fontWeight: 500, color: T.ink, border: "none", background: "transparent", outline: "none", flex: 1 }}
              />
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => update("pinned", !note.pinned)} style={{ background: note.pinned ? T.goldSoft : "transparent", border: `1px solid ${note.pinned ? T.gold : T.border}`, borderRadius: 9, padding: "6px 10px", cursor: "pointer", fontSize: 12, color: note.pinned ? T.gold : T.muted }}>
                  {note.pinned ? "★ Pinned" : "☆ Pin"}
                </button>
                <button onClick={() => setEditing(!editing)} className={editing ? "btn-ink" : "btn-ghost"} style={{ fontSize: 12, padding: "6px 12px" }}>
                  {editing ? "Preview" : "Edit"}
                </button>
                <button onClick={() => { setNotes(prev => prev.filter(n => n.id !== active)); setActive(notes[1]?.id || null); }} style={{ background: "none", border: "none", cursor: "pointer", color: T.muted }}>
                  <Icon name="trash" size={15} />
                </button>
              </div>
            </div>
            <div style={{ flex: 1, overflow: "hidden" }}>
              {editing ? (
                <textarea
                  value={note.content}
                  onChange={e => update("content", e.target.value)}
                  style={{ width: "100%", height: "100%", padding: "20px 28px", fontFamily: "'Outfit',sans-serif", fontSize: 14, color: T.ink, background: "transparent", border: "none", outline: "none", resize: "none", lineHeight: 1.7 }}
                  placeholder="Write in markdown..."
                />
              ) : (
                <div
                  style={{ padding: "20px 28px", height: "100%", overflowY: "auto", fontSize: 14, lineHeight: 1.7, color: T.ink }}
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(note.content) || `<span style="color:${T.muted}">Nothing written yet — click Edit to start</span>` }}
                />
              )}
            </div>
          </>
        ) : (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", flexDirection: "column", gap: 10, opacity: .6 }}>
            <Icon name="note" size={36} color={T.border} />
            <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 20, color: T.ink }}>Select or create a note</div>
          </div>
        )}
      </div>
    </div>
  );
};

/* ── SETTINGS PANEL ── */
const SettingsPanel = ({ dark, setDark }) => {
  const [saved, setSaved] = useState(false);
  const [config, setConfig] = useState({
    provider: "openai", model: "gpt-4o",
    openaiKey: "", anthropicKey: "", googleKey: "",
    telegramToken: "", telegramChatId: "",
    appName: BRAND.app_name, tagline: BRAND.tagline,
  });

  function save() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const Section = ({ title, children }) => (
    <Card style={{ padding: 22, marginBottom: 18 }}>
      <h3 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 18, fontWeight: 500, color: T.ink, marginBottom: 16 }}>{title}</h3>
      {children}
    </Card>
  );

  const Field = ({ label, hint, children }) => (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: T.muted, marginBottom: 5, letterSpacing: ".4px" }}>{label}</label>
      {children}
      {hint && <div style={{ fontSize: 11, color: T.muted, marginTop: 4 }}>{hint}</div>}
    </div>
  );

  return (
    <div style={{ padding: 24, maxWidth: 680, height: "100%", overflowY: "auto" }}>
      <div style={{ marginBottom: 22 }}>
        <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 26, fontWeight: 500, color: T.ink }}>Settings</h2>
        <p style={{ fontSize: 13, color: T.muted }}>Configure your AI, appearance, and integrations</p>
      </div>

      <Section title="🎨 Appearance">
        <Field label="THEME">
          <div style={{ display: "flex", gap: 10 }}>
            {["light", "dark"].map(t => (
              <button key={t} onClick={() => setDark(t === "dark")}
                style={{ flex: 1, padding: "10px", borderRadius: 11, border: `1.5px solid ${(dark ? "dark" : "light") === t ? T.gold : T.border}`, background: (dark ? "dark" : "light") === t ? T.goldSoft : "transparent", color: (dark ? "dark" : "light") === t ? T.gold : T.muted, cursor: "pointer", fontWeight: 600, fontSize: 13 }}>
                {t === "light" ? "☀️ Light" : "🌙 Dark"}
              </button>
            ))}
          </div>
        </Field>
        <Field label="APP NAME" hint="Updates all UI — replaces brand.json in real deployment">
          <input className="inp" value={config.appName} onChange={e => setConfig({...config, appName: e.target.value})} />
        </Field>
      </Section>

      <Section title="🤖 AI Provider">
        <Field label="PROVIDER">
          <select className="inp" style={{ cursor: "pointer" }} value={config.provider} onChange={e => setConfig({...config, provider: e.target.value})}>
            <option value="openai">OpenAI (GPT-4o)</option>
            <option value="anthropic">Anthropic (Claude)</option>
            <option value="google">Google (Gemini)</option>
            <option value="ollama">Ollama (Local)</option>
          </select>
        </Field>
        {config.provider === "openai" && (
          <Field label="OPENAI API KEY" hint="sk-... — stored securely as env variable">
            <input className="inp" type="password" value={config.openaiKey} onChange={e => setConfig({...config, openaiKey: e.target.value})} placeholder="sk-..." />
          </Field>
        )}
        {config.provider === "anthropic" && (
          <Field label="ANTHROPIC API KEY" hint="sk-ant-... — used for Claude models">
            <input className="inp" type="password" value={config.anthropicKey} onChange={e => setConfig({...config, anthropicKey: e.target.value})} placeholder="sk-ant-..." />
          </Field>
        )}
        {config.provider === "google" && (
          <Field label="GOOGLE API KEY">
            <input className="inp" type="password" value={config.googleKey} onChange={e => setConfig({...config, googleKey: e.target.value})} placeholder="AIza..." />
          </Field>
        )}
        {config.provider === "ollama" && (
          <Field label="OLLAMA URL" hint="Default: http://localhost:11434">
            <input className="inp" value="http://localhost:11434" readOnly />
          </Field>
        )}
      </Section>

      <Section title="📱 Telegram Integration">
        <Field label="BOT TOKEN" hint="From @BotFather — enables Telegram access to your AI">
          <input className="inp" type="password" value={config.telegramToken} onChange={e => setConfig({...config, telegramToken: e.target.value})} placeholder="1234567890:ABC..." />
        </Field>
        <Field label="ALLOWED CHAT ID" hint="Your Telegram user ID — only this account can use the bot">
          <input className="inp" value={config.telegramChatId} onChange={e => setConfig({...config, telegramChatId: e.target.value})} placeholder="123456789" />
        </Field>
        <div style={{ background: T.tealSoft, border: `1px solid ${T.teal}33`, borderRadius: 12, padding: "12px 14px", fontSize: 12.5, color: T.teal, lineHeight: 1.6 }}>
          <strong>Setup:</strong> Message @BotFather → /newbot → copy token above → add TELEGRAM_BOT_TOKEN to Vercel env vars → deploy. The bot and web app share the same AI brain.
        </div>
      </Section>

      <Section title="🗄️ Database">
        <Field label="DATABASE URL" hint="PostgreSQL connection string. Leave empty to use JSON fallback (dev mode)">
          <input className="inp" type="password" placeholder="postgresql://user:pass@host:5432/dbname" />
        </Field>
        <div style={{ background: T.goldSoft, border: `1px solid ${T.gold}33`, borderRadius: 12, padding: "12px 14px", fontSize: 12.5, color: T.muted, lineHeight: 1.6 }}>
          <strong style={{ color: T.gold }}>Current mode:</strong> JSON storage (no DATABASE_URL set). Great for development. Switch to PostgreSQL for production.
        </div>
      </Section>

      <button className="btn-ink" onClick={save} style={{ padding: "11px 28px" }}>
        {saved ? <><Icon name="check" size={14} color={T.tealLight} /> Saved!</> : "Save Settings"}
      </button>
    </div>
  );
};

/* ── ADMIN PANEL ── */
const AdminPanel = () => {
  const stats = [
    { label: "Total Users", value: "1", sub: "Owner + 0 users" },
    { label: "Conversations", value: "12", sub: "Last 30 days" },
    { label: "Memories", value: "48", sub: "Across all users" },
    { label: "Storage Used", value: "2.1 MB", sub: "JSON mode" },
  ];
  const logs = [
    { time: "2m ago", level: "info", msg: "User login: owner@myai.com" },
    { time: "14m ago", level: "info", msg: "AI query: coding mode, 320 tokens" },
    { time: "1h ago", level: "warn", msg: "Telegram: bot token not configured" },
    { time: "3h ago", level: "info", msg: "File uploaded: system-design-notes.md" },
    { time: "1d ago", level: "info", msg: "Memory created: Tech stack preferences" },
  ];
  const levelColor = { info: T.teal, warn: T.gold, error: T.rose };

  return (
    <div style={{ padding: 24, height: "100%", overflowY: "auto" }}>
      <div style={{ marginBottom: 22 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 26, fontWeight: 500, color: T.ink }}>Admin Panel</h2>
          <Pill label="OWNER" color="gold" />
        </div>
        <p style={{ fontSize: 13, color: T.muted }}>System overview · manage users, logs, and configuration</p>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 14, marginBottom: 24 }}>
        {stats.map(s => (
          <Card key={s.label} style={{ padding: 18 }}>
            <div style={{ fontSize: 26, fontWeight: 700, color: T.ink, lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: 13, color: T.muted, marginTop: 4 }}>{s.label}</div>
            <div style={{ fontSize: 11, color: T.teal, marginTop: 3 }}>{s.sub}</div>
          </Card>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
        {/* System Status */}
        <Card style={{ padding: 20 }}>
          <h3 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 18, color: T.ink, marginBottom: 14 }}>System Status</h3>
          {[
            { label: "AI Provider", status: "OpenAI (demo)", ok: true },
            { label: "Database", status: "JSON Mode", ok: true },
            { label: "Telegram Bot", status: "Not configured", ok: false },
            { label: "Email (Gmail)", status: "Not configured", ok: false },
            { label: "Knowledge Search", status: "Active", ok: true },
            { label: "Memory System", status: "Active", ok: true },
          ].map(item => (
            <div key={item.label} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: `1px solid ${T.border}`, fontSize: 13 }}>
              <span style={{ color: T.muted }}>{item.label}</span>
              <span style={{ color: item.ok ? T.teal : T.rose, fontWeight: 600, fontSize: 12 }}>
                {item.ok ? "● " : "○ "}{item.status}
              </span>
            </div>
          ))}
        </Card>

        {/* Logs */}
        <Card style={{ padding: 20 }}>
          <h3 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 18, color: T.ink, marginBottom: 14 }}>Recent Logs</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {logs.map((log, i) => (
              <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: 12.5 }}>
                <span style={{ color: levelColor[log.level] || T.muted, fontWeight: 700, flexShrink: 0, width: 36 }}>{log.level.toUpperCase()}</span>
                <span style={{ color: T.ink, flex: 1, lineHeight: 1.4 }}>{log.msg}</span>
                <span style={{ color: T.muted, flexShrink: 0 }}>{log.time}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Users */}
        <Card style={{ padding: 20, gridColumn: "span 2" }}>
          <h3 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 18, color: T.ink, marginBottom: 14 }}>Users</h3>
          <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 16px", background: T.cream2, borderRadius: 14 }}>
            <div style={{ width: 38, height: 38, borderRadius: 99, background: `linear-gradient(135deg,${T.gold},${T.rose})`, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700 }}>O</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: T.ink }}>Owner Account</div>
              <div style={{ fontSize: 12, color: T.muted }}>owner@myai.com · All permissions</div>
            </div>
            <Pill label="OWNER" color="gold" />
          </div>
          <div style={{ marginTop: 12, fontSize: 12, color: T.muted, padding: "10px 16px", background: T.tealSoft, borderRadius: 10 }}>
            💡 Multi-user support: add DATABASE_URL and enable user registration in settings. Each user gets their own workspaces and memory.
          </div>
        </Card>
      </div>
    </div>
  );
};

/* ── OVERVIEW PANEL ── */
const OverviewPanel = ({ brand, conversations, memories, knowledgeFiles, projects, setView }) => {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const quickStart = [
    { icon: "chat", label: "New Chat", desc: "Start talking", view: "chat", color: T.gold, bg: T.goldSoft },
    { icon: "code", label: "Write Code", desc: "Generate & debug", view: "chat", color: T.teal, bg: T.tealSoft },
    { icon: "search", label: "Research", desc: "Explore topics", view: "chat", color: T.rose, bg: T.roseSoft },
    { icon: "db", label: "Upload Doc", desc: "Add knowledge", view: "knowledge", color: T.gold, bg: T.goldSoft },
    { icon: "folder", label: "Projects", desc: "Track tasks", view: "projects", color: T.teal, bg: T.tealSoft },
    { icon: "brain", label: "Memory", desc: "View stored facts", view: "memory", color: T.rose, bg: T.roseSoft },
  ];

  return (
    <div style={{ padding: 28, height: "100%", overflowY: "auto" }}>
      {/* Greeting */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 32, fontWeight: 400, color: T.ink, marginBottom: 4 }}>
          {greeting} 👋
        </h1>
        <p style={{ fontSize: 14, color: T.muted }}>{brand.app_name} is ready. What are we working on today?</p>
      </div>

      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 28 }}>
        {[
          { label: "Chats", val: conversations.length, icon: "chat", color: T.gold },
          { label: "Memories", val: memories.length, icon: "brain", color: T.rose },
          { label: "Documents", val: knowledgeFiles.length, icon: "db", color: T.teal },
          { label: "Projects", val: projects.length, icon: "folder", color: T.gold },
        ].map(s => (
          <Card key={s.label} style={{ padding: "16px 18px" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: 26, fontWeight: 700, color: T.ink, lineHeight: 1 }}>{s.val}</div>
                <div style={{ fontSize: 12, color: T.muted, marginTop: 3 }}>{s.label}</div>
              </div>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: T.goldSoft, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon name={s.icon} size={15} color={s.color} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Quick start */}
      <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 20, color: T.ink, marginBottom: 14 }}>Quick Start</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: 12, marginBottom: 28 }}>
        {quickStart.map((a, i) => (
          <div key={a.label} className="hover-lift fade-up" onClick={() => setView(a.view)}
            style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 18, padding: "18px 16px", cursor: "pointer", animationDelay: `${i*.05}s`, boxShadow: "0 2px 10px rgba(201,151,58,.05)" }}>
            <div style={{ width: 38, height: 38, borderRadius: 11, background: a.bg, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
              <Icon name={a.icon} size={17} color={a.color} />
            </div>
            <div style={{ fontSize: 13.5, fontWeight: 600, color: T.ink, marginBottom: 3 }}>{a.label}</div>
            <div style={{ fontSize: 12, color: T.muted }}>{a.desc}</div>
          </div>
        ))}
      </div>

      {/* Recent chats */}
      <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 20, color: T.ink, marginBottom: 14 }}>Recent Chats</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {conversations.slice(0, 4).map(c => (
          <div key={c.id} className="hover-lift" onClick={() => setView("chat")}
            style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, cursor: "pointer" }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: T.goldSoft, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>
              {AI_MODES[c.mode]?.emoji || "💬"}
            </div>
            <div style={{ flex: 1, overflow: "hidden" }}>
              <div style={{ fontSize: 13.5, fontWeight: 500, color: T.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.title}</div>
              <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>{c.msgs.length} messages · {AI_MODES[c.mode]?.label}</div>
            </div>
            <Icon name="arrow" size={14} color={T.muted} />
          </div>
        ))}
      </div>
    </div>
  );
};

/* ── GENERATE FILES PANEL ── */
const FilesPanel = () => {
  const [type, setType] = useState("md");
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  async function generate() {
    if (!prompt.trim()) return;
    setLoading(true);
    setResult(null);
    await callAI([{ role: "user", content: `Generate a ${type.toUpperCase()} file for: ${prompt}. Output ONLY the file content, no explanation.` }], "general", (content) => {
      setResult({ content, name: `generated-${Date.now()}.${type}`, type });
    });
    setLoading(false);
  }

  function download() {
    if (!result) return;
    const blob = new Blob([result.content], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = result.name;
    a.click();
  }

  const formats = [
    { id: "md", label: "Markdown", icon: "📝" },
    { id: "txt", label: "Plain Text", icon: "📄" },
    { id: "csv", label: "CSV Data", icon: "📊" },
    { id: "json", label: "JSON", icon: "🔧" },
    { id: "html", label: "HTML", icon: "🌐" },
    { id: "py", label: "Python", icon: "🐍" },
  ];

  return (
    <div style={{ padding: 24, height: "100%", overflowY: "auto" }}>
      <div style={{ marginBottom: 22 }}>
        <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 26, fontWeight: 500, color: T.ink }}>Generate Files</h2>
        <p style={{ fontSize: 13, color: T.muted }}>AI-generated downloadable files · MD, TXT, CSV, JSON, HTML, Python, and more</p>
      </div>

      <Card style={{ padding: 24, marginBottom: 20 }}>
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: T.muted, display: "block", marginBottom: 8, letterSpacing: ".4px" }}>FILE FORMAT</label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {formats.map(f => (
              <button key={f.id} onClick={() => setType(f.id)} style={{
                padding: "7px 14px", borderRadius: 10, border: `1.5px solid ${type === f.id ? T.gold : T.border}`,
                background: type === f.id ? T.goldSoft : "transparent", color: type === f.id ? T.gold : T.muted,
                cursor: "pointer", fontWeight: type === f.id ? 600 : 400, fontSize: 13, transition: "all .15s"
              }}>
                {f.icon} {f.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: T.muted, display: "block", marginBottom: 6, letterSpacing: ".4px" }}>DESCRIBE WHAT TO GENERATE</label>
          <textarea className="inp" rows={3} value={prompt} onChange={e => setPrompt(e.target.value)} placeholder={`e.g. "A README for a FastAPI project with auth and Postgres" or "CSV of world capitals"`} style={{ resize: "vertical" }} />
        </div>

        <button className="btn-ink" onClick={generate} disabled={loading || !prompt.trim()}>
          {loading ? <><Spinner size={14} /> Generating…</> : <><Icon name="sparkle" size={14} /> Generate {type.toUpperCase()}</>}
        </button>
      </Card>

      {result && (
        <Card style={{ padding: 20 }} className="fade-up">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={{ fontWeight: 600, color: T.ink, fontSize: 14 }}>📄 {result.name}</div>
            <button className="btn-ink" onClick={download} style={{ fontSize: 12, padding: "7px 14px" }}>
              <Icon name="download" size={13} /> Download
            </button>
          </div>
          <pre className="code-block" style={{ maxHeight: 380, overflowY: "auto", fontSize: 12 }}>{result.content}</pre>
        </Card>
      )}
    </div>
  );
};

/* ── TELEGRAM PANEL ── */
const TelegramPanel = () => (
  <div style={{ padding: 24, height: "100%", overflowY: "auto" }}>
    <div style={{ marginBottom: 22 }}>
      <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 26, fontWeight: 500, color: T.ink }}>Telegram Integration</h2>
      <p style={{ fontSize: 13, color: T.muted }}>Same AI brain · accessible via Telegram bot</p>
    </div>

    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginBottom: 18 }}>
      <Card style={{ padding: 22 }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>🤖</div>
        <h3 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 18, color: T.ink, marginBottom: 8 }}>Bot Status</h3>
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: T.roseSoft, border: `1px solid ${T.rose}33`, borderRadius: 10 }}>
          <div style={{ width: 8, height: 8, borderRadius: 99, background: T.rose }} />
          <span style={{ fontSize: 13, color: T.rose, fontWeight: 600 }}>Token not configured</span>
        </div>
        <p style={{ fontSize: 12.5, color: T.muted, marginTop: 10, lineHeight: 1.6 }}>Add TELEGRAM_BOT_TOKEN to your environment variables to activate the bot.</p>
      </Card>

      <Card style={{ padding: 22 }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>⚡</div>
        <h3 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 18, color: T.ink, marginBottom: 8 }}>Bot Capabilities</h3>
        {["Chat with your AI from Telegram", "Use all 6 AI modes via /mode command", "Upload files to knowledge base", "Get generated files sent to you", "Receive project summaries", "Search your memories"].map(cap => (
          <div key={cap} style={{ display: "flex", gap: 8, marginBottom: 6, fontSize: 12.5, color: T.muted }}>
            <Icon name="check" size={12} color={T.teal} style={{ marginTop: 2, flexShrink: 0 }} />
            {cap}
          </div>
        ))}
      </Card>
    </div>

    <Card style={{ padding: 22 }}>
      <h3 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 18, color: T.ink, marginBottom: 14 }}>Setup Guide</h3>
      {[
        { step: "1", title: "Create a bot", desc: "Message @BotFather on Telegram → /newbot → follow prompts → copy the token" },
        { step: "2", title: "Add to environment", desc: "Add TELEGRAM_BOT_TOKEN=your_token and TELEGRAM_CHAT_ID=your_id to Vercel environment variables" },
        { step: "3", title: "Deploy", desc: "Push to GitHub → Vercel auto-deploys → your bot activates at /api/telegram/webhook" },
        { step: "4", title: "Set webhook", desc: "Run: curl -X POST https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://your-app.vercel.app/api/telegram/webhook" },
      ].map(s => (
        <div key={s.step} style={{ display: "flex", gap: 14, marginBottom: 14 }}>
          <div style={{ width: 28, height: 28, borderRadius: 99, background: T.goldSoft, border: `1px solid ${T.gold}33`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: T.gold, flexShrink: 0 }}>{s.step}</div>
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 600, color: T.ink, marginBottom: 2 }}>{s.title}</div>
            <div style={{ fontSize: 12.5, color: T.muted, lineHeight: 1.5 }}>{s.desc}</div>
          </div>
        </div>
      ))}
      <div style={{ background: T.tealSoft, border: `1px solid ${T.teal}33`, borderRadius: 12, padding: "12px 14px", fontSize: 12.5, color: T.teal, lineHeight: 1.6, marginTop: 8 }}>
        <strong>Bot Commands:</strong> /start · /mode [general|coding|research|study] · /memory · /files · /help
      </div>
    </Card>
  </div>
);

/* ─────────────────────────────────────────────
   MAIN APP
───────────────────────────────────────────── */
export default function PersonalAIOS() {
  const [dark, setDark] = useState(false);
  const [view, setView] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const store = useStore();

  // Inject styles once
  useEffect(() => {
    if (!document.getElementById("aios-styles")) {
      const el = document.createElement("style");
      el.id = "aios-styles";
      el.textContent = STYLES;
      document.head.appendChild(el);
    }
  }, []);

  const navItems = [
    { id: "overview",  icon: "home",     label: "Overview" },
    { id: "chat",      icon: "chat",     label: "Chat" },
    { id: "knowledge", icon: "db",       label: "Knowledge" },
    { id: "projects",  icon: "folder",   label: "Projects" },
    { id: "memory",    icon: "brain",    label: "Memory" },
    { id: "notes",     icon: "note",     label: "Notes" },
    { id: "files",     icon: "download", label: "Generate Files" },
    { id: "telegram",  icon: "bot",      label: "Telegram" },
    { id: "admin",     icon: "shield",   label: "Admin" },
    { id: "settings",  icon: "settings", label: "Settings" },
  ];

  function renderPanel() {
    switch (view) {
      case "overview":  return <OverviewPanel brand={BRAND} conversations={store.conversations} memories={store.memories} knowledgeFiles={store.knowledgeFiles} projects={store.projects} setView={setView} />;
      case "chat":      return <ChatPanel conversations={store.conversations} setConversations={store.setConversations} dark={dark} />;
      case "knowledge": return <KnowledgePanel knowledgeFiles={store.knowledgeFiles} setKnowledgeFiles={store.setKnowledgeFiles} />;
      case "projects":  return <ProjectsPanel projects={store.projects} setProjects={store.setProjects} />;
      case "memory":    return <MemoryPanel memories={store.memories} setMemories={store.setMemories} />;
      case "notes":     return <NotesPanel notes={store.notes} setNotes={store.setNotes} />;
      case "files":     return <FilesPanel />;
      case "telegram":  return <TelegramPanel />;
      case "admin":     return <AdminPanel />;
      case "settings":  return <SettingsPanel dark={dark} setDark={setDark} />;
      default:          return null;
    }
  }

  return (
    <div className={`aios-root${dark ? " dark" : ""}`} style={{ fontFamily: "'Outfit',sans-serif" }}>
      {/* Ambient blobs */}
      <div className="blob" style={{ width: 560, height: 560, background: `radial-gradient(circle,${T.goldSoft},transparent 70%)`, top: -180, right: -100 }} />
      <div className="blob blob2" style={{ width: 440, height: 440, background: `radial-gradient(circle,${T.tealSoft},transparent 70%)`, bottom: -120, left: -80 }} />
      <div className="blob blob3" style={{ width: 340, height: 340, background: `radial-gradient(circle,${T.roseSoft},transparent 70%)`, top: "38%", right: "14%" }} />

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(42,31,18,0.45)", zIndex: 99, backdropFilter: "blur(4px)" }} />
      )}

      <div style={{ display: "flex", height: "100vh", overflow: "hidden", position: "relative", zIndex: 1 }}>
        {/* ── SIDEBAR ── */}
        <aside
          className={`sidebar-el${sidebarOpen ? " open" : ""}`}
          style={{ width: 240, display: "flex", flexDirection: "column", flexShrink: 0, background: T.card, borderRight: `1px solid ${T.border}`, backdropFilter: "blur(20px)" }}
        >
          {/* Logo */}
          <div style={{ padding: "18px 18px 14px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: `linear-gradient(135deg,${T.goldSoft},${T.tealSoft})`, border: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon name="sparkle" size={16} color={T.gold} />
              </div>
              <div>
                <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 18, fontWeight: 600, color: dark ? "#f5e8d0" : T.ink, lineHeight: 1.1 }}>{BRAND.app_name}</div>
                <div style={{ fontSize: 9.5, color: T.muted, letterSpacing: ".6px" }}>PERSONAL AI OS</div>
              </div>
            </div>
            <button onClick={() => setSidebarOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: T.muted, display: "none" }} className="mobile-close-btn">
              <Icon name="x" size={16} />
            </button>
          </div>

          {/* New chat shortcut */}
          <div style={{ padding: "10px 12px" }}>
            <button className="btn-gold" onClick={() => { setView("chat"); setSidebarOpen(false); }} style={{ width: "100%", justifyContent: "center", fontSize: 13, padding: "9px" }}>
              <Icon name="plus" size={13} color="#fdf8f0" /> New Conversation
            </button>
          </div>

          {/* Nav */}
          <nav style={{ flex: 1, overflowY: "auto", padding: "4px 10px" }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: T.muted, letterSpacing: "1px", padding: "6px 8px 4px" }}>WORKSPACE</div>
            {navItems.slice(0, 7).map(item => (
              <div key={item.id} className={`nav-item${view === item.id ? " active" : ""}`}
                onClick={() => { setView(item.id); setSidebarOpen(false); }}
                style={{ color: dark && view !== item.id ? "#a08060" : undefined }}>
                <Icon name={item.icon} size={15} color={view === item.id ? T.gold : T.muted} />
                {item.label}
              </div>
            ))}
            <div style={{ fontSize: 10, fontWeight: 700, color: T.muted, letterSpacing: "1px", padding: "12px 8px 4px" }}>SYSTEM</div>
            {navItems.slice(7).map(item => (
              <div key={item.id} className={`nav-item${view === item.id ? " active" : ""}`}
                onClick={() => { setView(item.id); setSidebarOpen(false); }}
                style={{ color: dark && view !== item.id ? "#a08060" : undefined }}>
                <Icon name={item.icon} size={15} color={view === item.id ? T.gold : T.muted} />
                {item.label}
              </div>
            ))}
          </nav>

          {/* User */}
          <div style={{ padding: "12px 14px", borderTop: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 32, height: 32, borderRadius: 99, background: `linear-gradient(135deg,${T.gold},${T.rose})`, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 13, fontWeight: 700, flexShrink: 0 }}>O</div>
              <div>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: dark ? "#f5e8d0" : T.ink }}>Owner</div>
                <div style={{ fontSize: 10.5, color: T.muted }}>All permissions</div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 3 }}>
              <button onClick={() => setDark(!dark)} style={{ background: "none", border: "none", cursor: "pointer", padding: 5, borderRadius: 7, color: T.muted }}>
                <Icon name={dark ? "sun" : "moon"} size={14} />
              </button>
              <button onClick={() => setView("settings")} style={{ background: "none", border: "none", cursor: "pointer", padding: 5, borderRadius: 7, color: T.muted }}>
                <Icon name="logout" size={14} />
              </button>
            </div>
          </div>
        </aside>

        {/* ── MAIN CONTENT ── */}
        <div className="main-panel" style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", marginLeft: 0 }}>
          {/* Mobile topbar */}
          <div style={{ display: "none", alignItems: "center", padding: "0 16px", height: 52, background: `${T.card}`, borderBottom: `1px solid ${T.border}`, backdropFilter: "blur(12px)", flexShrink: 0 }} className="mobile-topbar">
            <button onClick={() => setSidebarOpen(true)} style={{ background: "none", border: "none", cursor: "pointer", color: T.ink, padding: 4 }}>
              <Icon name="menu" size={20} />
            </button>
            <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 18, fontWeight: 600, color: dark ? "#f5e8d0" : T.ink, marginLeft: 10 }}>{BRAND.app_name}</span>
          </div>

          {/* Panel */}
          <div style={{ flex: 1, overflow: "hidden" }}>
            {renderPanel()}
          </div>
        </div>
      </div>

      {/* Mobile styles for topbar / close button */}
      <style>{`
        @media(max-width:768px){
          .mobile-topbar{display:flex!important}
          .mobile-close-btn{display:block!important}
          .main-panel{margin-left:0!important}
        }
      `}</style>
    </div>
  );
}

