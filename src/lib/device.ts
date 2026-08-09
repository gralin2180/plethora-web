/**
 * Device fingerprint (browser) — not hardware-secure, good enough for soft seat limits.
 */

const KEY = "Plethora.deviceKey.v1";

export function getOrCreateDeviceKey(): string {
  if (typeof window === "undefined") return "server";
  try {
    let k = localStorage.getItem(KEY);
    if (!k) {
      k =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `d_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      localStorage.setItem(KEY, k);
    }
    return k;
  } catch {
    return `ephemeral_${Date.now()}`;
  }
}

export function guessDeviceLabel(): string {
  if (typeof navigator === "undefined") return "Unknown device";
  const ua = navigator.userAgent;
  if (/iPhone|iPad/i.test(ua)) return "Apple mobile";
  if (/Android/i.test(ua)) return "Android";
  if (/Mac/i.test(ua)) return "Mac browser";
  if (/Windows/i.test(ua)) return "Windows browser";
  if (/Linux/i.test(ua)) return "Linux browser";
  return "Browser";
}
