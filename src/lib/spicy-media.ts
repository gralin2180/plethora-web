/**
 * Spicy chat media: Pollinations Flux (image) + openai-audio (TTS).
 * Adults only — callers must already pass content-safety.
 * Docs: https://github.com/pollinations/pollinations/blob/master/APIDOCS.md
 */

type Voice = "soft-f" | "warm-f" | "low-m" | "bright-m";

const IMAGE_HOST = "https://image.pollinations.ai/prompt";
const AUDIO_HOST = "https://text.pollinations.ai";

const VOICE_MAP: Record<Voice, string> = {
  "soft-f": "shimmer",
  "warm-f": "nova",
  "low-m": "onyx",
  "bright-m": "echo",
};

export function pollinationsVoice(voice: Voice): string {
  return VOICE_MAP[voice] || "nova";
}

export function spicyPortraitPrompt(look: string, name?: string): string {
  const who = name ? `${name}, ` : "";
  return [
    `photorealistic portrait of ${who}an adult 21+ person`,
    look || "attractive adult, cinematic",
    "upper body, sharp focus, studio lighting, not a minor, not childlike",
  ].join(", ");
}

export function spicyScenePrompt(look: string, scene: string): string {
  return [
    "cinematic still, consenting adults 21+ only",
    look,
    scene.slice(0, 280),
    "tasteful composition, not a minor",
  ]
    .filter(Boolean)
    .join(", ");
}

export function spicyImageUrl(prompt: string, seed?: number): string {
  const p = encodeURIComponent(prompt.slice(0, 700));
  const s = seed ?? Math.floor(Math.random() * 1e9);
  return `${IMAGE_HOST}/${p}?model=flux&nologo=true&private=true&enhance=true&safe=false&seed=${s}&width=768&height=1024`;
}

export function spicyTtsUrl(text: string, voice: Voice): string {
  const t = encodeURIComponent(text.replace(/\s+/g, " ").trim().slice(0, 400));
  return `${AUDIO_HOST}/${t}?model=openai-audio&voice=${pollinationsVoice(voice)}`;
}

export function playSpicyTts(text: string, voice: Voice): HTMLAudioElement | null {
  if (typeof window === "undefined") return null;
  const audio = new Audio(spicyTtsUrl(text, voice));
  audio.play().catch(() => {
    /* browser may block autoplay; caller falls back to speechSynthesis */
  });
  return audio;
}
