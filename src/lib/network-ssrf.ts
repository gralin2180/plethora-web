/** Shared guards for outbound network tools (SSRF-safe hosts only). */

const BLOCKED_HOSTS = new Set([
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "::1",
  "metadata.google.internal",
  "metadata",
]);

export function isPrivateOrLocalIp(hostname: string): boolean {
  const h = hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (BLOCKED_HOSTS.has(h)) return true;
  if (h.endsWith(".local") || h.endsWith(".internal") || h.endsWith(".localhost")) return true;

  // IPv4
  const m = h.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (m) {
    const [a, b] = [Number(m[1]), Number(m[2])];
    if (a === 10) return true;
    if (a === 127) return true;
    if (a === 0) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
  }

  // crude IPv6 local / link-local
  if (h.startsWith("fc") || h.startsWith("fd") || h.startsWith("fe80") || h === "::") return true;
  return false;
}

export function parsePublicHttpUrl(input: string): URL | null {
  let raw = input.trim();
  if (!raw) return null;
  if (!/^https?:\/\//i.test(raw)) {
    // host only or host/path
    raw = `https://${raw}`;
  }
  try {
    const url = new URL(raw);
    if (!["http:", "https:"].includes(url.protocol)) return null;
    if (!url.hostname) return null;
    if (isPrivateOrLocalIp(url.hostname)) return null;
    return url;
  } catch {
    return null;
  }
}

export function sanitizeHostname(input: string): string | null {
  const cleaned = input.trim().toLowerCase().replace(/^https?:\/\//, "").split("/")[0]?.split(":")[0];
  if (!cleaned || !/^[a-z0-9.-]+$/i.test(cleaned) || cleaned.length > 253) return null;
  if (isPrivateOrLocalIp(cleaned)) return null;
  return cleaned;
}
