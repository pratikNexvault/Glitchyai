import { COOKIE_NAME, isValidSessionToken, getCookie } from "./api/_lib.js";

export const config = { matcher: ["/"] };

export default async function middleware(req) {
  const token = getCookie(req, COOKIE_NAME);
  if (await isValidSessionToken(token)) return; // authorized — let index.html through

  return new Response(LOGIN_PAGE, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

const LOGIN_PAGE = `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<meta name="robots" content="noindex, nofollow" />
<title>Lumis AI</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,500;1,500&family=Plus+Jakarta+Sans:wght@400;500;600&display=swap" rel="stylesheet">
<style>
  :root{--canvas:#FAFAF7;--ink:#16181C;--ink-soft:#6B6E76;--line:#E8E5DE;--glow:#D9A441;--glow-deep:#B9842B;}
  *{box-sizing:border-box;margin:0;padding:0;}
  body{min-height:100vh;display:flex;align-items:center;justify-content:center;background:var(--canvas);font-family:'Plus Jakarta Sans',sans-serif;color:var(--ink);}
  .card{width:100%;max-width:340px;padding:32px;text-align:center;}
  .dot{width:30px;height:30px;border-radius:50%;margin:0 auto 14px;background:radial-gradient(circle at 35% 30%,#F3CE85,var(--glow) 60%,var(--glow-deep));box-shadow:0 0 24px -2px rgba(217,164,65,.55);animation:breathe 2.6s ease-in-out infinite;}
  @keyframes breathe{0%,100%{transform:scale(1);opacity:.85}50%{transform:scale(1.15);opacity:1}}
  h1{font-family:'Fraunces',serif;font-style:italic;font-size:1.5rem;margin-bottom:6px;}
  p{color:var(--ink-soft);font-size:.875rem;margin-bottom:22px;}
  input{width:100%;padding:12px 14px;border-radius:12px;border:1px solid var(--line);font-size:.95rem;outline:none;background:#fff;}
  input:focus{border-color:var(--glow);}
  button{width:100%;margin-top:10px;padding:12px;border-radius:12px;border:none;background:var(--ink);color:#fff;font-weight:600;font-size:.9rem;cursor:pointer;}
  button:disabled{opacity:.5;}
  #err{color:#C0392B;font-size:.8rem;margin-top:10px;min-height:1em;}
</style>
</head>
<body>
  <form class="card" id="form">
    <div class="dot"></div>
    <h1>Lumis AI</h1>
    <p>Private assistant. Enter the password to continue.</p>
    <input type="password" id="pw" placeholder="Password" autofocus autocomplete="current-password" />
    <button type="submit" id="btn">Unlock</button>
    <div id="err"></div>
  </form>
<script>
  const form = document.getElementById('form');
  const pw = document.getElementById('pw');
  const btn = document.getElementById('btn');
  const err = document.getElementById('err');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    err.textContent = '';
    btn.disabled = true;
    btn.textContent = 'Checking...';
    try {
      const res = await fetch('/api/data?action=login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pw.value }),
      });
      if (res.ok) {
        location.reload();
      } else {
        err.textContent = 'Incorrect password.';
        btn.disabled = false;
        btn.textContent = 'Unlock';
      }
    } catch {
      err.textContent = 'Something went wrong. Try again.';
      btn.disabled = false;
      btn.textContent = 'Unlock';
    }
  });
</script>
</body>
</html>`;
