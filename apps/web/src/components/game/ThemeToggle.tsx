import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/Button";

export type ThemeMode = "light" | "dark";

export function ThemeToggle({ theme, onToggle }: { theme: ThemeMode; onToggle: () => void }) {
  const isDark = theme === "dark";

  return (
    <Button aria-label="Toggle theme" className="theme-toggle" onClick={onToggle} type="button" variant="default">
      {isDark ? <Sun size={17} /> : <Moon size={17} />}
      Theme
    </Button>
  );
}
