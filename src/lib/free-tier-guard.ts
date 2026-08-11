/**
 * Global free-tier protection — many concurrent users must not melt platform keys.
 * In-memory on each serverless instance + daily RPC counters when SQL is applied.
 */

type Slot = { count: number; resetAt: number };

const minuteSlots = new Map<string, Slot>();
const concurrent = { n: 0 };

function slotKey(bucket: string, windowMs: number): string {
  return `${bucket}:${Math.floor(Date.now() / windowMs)}`;
}

function take(bucket: string, limit: number, windowMs: number): boolean {
  const key = slotKey(bucket, windowMs);
  const now = Date.now();
  let s = minuteSlots.get(key);
  if (!s || s.resetAt < now) {
    s = { count: 0, resetAt: now + windowMs };
    minuteSlots.set(key, s);
  }
  // prune old keys occasionally
  if (minuteSlots.size > 200) {
    for (const [k, v] of minuteSlots) {
      if (v.resetAt < now) minuteSlots.delete(k);
    }
  }
  if (s.count >= limit) return false;
  s.count += 1;
  return true;
}

export type FreeTierGateResult =
  | { ok: true; load: "normal" | "elevated" | "hot" }
  | { ok: false; reason: string; code: "global_rate" | "global_daily" | "busy" };

/**
 * Call before spending the platform free key (not BYOK, not prepaid premium).
 */
export function assertPlatformFreeCapacity(): FreeTierGateResult {
  const perMinute = Math.max(
    10,
    Number(process.env.FREE_PLATFORM_RPM || process.env.PLETHORA_FREE_RPM || 90)
  );
  const maxConcurrent = Math.max(
    5,
    Number(process.env.FREE_PLATFORM_CONCURRENT || process.env.PLETHORA_FREE_CONCURRENT || 40)
  );

  if (concurrent.n >= maxConcurrent) {
    return {
      ok: false,
      code: "busy",
      reason:
        "Free AI is busy serving others — try again in a few seconds, sign in for a fair seat, upgrade, or use Settings → AI keys (BYOK).",
    };
  }

  if (!take("free_global", perMinute, 60_000)) {
    return {
      ok: false,
      code: "global_rate",
      reason:
        "Free AI is rate-limited system-wide for fairness. Wait a minute, use BYOK, or grab a Pro / trial pack for premium capacity.",
    };
  }

  const load: "normal" | "elevated" | "hot" =
    concurrent.n > maxConcurrent * 0.75
      ? "hot"
      : concurrent.n > maxConcurrent * 0.4
        ? "elevated"
        : "normal";

  return { ok: true, load };
}

export async function withPlatformFreeSlot<T>(fn: () => Promise<T>): Promise<T> {
  concurrent.n += 1;
  try {
    return await fn();
  } finally {
    concurrent.n = Math.max(0, concurrent.n - 1);
  }
}

/** Soft daily ceiling for entire product free pool (shared key protection). */
export function freePlatformDailyHardCap(): number {
  return Math.max(
    100,
    Number(process.env.FREE_PLATFORM_DAILY_MAX || process.env.PLETHORA_FREE_DAILY_MAX || 8000)
  );
}
