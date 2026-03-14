import { useState, useEffect } from "react";
import { Moon, Sun } from "lucide-react";

const useTheme = () => {
  const [dark, setDark] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("theme") === "dark" ||
      (!localStorage.getItem("theme") && window.matchMedia("(prefers-color-scheme: dark)").matches);
  });

  useEffect(() => {
    const root = document.documentElement;
    if (dark) {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [dark]);

  return { dark, toggle: () => setDark((d) => !d) };
};

const ThemeToggle = () => {
  const { dark, toggle } = useTheme();

  return (
    <button
      onClick={toggle}
      className="flex items-center justify-between rounded-2xl border border-border bg-card p-4"
    >
      <div className="flex items-center gap-3">
        {dark ? <Moon className="h-5 w-5 text-primary" /> : <Sun className="h-5 w-5 text-primary" />}
        <div>
          <p className="text-sm font-medium text-foreground">Dark Mode</p>
          <p className="text-xs text-muted-foreground">{dark ? "On" : "Off"}</p>
        </div>
      </div>
      <div
        className={`relative h-6 w-11 rounded-full transition-colors ${dark ? "bg-primary" : "bg-muted"}`}
      >
        <div
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-primary-foreground shadow transition-transform ${
            dark ? "translate-x-5" : "translate-x-0.5"
          }`}
        />
      </div>
    </button>
  );
};

export default ThemeToggle;
