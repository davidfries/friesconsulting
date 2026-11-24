import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const current = document.documentElement.dataset.theme === "dark" ? "dark" : "light";
    setTheme(current);
  }, []);

  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("fcs-theme", next);
    } catch {
      // Ignore storage errors in private browsing modes.
    }
  };

  return (
    <button
      type="button"
      className="icon-btn"
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
      aria-pressed={theme === "dark"}
    >
      <span aria-hidden="true">{theme === "light" ? "☾" : "☀"}</span>
      <span className="theme-btn__label">{theme === "light" ? "Dark" : "Light"}</span>
    </button>
  );
}
