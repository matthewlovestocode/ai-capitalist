import { BrainCircuit, Menu, RotateCcw, Settings } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Panel } from "@/components/ui/Panel";

export function TopNav({
  isMenuOpen,
  onOpenOptions,
  onOpenReset,
  onOpenUpgrades,
  onToggleMenu
}: {
  isMenuOpen: boolean;
  onOpenOptions: () => void;
  onOpenReset: () => void;
  onOpenUpgrades: () => void;
  onToggleMenu: () => void;
}) {
  return (
    <nav className="top-nav" aria-label="Top navigation">
      <div className="top-nav-brand">
        <strong>AI Capitalist</strong>
        <span>Job Killer</span>
      </div>
      <div className="top-nav-actions">
        <Button onClick={onOpenUpgrades} type="button">
          <BrainCircuit size={18} />
          Upgrades
        </Button>
        <div className="nav-menu-wrap">
          <Button aria-expanded={isMenuOpen} aria-haspopup="menu" onClick={onToggleMenu} type="button">
            <Menu size={18} />
            Menu
          </Button>
          <Panel className="nav-dropdown" role="menu" aria-hidden={!isMenuOpen}>
            <button onClick={onOpenOptions} role="menuitem" type="button">
              <Settings size={16} />
              Options
            </button>
            <button onClick={onOpenReset} role="menuitem" type="button">
              <RotateCcw size={16} />
              Reset game
            </button>
          </Panel>
        </div>
      </div>
    </nav>
  );
}
