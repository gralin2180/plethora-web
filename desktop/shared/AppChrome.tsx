import type { ReactNode } from "react";
import type { AppTheme } from "./theme";

type Props = {
  name: string;
  tagline: string;
  letter: string;
  accent?: string;
  theme: AppTheme;
  onThemeToggle: () => void;
  actions?: ReactNode;
  children: ReactNode;
  aiFab?: ReactNode;
};

export function AppChrome({ name, tagline, letter, accent = "#8b5cf6", theme, onThemeToggle, actions, children, aiFab }: Props) {
  return (
    <div className="app" style={{ ["--app-accent" as string]: accent }}>
      <header className="topbar">
        <div className="logo">{letter}</div>
        <div className="topbar-text">
          <h1>{name}</h1>
          <p>{tagline}</p>
        </div>
        <div className="topbar-actions">
          {actions}
          <button type="button" className="btn btn-ghost" onClick={onThemeToggle}>
            {theme === "dark" ? "☀ Light" : "☾ Dark"}
          </button>
        </div>
      </header>
      {children}
      {aiFab}
    </div>
  );
}
