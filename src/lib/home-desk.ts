const NAME_KEY = "plethora.home.name.v1";

export function loadHomeName(): string {
  if (typeof window === "undefined") return "";
  try {
    return localStorage.getItem(NAME_KEY)?.trim() || "";
  } catch {
    return "";
  }
}

export function saveHomeName(name: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(NAME_KEY, name.trim().slice(0, 40));
}

export function greetingForNow(name?: string): string {
  const h = new Date().getHours();
  const who = name?.trim();
  const hi =
    h < 5 ? "Still up" : h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
  return who ? `${hi}, ${who}` : hi;
}
