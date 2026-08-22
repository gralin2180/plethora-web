/**
 * Owner / tester bypass. Other users keep daily quotas, extra-usage walls,
 * and the 18+ confirm dialog. Hard-block for CSAM/minors still applies to everyone.
 *
 * Set PLETHORA_DEV_EMAILS (comma-separated) and/or PLETHORA_DEV_USER_IDS
 * on Vercel. Local `next dev` is unrestricted so you can test without signing in.
 */
export function isDevUnrestricted(opts: {
  email?: string | null;
  userId?: string | null;
}): boolean {
  if (process.env.PLETHORA_DEV_UNRESTRICTED === "0") return false;
  if (process.env.NODE_ENV !== "production") return true;
  if (process.env.PLETHORA_DEV_UNRESTRICTED === "1") return true;

  const emails = (process.env.PLETHORA_DEV_EMAILS || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  const ids = (process.env.PLETHORA_DEV_USER_IDS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const email = (opts.email || "").trim().toLowerCase();
  if (email && emails.includes(email)) return true;
  if (opts.userId && ids.includes(opts.userId)) return true;
  return false;
}
