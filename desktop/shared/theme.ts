const THEME_KEY = "plethora.office.theme.v1";

export type AppTheme = "dark" | "light";

export function loadTheme(): AppTheme {
  try {
    const t = localStorage.getItem(THEME_KEY);
    if (t === "light" || t === "dark") return t;
  } catch {
    /* */
  }
  return "dark";
}

export function saveTheme(theme: AppTheme) {
  localStorage.setItem(THEME_KEY, theme);
  applyTheme(theme);
}

export function applyTheme(theme: AppTheme) {
  document.documentElement.setAttribute("data-theme", theme);
}
