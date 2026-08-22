import type { User } from "@supabase/supabase-js";

const STORAGE_PREFIX = "plethora.avatar.v1.";

function firstHttpUrl(...vals: unknown[]): string | null {
  for (const v of vals) {
    if (typeof v === "string" && /^https?:\/\//i.test(v.trim())) return v.trim();
  }
  return null;
}

/** Google / Apple / GitHub put the photo on metadata or the identity record. */
export function oauthAvatarUrl(user: User | null | undefined): string | null {
  if (!user) return null;
  const meta = (user.user_metadata || {}) as Record<string, unknown>;
  const fromMeta = firstHttpUrl(
    meta.avatar_url,
    meta.picture,
    meta.avatar,
    meta.profile_image_url
  );
  if (fromMeta) return fromMeta;
  for (const id of user.identities || []) {
    const d = (id.identity_data || {}) as Record<string, unknown>;
    const fromId = firstHttpUrl(d.avatar_url, d.picture, d.avatar);
    if (fromId) return fromId;
  }
  return null;
}

export function loadCustomAvatar(userId: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    const v = localStorage.getItem(STORAGE_PREFIX + userId);
    return v && v.startsWith("data:image/") ? v : null;
  } catch {
    return null;
  }
}

export function saveCustomAvatar(userId: string, dataUrl: string | null) {
  try {
    if (!dataUrl) localStorage.removeItem(STORAGE_PREFIX + userId);
    else localStorage.setItem(STORAGE_PREFIX + userId, dataUrl);
  } catch {
    /* quota */
  }
}

export function displayName(user: User): string {
  const meta = (user.user_metadata || {}) as Record<string, unknown>;
  const name =
    (typeof meta.full_name === "string" && meta.full_name) ||
    (typeof meta.name === "string" && meta.name) ||
    user.email?.split("@")[0] ||
    "Account";
  return name;
}

/** Shrink a picked image so it fits localStorage. */
export function fileToAvatarDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const size = 128;
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("canvas"));
        return;
      }
      const min = Math.min(img.width, img.height);
      const sx = (img.width - min) / 2;
      const sy = (img.height - min) / 2;
      ctx.drawImage(img, sx, sy, min, min, 0, 0, size, size);
      resolve(canvas.toDataURL("image/jpeg", 0.85));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("image"));
    };
    img.src = url;
  });
}
