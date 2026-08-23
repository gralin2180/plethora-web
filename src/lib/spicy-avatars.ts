import { playSpicyTts } from "./spicy-media";

export type SpicyVoice = "soft-f" | "warm-f" | "low-m" | "bright-m";

export type SpicyAvatar = {
  id: string;
  name: string;
  look: string;
  traits: string;
  voice: SpicyVoice;
  photo?: string;
  createdAt: string;
};

const KEY = "plethora.spicy.avatars.v1";
const ACTIVE = "plethora.spicy.avatar.active";

export const VOICE_LABELS: Record<SpicyVoice, string> = {
  "soft-f": "Soft (femme)",
  "warm-f": "Warm (femme)",
  "low-m": "Low (masc)",
  "bright-m": "Bright (masc)",
};

export function loadSpicyAvatars(): SpicyAvatar[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    const list = raw ? (JSON.parse(raw) as SpicyAvatar[]) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function saveSpicyAvatars(list: SpicyAvatar[]) {
  localStorage.setItem(KEY, JSON.stringify(list.slice(0, 20)));
}

export function loadActiveAvatarId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACTIVE);
}

export function setActiveAvatarId(id: string | null) {
  if (!id) localStorage.removeItem(ACTIVE);
  else localStorage.setItem(ACTIVE, id);
}

export function upsertSpicyAvatar(a: SpicyAvatar) {
  const list = loadSpicyAvatars();
  const i = list.findIndex((x) => x.id === a.id);
  if (i >= 0) list[i] = a;
  else list.unshift(a);
  saveSpicyAvatars(list);
}

export function deleteSpicyAvatar(id: string) {
  saveSpicyAvatars(loadSpicyAvatars().filter((x) => x.id !== id));
  if (loadActiveAvatarId() === id) setActiveAvatarId(null);
}

export async function shrinkPhoto(file: File): Promise<string> {
  const bmp = await createImageBitmap(file);
  const size = 256;
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const ctx = c.getContext("2d");
  if (!ctx) throw new Error("canvas");
  const scale = Math.max(size / bmp.width, size / bmp.height);
  const w = bmp.width * scale;
  const h = bmp.height * scale;
  ctx.drawImage(bmp, (size - w) / 2, (size - h) / 2, w, h);
  return c.toDataURL("image/jpeg", 0.72);
}

export function speakAsAvatar(text: string, voice: SpicyVoice) {
  if (typeof window === "undefined") return;
  const audio = playSpicyTts(text, voice);
  if (audio) {
    audio.onerror = () => speakBrowser(text, voice);
    return;
  }
  speakBrowser(text, voice);
}

function speakBrowser(text: string, voice: SpicyVoice) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text.slice(0, 4000));
  const femme = voice.endsWith("-f");
  const voices = window.speechSynthesis.getVoices();
  const pick = voices.find((v) =>
    femme
      ? /female|zira|samantha|karen|fiona|victoria/i.test(v.name)
      : /male|david|daniel|fred|alex/i.test(v.name)
  );
  if (pick) u.voice = pick;
  u.pitch = voice === "soft-f" ? 1.25 : voice === "warm-f" ? 1.08 : voice === "low-m" ? 0.82 : 1.05;
  u.rate = voice === "bright-m" ? 1.08 : 1;
  window.speechSynthesis.speak(u);
}

export function companionDirective(a: SpicyAvatar): string {
  return `Stay in character as ${a.name}, an adult (18+). Appearance: ${a.look || "as the user described"}. Personality/traits: ${a.traits}. Never portray a minor. Speak as them, not as Plethora staff.`;
}
