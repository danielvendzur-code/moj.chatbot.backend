import type { ConversationSummary, LoggedTurn } from "./chatLog.js";

const path = "/historia";

export const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const dateTime = (value: number): string =>
  value
    ? new Date(value).toLocaleString("sk-SK", {
        timeZone: "Europe/Bratislava",
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

const dayKey = (value: number): string =>
  new Date(value).toLocaleDateString("sk-SK", {
    timeZone: "Europe/Bratislava",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

function shell(title: string, body: string, script = ""): string {
  return `<!doctype html>
<html lang="sk">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="robots" content="noindex,nofollow">
<meta name="theme-color" content="#0b0908">
<title>${escapeHtml(title)}</title>
<style>
:root{color-scheme:dark;--bg:#0b0908;--panel:#15100d;--panel2:#1d1612;--line:rgba(255,199,157,.16);--line2:rgba(255,199,157,.32);--text:#fff8f2;--muted:#aa9a91;--accent:#ffc79d;--danger:#ff9185;font-family:Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif}*{box-sizing:border-box}body{margin:0;min-height:100vh;background:radial-gradient(circle at 50% -15%,rgba(255,199,157,.13),transparent 36%),var(--bg);color:var(--text);font:15px/1.55 ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif}button,input{font:inherit}a{color:inherit}main{width:min(100% - 28px,980px);margin:0 auto;padding:30px 0 72px}.top{display:flex;align-items:center;gap:13px;margin-bottom:26px}.mark{display:grid;place-items:center;width:46px;height:46px;border-radius:14px;background:var(--accent);color:#0b0908;font-size:21px;font-weight:900;box-shadow:0 14px 44px rgba(255,199,157,.18)}.brand h1{margin:0;font-size:20px;letter-spacing:-.02em}.brand p{margin:2px 0 0;color:var(--muted);font-size:12px}.spacer{flex:1}.button{display:inline-flex;align-items:center;justify-content:center;min-height:42px;padding:0 16px;border:1px solid var(--line);border-radius:12px;background:var(--panel);color:var(--text);font-weight:750;text-decoration:none;cursor:pointer}.button:hover{border-color:var(--line2);background:var(--panel2)}.button.primary{border-color:transparent;background:var(--accent);color:#0b0908}.card{border:1px solid var(--line);border-radius:21px;background:linear-gradient(145deg,rgba(29,22,18,.96),rgba(17,13,11,.98));box-shadow:0 30px 90px -58px rgba(0,0,0,.92)}.login-wrap{display:grid;place-items:center;min-height:calc(100vh - 60px)}.login{width:min(100%,430px);padding:30px}.login .mark{margin-bottom:20px}.eyebrow{margin:0 0 8px;color:var(--accent);font-size:11px;font-weight:850;letter-spacing:.14em;text-transform:uppercase}.login h1{margin:0;font-size:29px;letter-spacing:-.04em}.login>p{margin:12px 0 24px;color:var(--muted)}.field{display:grid;gap:7px}.field label{font-size:12px;color:var(--muted);font-weight:750}.field input,.filters input{width:100%;height:48px;border:1px solid var(--line);border-radius:13px;background:#0f0c0a;color:var(--text);padding:0 14px;outline:none}.field input:focus,.filters input:focus{border-color:var(--accent);box-shadow:0 0 0 3px rgba(255,199,157,.1)}.login .button{width:100%;margin-top:14px}.error{margin:12px 0 0;color:var(--danger);font-size:13px}.stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin-bottom:18px}.stat{padding:18px}.stat strong{display:block;font-size:28px;letter-spacing:-.04em}.stat span{color:var(--muted);font-size:11px;text-transform:uppercase;letter-spacing:.08em}.filters{display:grid;grid-template-columns:minmax(220px,1fr) 170px;gap:10px;padding:14px;margin-bottom:18px}.list{display:grid;gap:10px}.conversation{display:grid;grid-template-columns:155px minmax(0,1fr) auto;align-items:center;gap:16px;padding:16px 18px;border:1px solid var(--line);border-radius:16px;background:var(--panel);text-decoration:none;transition:transform .18s ease,border-color .18s ease,background .18s ease}.conversation:hover{transform:translateY(-1px);border-color:var(--line2);background:var(--panel2)}.conversation[hidden]{display:none}.time,.meta{color:var(--muted);font-size:12px}.preview{min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.arrow{color:var(--accent);font-size:20px}.empty{padding:42px;text-align:center;color:var(--muted)}.detail-head{display:flex;align-items:flex-start;gap:14px;margin-bottom:20px}.detail-head h1{margin:0;font-size:23px}.detail-head p{margin:4px 0 0;color:var(--muted);font-size:12px}.thread{display:grid;gap:10px}.turn{max-width:82%;padding:12px 15px;border-radius:17px;white-space:pre-wrap;overflow-wrap:anywhere}.turn.user{justify-self:end;background:var(--accent);color:#0b0908;border-bottom-right-radius:5px}.turn.assistant{justify-self:start;border:1px solid var(--line);background:var(--panel);border-bottom-left-radius:5px}.turn small{display:block;margin-bottom:4px;font-size:10px;font-weight:850;letter-spacing:.08em;text-transform:uppercase;opacity:.62}.notice{padding:15px 17px;margin-bottom:18px;color:var(--muted);font-size:13px}.config{width:min(100% - 28px,620px);margin:70px auto;padding:24px}.config h1{margin-top:0}.config code{color:var(--accent)}@media(max-width:760px){main{width:min(100% - 20px,980px);padding-top:18px}.top{align-items:flex-start;flex-wrap:wrap}.top .spacer{display:none}.top form{margin-left:auto}.stats{grid-template-columns:repeat(2,minmax(0,1fr))}.filters{grid-template-columns:1fr}.conversation{grid-template-columns:1fr auto;gap:5px 12px}.conversation .time,.conversation .preview,.conversation .meta{grid-column:1}.conversation .arrow{grid-column:2;grid-row:1/4}.turn{max-width:94%}.login{padding:24px}}@media(prefers-reduced-motion:reduce){*{transition:none!important}}
</style>
</head>
<body>${body}${script ? `<script>${script}</script>` : ""}</body>
</html>`;
}

function header(subtitle: string): string {
  return `<header class="top"><div class="mark" aria-hidden="true">M</div><div class="brand"><h1>História chatov</h1><p>${escapeHtml(subtitle)}</p></div><div class="spacer"></div><form method="post" action="${path}"><input type="hidden" name="action" value="logout"><button class="button" type="submit">Odhlásiť sa</button></form></header>`;
}

export function renderLogin(error = false): string {
  return shell(
    "História chatov — Môj Chatbot",
    `<main class="login-wrap"><section class="card login"><div class="mark" aria-hidden="true">M</div><p class="eyebrow">Súkromná administrácia</p><h1>História chatov</h1><p>Zadajte rovnaké heslo, aké máte vo Verceli uložené ako <b>ADMIN_KEY</b>.</p><form method="post" action="${path}"><input type="hidden" name="action" value="login"><div class="field"><label for="password">Prístupové heslo</label><input id="password" name="password" type="password" autocomplete="current-password" required autofocus></div><button class="button primary" type="submit">Prihlásiť sa</button>${error ? '<p class="error" role="alert">Nesprávne heslo.</p>' : ""}</form></section></main>`,
  );
}

export function renderConfiguration(message: string): string {
  return shell(
    "História nie je nakonfigurovaná",
    `<section class="card config"><p class="eyebrow">Chýba nastavenie</p><h1>História chatov ešte nie je aktívna.</h1><p>${escapeHtml(message)}</p><p>V projekte <b>moj-chatbot-backend</b> musia byť nastavené <code>ADMIN_KEY</code>, <code>KV_REST_API_URL</code> a <code>KV_REST_API_TOKEN</code>.</p></section>`,
  );
}

export function renderDashboard(conversations: ConversationSummary[]): string {
  const now = Date.now();
  const today = dayKey(now);
  const lastWeek = now - 7 * 24 * 60 * 60 * 1000;
  const todayCount = conversations.filter((item) => dayKey(item.lastAt) === today).length;
  const weekCount = conversations.filter((item) => item.lastAt >= lastWeek).length;
  const turns = conversations.reduce((sum, item) => sum + item.turns, 0);
  const items = conversations.length
    ? conversations
        .map(
          (item) =>
            `<a class="conversation" href="${path}?id=${encodeURIComponent(item.id)}" data-search="${escapeHtml(`${item.preview} ${dateTime(item.lastAt)}`.toLowerCase())}"><span class="time">${escapeHtml(dateTime(item.lastAt))}</span><span class="preview">${escapeHtml(item.preview || "Bez úvodnej správy")}</span><span class="meta">${item.turns} správ</span><span class="arrow" aria-hidden="true">›</span></a>`,
        )
        .join("")
    : '<div class="card empty">Zatiaľ tu nie sú žiadne uložené konverzácie.</div>';

  return shell(
    "História chatov — Môj Chatbot",
    `<main>${header("Môj Chatbot · uchovávanie 90 dní")}<section class="stats"><article class="card stat"><strong>${conversations.length}</strong><span>Konverzácií</span></article><article class="card stat"><strong>${todayCount}</strong><span>Dnes</span></article><article class="card stat"><strong>${weekCount}</strong><span>Za 7 dní</span></article><article class="card stat"><strong>${turns}</strong><span>Správ</span></article></section><section class="card filters"><input id="search" type="search" placeholder="Hľadať v úvodnej správe…" autocomplete="off"><input id="date" type="date" aria-label="Filtrovať podľa dátumu"></section><section id="list" class="list">${items}</section></main>`,
    `const search=document.getElementById('search');const date=document.getElementById('date');const items=[...document.querySelectorAll('.conversation')];function apply(){const q=(search.value||'').trim().toLowerCase();const d=date.value;let shown=0;for(const item of items){const text=item.dataset.search||'';const matchText=!q||text.includes(q);const matchDate=!d||text.includes(d.split('-').reverse().join('.'))||text.includes(d);item.hidden=!(matchText&&matchDate);if(!item.hidden)shown++;}let empty=document.getElementById('filter-empty');if(!shown&&items.length){if(!empty){empty=document.createElement('div');empty.id='filter-empty';empty.className='card empty';empty.textContent='Žiadna konverzácia nezodpovedá filtru.';document.getElementById('list').appendChild(empty);}}else if(empty){empty.remove();}}search?.addEventListener('input',apply);date?.addEventListener('change',apply);`,
  );
}

export function renderConversation(id: string, turns: LoggedTurn[]): string {
  const messages = turns.length
    ? turns
        .map(
          (turn) =>
            `<article class="turn ${turn.role}"><small>${turn.role === "user" ? "Návštevník" : "Môj Chatbot"}${turn.at ? ` · ${escapeHtml(dateTime(turn.at))}` : ""}</small>${escapeHtml(turn.text)}</article>`,
        )
        .join("")
    : '<div class="card empty">Konverzácia už vypršala alebo neexistuje.</div>';

  return shell(
    "Konverzácia — Môj Chatbot",
    `<main>${header("Detail konverzácie")}<div class="detail-head"><a class="button" href="${path}">← Späť</a><div><h1>Konverzácia</h1><p>${escapeHtml(id)} · ${turns.length} správ</p></div></div><section class="thread">${messages}</section></main>`,
  );
}
