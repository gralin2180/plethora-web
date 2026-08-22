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
    "Must include: live local clock, calendar day strip, reminders with optional browser notifications, focus timer labeled (15/25/50 min), stats, ICS download for phone calendars. Dense dark UI.",
    "Output only <!DOCTYPE html> … </html>. Persist with localStorage. No markdown.",
  ]
    .filter(Boolean)
    .join("\n");
}

export const MINIAPP_SYSTEM = `You generate one complete single-file HTML web app.
Output ONLY the HTML document: <!DOCTYPE html> … </html>.
No markdown, no roleplay, no commentary.
Include CSS + JS in the same file. Persist with localStorage.
Must feel like a real product: live clock, date, task list, reminders (datetime + Notification API if allowed), focus timer with 15/25/50 presets (label what 25 means), daily stats, .ics export, Add-to-Home-Screen note for phone.
Dark, dense, polished UI — not a three-button prototype.`;

export function fallbackTrackerHtml(title: string): string {
  const safe = title.replace(/</g, "");
  const key = slugifyAppTitle(title);
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>${safe}</title>
<style>
:root{--bg:#07070f;--panel:#10101c;--line:#2a2744;--txt:#f4f1ff;--dim:#9b97b8;--a:#8b5cf6;--b:#22d3ee;--w:#f59e0b}
*{box-sizing:border-box}body{margin:0;font-family:ui-sans-serif,system-ui,sans-serif;background:radial-gradient(900px 500px at 80% -10%,#3b1d6e55,transparent),var(--bg);color:var(--txt)}
.top{display:flex;justify-content:space-between;gap:16px;align-items:flex-end;padding:20px 20px 8px;max-width:1100px;margin:auto}
.clock{font-variant-numeric:tabular-nums;font-size:2.2rem;font-weight:700;letter-spacing:.04em}
.grid{display:grid;grid-template-columns:1.2fr .9fr;gap:14px;max-width:1100px;margin:0 auto;padding:12px 20px 48px}
@media(max-width:860px){.grid{grid-template-columns:1fr}}
.card{background:linear-gradient(180deg,#161628,#10101c);border:1px solid var(--line);border-radius:18px;padding:16px;box-shadow:0 20px 50px #0006}
h1{margin:0;font-size:1.35rem} .sub{color:var(--dim);font-size:.8rem;margin:.3rem 0 0}
input,select,button,textarea{font:inherit} input,select,textarea{width:100%;background:#0a0a14;color:var(--txt);border:1px solid var(--line);border-radius:12px;padding:10px 12px}
.row{display:flex;gap:8px;flex-wrap:wrap;margin-top:8px}
button{cursor:pointer;border:0;border-radius:12px;padding:10px 12px;font-weight:650}
.p{background:linear-gradient(90deg,var(--a),#6d28d9);color:#fff}.g{background:#ffffff10;color:var(--txt);border:1px solid var(--line)}
.task{display:flex;gap:10px;align-items:flex-start;padding:10px 0;border-bottom:1px solid #ffffff0d}
.done span{text-decoration:line-through;color:var(--dim)}
.big{font-variant-numeric:tabular-nums;font-size:3rem;text-align:center;margin:4px 0 8px}
.chip{font-size:11px;padding:6px 10px;border-radius:999px;border:1px solid var(--line);background:#0003;color:var(--dim)}
.chip.on{border-color:var(--b);color:var(--b)}
.stat{display:flex;gap:10px;flex-wrap:wrap;margin-top:10px}.stat b{color:var(--b);display:block;font-size:1.1rem}
.note{font-size:11px;color:var(--dim);margin-top:10px;line-height:1.45}
</style></head>
<body>
<div class="top">
  <div><h1>${safe}</h1><p class="sub" id="today"></p></div>
  <div style="text-align:right"><div class="clock" id="live"></div><p class="sub">Local time · not a 25-only toy</p></div>
</div>
<div class="grid">
  <div class="card">
    <strong>Today’s work</strong>
    <div class="row"><input id="task" placeholder="Task…"/><select id="pri"><option>Normal</option><option>High</option><option>Low</option></select></div>
    <div class="row"><input id="when" type="datetime-local"/><button class="p" id="add">Add + remind</button></div>
    <div id="list"></div>
    <div class="row"><button class="g" id="clearDone">Clear done</button><button class="g" id="ics">Download .ics for phone</button><button class="g" id="notify">Allow alerts</button></div>
    <p class="note">Phone sync: allow alerts, then Add to Home Screen. .ics drops reminders into Google/Apple Calendar. This page cannot tap your phone’s clock app from the web.</p>
  </div>
  <div class="card">
    <strong>Focus block</strong>
    <div class="row" id="presets"></div>
    <div class="big" id="pomo">25:00</div>
    <p class="sub" style="text-align:center" id="pomoLabel">25 min · classic Pomodoro (work sprint)</p>
    <div class="row"><button class="p" id="start">Start</button><button class="g" id="pause">Pause</button><button class="g" id="reset">Reset</button></div>
    <div class="stat">
      <div><b id="sOpen">0</b><span class="sub">open</span></div>
      <div><b id="sMin">0</b><span class="sub">focus min</span></div>
      <div><b id="sPomo">0</b><span class="sub">sprints</span></div>
      <div><b id="sStreak">0</b><span class="sub">day streak</span></div>
    </div>
  </div>
</div>
<script>
const K="plethora.${key}.v2";
const state=JSON.parse(localStorage.getItem(K)||'{"tasks":[],"minutes":0,"pomos":0,"streak":0,"lastDay":""}');
let left=25*60, mode=25, timer=null, running=false;
const $=id=>document.getElementById(id);
function save(){localStorage.setItem(K,JSON.stringify(state));draw();}
function tickLive(){
  const d=new Date();
  $("live").textContent=d.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit",second:"2-digit"});
  $("today").textContent=d.toLocaleDateString(undefined,{weekday:"long",month:"short",day:"numeric"});
  const day=d.toDateString();
  if(state.lastDay && state.lastDay!==day){ /* keep streak if any done yesterday handled on complete */ }
  pingReminders();
}
function pingReminders(){
  const now=Date.now();
  state.tasks.forEach(t=>{
    if(t.when && !t.pinged && new Date(t.when).getTime()<=now && !t.done){
      t.pinged=true;
      if(window.Notification && Notification.permission==="granted") new Notification("Reminder",{body:t.text});
    }
  });
  save();
}
function fmt(n){const m=String(Math.floor(n/60)).padStart(2,"0");const s=String(n%60).padStart(2,"0");return m+":"+s;}
function draw(){
  $("list").innerHTML=state.tasks.map((t,i)=>'<label class="task'+(t.done?" done":"")+'"><input type="checkbox" data-i="'+i+'" '+(t.done?"checked":"")+'><span><b>'+t.pri+'</b> '+t.text+(t.when?' <small class="sub">'+new Date(t.when).toLocaleString()+'</small>':'')+'</span></label>').join("")||'<p class="sub">Nothing queued — add a task and a reminder time.</p>';
  $("sOpen").textContent=state.tasks.filter(t=>!t.done).length;
  $("sMin").textContent=state.minutes;
  $("sPomo").textContent=state.pomos;
  $("sStreak").textContent=state.streak||0;
  $("pomo").textContent=fmt(left);
}
function add(){
  const text=$("task").value.trim(); if(!text) return;
  state.tasks.unshift({text,pri:$("pri").value,when:$("when").value||null,done:false,pinged:false});
  $("task").value=""; save();
}
$("add").onclick=add;
$("task").onkeydown=e=>{if(e.key==="Enter")add();};
$("list").onchange=e=>{const i=e.target.getAttribute("data-i"); if(i==null)return; state.tasks[i].done=e.target.checked; if(e.target.checked){const day=new Date().toDateString(); if(state.lastDay!==day){state.streak=(state.lastDay?state.streak+1:1); state.lastDay=day;} } save();};
$("clearDone").onclick=()=>{state.tasks=state.tasks.filter(t=>!t.done);save();};
$("notify").onclick=()=>{if(window.Notification) Notification.requestPermission();};
$("ics").onclick=()=>{
  const lines=["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//Plethora//Tracker//EN"];
  state.tasks.filter(t=>t.when).forEach((t,i)=>{
    const d=new Date(t.when); const z=d.toISOString().replace(/[-:]/g,"").split(".")[0]+"Z";
    lines.push("BEGIN:VEVENT","UID:"+i+"@plethora","DTSTART:"+z,"SUMMARY:"+t.text.replace(/,/g," "),"END:VEVENT");
  });
  lines.push("END:VCALENDAR");
  const a=document.createElement("a"); a.href=URL.createObjectURL(new Blob([lines.join("\\n")])); a.download="reminders.ics"; a.click();
};
[15,25,50].forEach(m=>{
  const b=document.createElement("button"); b.className="chip"+(m===25?" on":""); b.textContent=m===25?"25 work":m===15?"15 short":"50 deep";
  b.onclick=()=>{document.querySelectorAll(".chip").forEach(x=>x.classList.remove("on")); b.classList.add("on"); mode=m; left=m*60; $("pomoLabel").textContent=m+" min · "+(m===25?"Pomodoro work sprint":m===15?"short burst":"deep work"); draw();};
  $("presets").appendChild(b);
});
function step(){ if(!running) return; left--; if(left<=0){ running=false; state.pomos++; state.minutes+=mode; left=mode*60; if(window.Notification&&Notification.permission==="granted") new Notification("Focus done",{body:mode+" minutes in."}); save(); } draw(); }
$("start").onclick=()=>{if(timer) clearInterval(timer); running=true; timer=setInterval(step,1000);};
$("pause").onclick=()=>{running=false;};
$("reset").onclick=()=>{running=false; left=mode*60; draw();};
setInterval(tickLive,1000); tickLive(); draw();
</script></body></html>`;
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
