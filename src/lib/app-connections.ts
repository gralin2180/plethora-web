/**
 * Per-browser connection flags + optional secrets (never uploaded by default).
 */

export type AppConnectionState = {
  connected: boolean;
  note?: string;
  /** Opaque personal token / bot secret — local only */
  token?: string;
  updatedAt: string;
};

const KEY = "plethora.appConnections.v1";

export function loadConnections(): Record<string, AppConnectionState> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, AppConnectionState>;
  } catch {
    return {};
  }
}

export function saveConnections(map: Record<string, AppConnectionState>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(map));
}

export function setConnection(
  appId: string,
  patch: Partial<AppConnectionState>
): Record<string, AppConnectionState> {
  const map = loadConnections();
  const prev = map[appId] || { connected: false, updatedAt: new Date().toISOString() };
  map[appId] = {
    ...prev,
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  saveConnections(map);
  return map;
}

export function clearConnection(appId: string) {
  const map = loadConnections();
  delete map[appId];
  saveConnections(map);
  return map;
}

export function connectionSummary(map: Record<string, AppConnectionState>) {
  const ids = Object.keys(map).filter((id) => map[id]?.connected);
  return { count: ids.length, ids };
}
