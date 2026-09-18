import { useEffect, useState, useRef } from "react";
import { flushSync } from "react-dom";
import { Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const THEME_STORAGE_KEY = "culiat-theme";

export function ThemeToggle({ className }: { className?: string }) {
  const [isDark, setIsDark] = useState<boolean>(true);
  const [mounted, setMounted] = useState<boolean>(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initialDark = stored ? stored === "dark" : prefersDark;
    setIsDark(initialDark);
    document.documentElement.classList.toggle("dark", initialDark);
  }, []);

  const toggleTheme = () => {
    const nextDark = !isDark;
    const nextTheme = nextDark ? "dark" : "light";

    const applyTheme = () => {
      setIsDark(nextDark);
      document.documentElement.classList.toggle("dark", nextDark);
      localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    };

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Check if View Transition API is supported and motion is allowed
    if (
      typeof document !== "undefined" &&
      "startViewTransition" in document &&
      !prefersReducedMotion &&
      buttonRef.current
    ) {
      const rect = buttonRef.current.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;
      const endRadius = Math.hypot(
        Math.max(x, window.innerWidth - x),
        Math.max(y, window.innerHeight - y)
      );

      const transition = (document as any).startViewTransition(() => {
        flushSync(() => {
          applyTheme();
        });
      });

      transition.ready.then(() => {
        document.documentElement.animate(
          {
            clipPath: [
              `circle(0px at ${x}px ${y}px)`,
              `circle(${endRadius}px at ${x}px ${y}px)`,
            ],
          },
          {
            duration: 1150,
            easing: "cubic-bezier(0.65, 0, 0.35, 1)",
            pseudoElement: "::view-transition-new(root)",
          }
        );
      });
      return;
    }

    // Fallback: Cross-fade class transition
    document.documentElement.classList.add("theme-transition");
    applyTheme();
    window.setTimeout(() => {
      document.documentElement.classList.remove("theme-transition");
    }, 960);
  };

  if (!mounted) {
    return (
      <Button
        variant="icon"
        size="icon"
        aria-label="Toggle light/dark theme"
        className={cn("relative", className)}
      >
        <Moon className="size-5" />
      </Button>
    );
  }

  return (
    <Button
      ref={buttonRef}
      variant="icon"
      size="icon"
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
      title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
      className={cn("relative overflow-hidden cursor-pointer", className)}
    >
      {/* Sun Icon (shown in Dark mode to switch to Light) */}
      <Sun
        className={cn(
          "absolute size-5 transition-all duration-700 [transition-timing-function:var(--ease-theme)] text-amber-400",
          isDark
            ? "rotate-0 scale-100 opacity-100"
            : "rotate-90 scale-0 opacity-0"
        )}
      />
      {/* Moon Icon (shown in Light mode to switch to Dark) */}
      <Moon
        className={cn(
          "absolute size-5 transition-all duration-700 [transition-timing-function:var(--ease-theme)] text-primary",
          !isDark
            ? "rotate-0 scale-100 opacity-100"
            : "-rotate-90 scale-0 opacity-0"
        )}
      />
    </Button>
  );
}
