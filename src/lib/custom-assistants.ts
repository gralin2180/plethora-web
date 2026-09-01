/**
 * Custom assistants — stored per browser; optional cloud sync later via Supabase.
 * Free plan: 1 assistant. Paid: more (see plans.ts).
 */

import type { PlanId } from "./plans";
import { getPlanCapabilities } from "./plans";

export type CustomAssistant = {
  id: string;
  name: string;
  systemPrompt: string;
  styleNotes: string;
  topics: string;
  createdAt: string;
  updatedAt: string;
  /** Last few Q&A used to shape personality */
  seedQa: { q: string; a: string }[];
};

const KEY = "plethora.customAssistants.v1";

export function loadCustomAssistants(): CustomAssistant[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const list = JSON.parse(raw) as CustomAssistant[];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function saveCustomAssistants(list: CustomAssistant[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(list.slice(0, 50)));
}

/** Platform-built assistants — do not count toward user custom-assistant quota */
export function isPlatformAssistant(id: string): boolean {
  return id === "plethora-game-director";
}

export function countUserAssistants(list: CustomAssistant[]): number {
  return list.filter((a) => !isPlatformAssistant(a.id)).length;
}

export function getAssistantLimit(plan: PlanId = "free"): number {
  return getPlanCapabilities(plan).maxCustomAssistants;
}

export function createAssistantDraft(fromMessage?: string): CustomAssistant {
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `a_${Date.now()}`;
  return {
    id,
    name: "My assistant",
    systemPrompt: fromMessage
      ? `You are a personal assistant shaped from this preference:\n${fromMessage.slice(0, 800)}\nStay helpful, explicit when the adult consented, and refuse illegal content involving minors.`
      : "You are a helpful personal assistant. Match the user's tone. Refuse illegal content involving minors.",
    styleNotes: "",
    topics: "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    seedQa: [],
  };
}

export function upsertAssistant(a: CustomAssistant): void {
  const list = loadCustomAssistants();
  const i = list.findIndex((x) => x.id === a.id);
  const next = { ...a, updatedAt: new Date().toISOString() };
  if (i >= 0) list[i] = next;
  else list.unshift(next);
  saveCustomAssistants(list);
}

export function deleteAssistant(id: string): void {
  saveCustomAssistants(loadCustomAssistants().filter((a) => a.id !== id));
}

/** Export a standalone HTML mini-chat that uses user's OpenRouter key they paste in the page */
export function exportAssistantHtml(a: CustomAssistant): string {
  const sys = JSON.stringify(a.systemPrompt);
  const name = JSON.stringify(a.name);
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${a.name.replace(/</g, "")} — Plethora export</title>
<style>
body{font-family:system-ui,sans-serif;background:#0b0b12;color:#e4e4e7;margin:0;padding:1.5rem}
.wrap{max-width:40rem;margin:0 auto}
h1{font-size:1.25rem}
input,textarea,button{font:inherit}
#key{width:100%;padding:.5rem;border-radius:.5rem;border:1px solid #333;background:#12121a;color:#fff;margin:.5rem 0}
#log{min-height:240px;border:1px solid #333;border-radius:.75rem;padding:1rem;margin:1rem 0;white-space:pre-wrap}
#in{width:100%;min-height:4rem;padding:.5rem;border-radius:.5rem;border:1px solid #333;background:#12121a;color:#fff}
button{margin-top:.5rem;padding:.5rem 1rem;border:0;border-radius:.5rem;background:#7c3aed;color:#fff;cursor:pointer}
.hint{font-size:.8rem;color:#71717a}
</style>
</head>
<body>
<div class="wrap">
  <h1 id="title"></h1>
  <p class="hint">Local export from Plethora. Paste <b>your</b> OpenRouter API key (stored only in this browser tab). Not Plethora's key.</p>
  <input id="key" type="password" placeholder="sk-or-… OpenRouter key"/>
  <div id="log"></div>
  <textarea id="in" placeholder="Message…"></textarea>
  <button id="send">Send</button>
</div>
<script>
const SYSTEM = ${sys};
const NAME = ${name};
document.getElementById('title').textContent = NAME;
const log = document.getElementById('log');
const hist = [{role:'system',content:SYSTEM}];
document.getElementById('send').onclick = async () => {
  const key = document.getElementById('key').value.trim();
  const msg = document.getElementById('in').value.trim();
  if (!key || !msg) { alert('Key + message required'); return; }
  hist.push({role:'user',content:msg});
  log.textContent += '\\nYou: ' + msg + '\\n…';
  document.getElementById('in').value = '';
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method:'POST',
    headers:{
      'Authorization':'Bearer '+key,
      'Content-Type':'application/json',
      'HTTP-Referer': location.origin,
      'X-Title': NAME
    },
    body: JSON.stringify({ model: 'openrouter/free', messages: hist.slice(-20) })
  });
  const data = await res.json();
  const reply = data.choices?.[0]?.message?.content || (data.error?.message || 'Error');
  hist.push({role:'assistant',content:reply});
  log.textContent += '\\n' + NAME + ': ' + reply + '\\n';
};
</script>
</body>
</html>`;
}
