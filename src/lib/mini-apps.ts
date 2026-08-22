/**
 * Chat should never dump a half-written HTML app into the bubble.
 * We materialize a complete mini-app, save it, and open /projects/[slug].
 */

export const APP_MAKER_INTAKE_KEY = "plethora.appMaker.intake.v1";
export const MINI_APPS_KEY = "plethora.miniApps.v1";

export type AppMakerIntake = {
  name?: string;
  need?: string;
  prompt?: string;
};

export function stashAppMakerIntake(draft: AppMakerIntake) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(APP_MAKER_INTAKE_KEY, JSON.stringify(draft));
  } catch {
    /* */
  }
}

export function takeAppMakerIntake(): AppMakerIntake | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(APP_MAKER_INTAKE_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(APP_MAKER_INTAKE_KEY);
    return JSON.parse(raw) as AppMakerIntake;
  } catch {
    return null;
  }
}

export type MiniApp = {
  slug: string;
  title: string;
  brief: string;
  html: string;
  createdAt: string;
};

export function wantsMiniApp(text: string): boolean {
  const t = text.toLowerCase();
  if (/\b(create|build|make|write|code)\b.{0,100}\b(web )?app\b/.test(t)) return true;
  if (/\btracker app\b|\bweb tracker\b|\bhabit tracker\b|\btodo app\b/.test(t)) return true;
  if (/\bproductivity\b/.test(t) && /\b(time|tracker|pomodoro|tasks?|app)\b/.test(t)) return true;
  if (/\b(dashboard|pomodoro)\b/.test(t) && /\b(for me|for myself|build|make)\b/.test(t))
    return true;
  return false;
}

export function isMiniAppNudge(text: string): boolean {
  const t = text.trim().toLowerCase();
  return /^(are (you|u) done\??|i want it (rn|now).*|want it now|just make it.*|as (you|u) see fit.*)$/.test(
    t
  );
}

export function slugifyAppTitle(title: string): string {
  const s = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 48);
  return s || "miniapp";
}

export function titleFromBrief(brief: string): string {
  const t = brief.toLowerCase();
  if (/\bproductivity\b|\btime management\b|\bpomodoro\b/.test(t)) return "Productivity Tracker";
  if (/\bhabit\b/.test(t)) return "Habit Tracker";
  if (/\bspend|budget|expense\b/.test(t)) return "Spend Tracker";
  const m = brief.match(/\b(?:called|named)\s+["']?([a-z0-9][a-z0-9 \-]{1,40})/i);
  if (m) return m[1].trim();
  return "My Tracker";
}

function loadAll(): MiniApp[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(MINI_APPS_KEY);
    return raw ? (JSON.parse(raw) as MiniApp[]) : [];
  } catch {
    return [];
  }
}

function persist(list: MiniApp[]) {
  localStorage.setItem(MINI_APPS_KEY, JSON.stringify(list.slice(0, 40)));
}

export function listMiniApps(): MiniApp[] {
  return loadAll();
}

export function getMiniApp(slug: string): MiniApp | null {
  return loadAll().find((a) => a.slug === slug) || null;
}

export function saveMiniApp(app: MiniApp): MiniApp {
  const list = loadAll().filter((a) => a.slug !== app.slug);
  list.unshift(app);
  persist(list);
  return app;
}

export function uniqueSlug(base: string): string {
  const existing = new Set(loadAll().map((a) => a.slug));
  if (!existing.has(base)) return base;
  let n = 2;
  while (existing.has(`${base}${n}`)) n += 1;
  return `${base}${n}`;
}

export function extractCompleteHtml(raw: string): string | null {
  let t = raw.trim();
  const fenced = t.match(/```(?:html)?\s*([\s\S]*?)```/i);
  if (fenced) t = fenced[1].trim();
  const start = t.search(/<!doctype html|<html[\s>]/i);
  if (start >= 0) t = t.slice(start);
  if (!/^<!doctype html|^<html[\s>]/i.test(t)) return null;
  if (!/<\/html>/i.test(t)) return null;
  if (t.length < 800) return null;
  return t;
}

export function compileAppSpec(opts: {
  name: string;
  need: string;
  prompt: string;
  audience: string;
  data: string;
  look: string;
  features: string[];
  constraints: string;
}): string {
  return [
    `Build a complete single-file HTML web app named "${opts.name || "My app"}".`,
    `Job: ${opts.need}`,
    opts.prompt ? `Creator rules: ${opts.prompt}` : "",
    `Audience: ${opts.audience}. Data: ${opts.data}. Look: ${opts.look}.`,
    opts.features.length ? `Must include: ${opts.features.join(", ")}.` : "",
    opts.constraints ? `Never: ${opts.constraints}` : "",
    "Output only <!DOCTYPE html> … </html>. Persist with localStorage. No markdown.",
  ]
    .filter(Boolean)
    .join("\n");
}

export const MINIAPP_SYSTEM = `You generate one complete single-file HTML web app.
Output ONLY the HTML document: <!DOCTYPE html> … </html>.
No markdown, no roleplay, no commentary.
Include CSS + JS in the same file. Persist with localStorage.
Must be usable: add, complete, and persist items. Dark, clean UI.`;

export function fallbackTrackerHtml(title: string): string {
  const safe = title.replace(/</g, "");
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>${safe}</title>
<style>
  :root { --bg:#0b1020; --card:#151b32; --line:#2a3358; --text:#e8ecff; --muted:#8b93b8; --acc:#7c5cff; --ok:#34d399; }
  * { box-sizing:border-box; }
  body { margin:0; font-family:ui-sans-serif,system-ui,Segoe UI,sans-serif; background:radial-gradient(1200px 600px at 10% -10%,#1c1640,var(--bg)); color:var(--text); }
  .wrap { max-width:980px; margin:0 auto; padding:24px 16px 64px; }
  h1 { font-size:1.6rem; margin:0 0 4px; }
  .sub { color:var(--muted); margin:0 0 20px; font-size:.9rem; }
  .grid { display:grid; grid-template-columns:1fr 1fr; gap:16px; }
  @media (max-width:800px){ .grid { grid-template-columns:1fr; } }
  .card { background:var(--card); border:1px solid var(--line); border-radius:16px; padding:16px; }
  input,select,button { font:inherit; }
  input,select { width:100%; background:#0d1224; color:var(--text); border:1px solid var(--line); border-radius:10px; padding:10px 12px; }
  button { cursor:pointer; border:0; border-radius:10px; padding:10px 14px; font-weight:600; }
  .row { display:flex; gap:8px; margin-top:8px; }
  .primary { background:var(--acc); color:#fff; }
  .ghost { background:transparent; color:var(--text); border:1px solid var(--line); }
  .task { display:flex; gap:10px; align-items:flex-start; padding:10px 0; border-bottom:1px solid var(--line); }
  .task:last-child { border:0; }
  .task.done span { text-decoration:line-through; color:var(--muted); }
  .timer { font-variant-numeric:tabular-nums; font-size:2.4rem; letter-spacing:.04em; text-align:center; margin:8px 0 12px; }
  .stats { display:flex; gap:12px; color:var(--muted); font-size:.85rem; flex-wrap:wrap; }
</style>
</head>
<body>
<div class="wrap">
  <h1>${safe}</h1>
  <p class="sub">Tasks, time blocks, and Pomodoro — saved in this browser. Built in Plethora.</p>
  <div class="grid">
    <div class="card">
      <strong>Today</strong>
      <div class="row">
        <input id="task" placeholder="Add a task and press Enter"/>
        <select id="pri"><option>Normal</option><option>High</option><option>Low</option></select>
      </div>
      <div class="row">
        <button class="primary" id="add">Add</button>
        <button class="ghost" id="clearDone">Clear done</button>
      </div>
      <div id="list"></div>
    </div>
    <div class="card">
      <strong>Focus</strong>
      <div class="timer" id="clock">25:00</div>
      <div class="row">
        <button class="primary" id="pomo">Pomodoro 25</button>
        <button class="ghost" id="stop">Stop</button>
      </div>
      <div class="row">
        <button class="ghost" id="startLog">Log time</button>
        <button class="ghost" id="stopLog">Stop log</button>
      </div>
      <p class="stats" id="stats"></p>
    </div>
  </div>
</div>
<script>
const K = "plethora.${slugifyAppTitle(title)}.v1";
const state = JSON.parse(localStorage.getItem(K) || '{"tasks":[],"minutes":0,"pomos":0}');
let pomo = null, left = 25*60, logging = null, logStarted = 0;
const $ = (id) => document.getElementById(id);
function save(){ localStorage.setItem(K, JSON.stringify(state)); render(); }
function render(){
  $("list").innerHTML = state.tasks.map((t,i) =>
    '<label class="task'+(t.done?" done":"")+'"><input type="checkbox" '+(t.done?"checked":"")+' data-i="'+i+'"><span><b>'+t.pri+'</b> '+t.text+'</span></label>'
  ).join("") || '<p class="sub">No tasks yet.</p>';
  $("stats").textContent = "Focused minutes: "+state.minutes+" · Pomodoros: "+state.pomos+" · Open tasks: "+state.tasks.filter(t=>!t.done).length;
}
function add(){
  const text = $("task").value.trim();
  if (!text) return;
  state.tasks.unshift({ text, pri: $("pri").value, done:false });
  $("task").value = "";
  save();
}
$("add").onclick = add;
$("task").onkeydown = (e) => { if (e.key==="Enter") add(); };
$("list").onchange = (e) => {
  const i = e.target.getAttribute("data-i");
  if (i==null) return;
  state.tasks[i].done = e.target.checked;
  save();
};
$("clearDone").onclick = () => { state.tasks = state.tasks.filter(t=>!t.done); save(); };
function tick(){
  left -= 1;
  if (left <= 0){ clearInterval(pomo); pomo=null; left=25*60; state.pomos += 1; save(); }
  const m = String(Math.floor(left/60)).padStart(2,"0");
  const s = String(left%60).padStart(2,"0");
  $("clock").textContent = m+":"+s;
}
$("pomo").onclick = () => { if (pomo) return; left=25*60; pomo=setInterval(tick,1000); };
$("stop").onclick = () => { if (pomo) clearInterval(pomo); pomo=null; left=25*60; $("clock").textContent="25:00"; };
$("startLog").onclick = () => { logStarted = Date.now(); };
$("stopLog").onclick = () => {
  if (!logStarted) return;
  state.minutes += Math.max(1, Math.round((Date.now()-logStarted)/60000));
  logStarted = 0;
  save();
};
render();
</script>
</body>
</html>`;
}

export function materializeMiniApp(brief: string): MiniApp {
  const title = titleFromBrief(brief);
  const slug = uniqueSlug(slugifyAppTitle(title));
  const app: MiniApp = {
    slug,
    title,
    brief: brief.slice(0, 500),
    html: fallbackTrackerHtml(title),
    createdAt: new Date().toISOString(),
  };
  return saveMiniApp(app);
}

export function projectPath(slug: string): string {
  return `/projects/${encodeURIComponent(slug)}`;
}

export function openMiniAppWindow(slug: string): Window | null {
  if (typeof window === "undefined") return null;
  return window.open(projectPath(slug), "_blank", "noopener,noreferrer");
}
