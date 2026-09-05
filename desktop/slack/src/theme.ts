const THEME_KEY = "plethora.relay.theme.v1";

export type RelayTheme = "dark" | "light";

export function loadTheme(): RelayTheme {
  try {
    const t = localStorage.getItem(THEME_KEY);
    if (t === "light" || t === "dark") return t;
  } catch {
    /* */
  }
  return "dark";
}

export function saveTheme(theme: RelayTheme) {
  localStorage.setItem(THEME_KEY, theme);
  applyTheme(theme);
}

export function applyTheme(theme: RelayTheme) {
  document.documentElement.setAttribute("data-theme", theme);
}
