/** Which free models appear in the chat picker (OpenCode-style manage toggles). */
export const ENABLED_MODELS_KEY = "plethora.enabled-models.v1";

export function modelToggleKey(source: "zen" | "openrouter", id: string): string {
  return `${source}:${id}`;
}

export function loadDisabledModelKeys(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(ENABLED_MODELS_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw) as string[];
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

/** Returns true if model should show in picker */
export function isModelEnabled(source: "zen" | "openrouter", id: string): boolean {
  return !loadDisabledModelKeys().has(modelToggleKey(source, id));
}

export function setModelEnabled(source: "zen" | "openrouter", id: string, enabled: boolean) {
  const key = modelToggleKey(source, id);
  const disabled = loadDisabledModelKeys();
  if (enabled) disabled.delete(key);
  else disabled.add(key);
  localStorage.setItem(ENABLED_MODELS_KEY, JSON.stringify([...disabled]));
  window.dispatchEvent(new CustomEvent("plethora:models-updated"));
}

export function filterEnabledModels<T extends { id: string; source: "zen" | "openrouter" }>(
  list: T[]
): T[] {
  return list.filter((m) => isModelEnabled(m.source, m.id));
}
