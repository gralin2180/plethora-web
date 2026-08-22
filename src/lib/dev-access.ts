import type { User } from "@supabase/supabase-js";

function splitEmails(raw: string | undefined): string[] {
  return (raw || "")
    .split(/[,;\s]+/)
    .map((s) => s.trim().toLowerCase())
    .filter((s) => s.includes("@"));
}

function envEmailList(): string[] {
  return [
    ...splitEmails(process.env.PLETHORA_DEV_EMAILS),
    ...splitEmails(process.env.ADMIN_EMAIL),
    ...splitEmails(process.env.ADMIN_EMAILS),
    ...splitEmails(process.env.PLETHORA_ADMIN_EMAIL),
  ];
}

export function emailsFromAuthUser(user: User | null | undefined): string[] {
  if (!user) return [];
  const out = new Set<string>();
  if (user.email) out.add(user.email.trim().toLowerCase());
  for (const id of user.identities || []) {
    const d = (id.identity_data || {}) as Record<string, unknown>;
    for (const k of ["email", "preferred_username"]) {
      const v = d[k];
      if (typeof v === "string" && v.includes("@")) out.add(v.trim().toLowerCase());
    }
  }
  return [...out];
}

/**
 * Owner / tester bypass. Other users keep daily quotas.
 * Accepts PLETHORA_DEV_EMAILS, ADMIN_EMAIL, ADMIN_EMAILS, PLETHORA_ADMIN_EMAIL.
 */
export function isDevUnrestricted(opts: {
  email?: string | null;
  userId?: string | null;
  emails?: string[];
}): boolean {
  if (process.env.PLETHORA_DEV_UNRESTRICTED === "0") return false;
  if (process.env.NODE_ENV !== "production") return true;
  if (process.env.PLETHORA_DEV_UNRESTRICTED === "1") return true;

  const allow = envEmailList();
  const ids = (process.env.PLETHORA_DEV_USER_IDS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const candidates = [
    ...(opts.emails || []),
    opts.email || "",
  ]
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  for (const email of candidates) {
    if (allow.includes(email)) return true;
  }
  if (opts.userId && ids.includes(opts.userId)) return true;
  return false;
}
