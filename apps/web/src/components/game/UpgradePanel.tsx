import { BrainCircuit, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Panel } from "@/components/ui/Panel";
import { SectionHeader } from "@/components/ui/SectionHeader";
import type { Upgrade } from "@/lib/game";
import { formatMoney } from "@/lib/game";

export function UpgradePanel({
  cash,
  onClose,
  onBuyUpgrade,
  upgrades
}: {
  cash: number;
  onClose?: () => void;
  onBuyUpgrade: (id: string) => void;
  upgrades: Upgrade[];
}) {
  return (
    <Panel as="aside" className="upgrade-panel">
      <div className="drawer-heading">
        <SectionHeader icon={<BrainCircuit size={20} />} title="Zusk Levers" />
        {onClose ? (
          <Button aria-label="Close upgrades" onClick={onClose} type="button" variant="icon">
            <X size={18} />
          </Button>
        ) : null}
      </div>
      {upgrades.map((upgrade) => (
        <Button
          className="upgrade-row"
          key={upgrade.id}
          onClick={() => onBuyUpgrade(upgrade.id)}
          disabled={upgrade.purchased || cash < upgrade.cost}
        >
          <span>
            <strong>{upgrade.name}</strong>
            <small>{upgrade.description}</small>
          </span>
          <b>{upgrade.purchased ? "Bought" : formatMoney(upgrade.cost)}</b>
        </Button>
      ))}
    </Panel>
  );
}
