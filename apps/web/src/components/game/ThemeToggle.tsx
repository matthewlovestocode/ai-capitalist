import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/Button";

export type ThemeMode = "light" | "dark";

/**
 * Toggles the UI between light and dark themes.
 *
 * @param props - Current theme mode and toggle callback.
 * @returns A theme toggle button.
 */
export function ThemeToggle({ theme, onToggle }: { theme: ThemeMode; onToggle: () => void }) {
  const isDark = theme === "dark";

  return (
    <Button aria-label="Toggle theme" className="theme-toggle" onClick={onToggle} type="button" variant="default">
      {isDark ? <Sun size={17} /> : <Moon size={17} />}
      Theme
    </Button>
  );
}
