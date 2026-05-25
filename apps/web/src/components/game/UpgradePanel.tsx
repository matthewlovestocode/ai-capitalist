import { BrainCircuit, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Panel } from "@/components/ui/Panel";
import { SectionHeader } from "@/components/ui/SectionHeader";
import type { LayoffProgram, Upgrade } from "@/lib/game";
import { formatCapacity, formatMoney } from "@/lib/game";

/**
 * Shows purchasable upgrades in the Zusk levers drawer.
 *
 * @param props - Player cash, upgrade list, purchase callback, and optional close callback.
 * @returns The upgrade drawer panel.
 */
export function UpgradePanel({
  cash,
  layoffPrograms,
  operationsEmployeeCount,
  onClose,
  onBuyUpgrade,
  onRunLayoffProgram,
  purchasedLayoffProgramIds,
  zuskCapacity,
  upgrades
}: {
  cash: number;
  layoffPrograms: LayoffProgram[];
  operationsEmployeeCount: number;
  onClose?: () => void;
  onBuyUpgrade: (id: string) => void;
  onRunLayoffProgram: (id: string) => void;
  purchasedLayoffProgramIds: string[];
  zuskCapacity: number;
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
      <div className="capacity-panel">
        <span>Zusk capacity</span>
        <strong>{formatCapacity(zuskCapacity)}</strong>
        <small>Manual layoff programs unlock as model-training capacity grows.</small>
      </div>
      <div className="lever-section">
        <h3>Layoff Programs</h3>
        {layoffPrograms.map((program) => {
          const purchased = purchasedLayoffProgramIds.includes(program.id);
          const capacityLocked = zuskCapacity < program.requiredCapacity;
          const noEmployees = operationsEmployeeCount === 0;
          const disabled = purchased || capacityLocked || noEmployees;

          return (
            <Button
              className="upgrade-row layoff-row"
              disabled={disabled}
              key={program.id}
              onClick={() => onRunLayoffProgram(program.id)}
              type="button"
            >
              <span>
                <strong>{program.name}</strong>
                <small>{program.description}</small>
                <small>
                  Requires {formatCapacity(program.requiredCapacity)} capacity. Targets up to{" "}
                  {program.employeeTarget.toLocaleString()} employees.
                </small>
              </span>
              <b>{purchased ? "Done" : capacityLocked ? "Locked" : "Execute"}</b>
            </Button>
          );
        })}
      </div>
      <div className="lever-section">
        <h3>Upgrades</h3>
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
      </div>
    </Panel>
  );
}
