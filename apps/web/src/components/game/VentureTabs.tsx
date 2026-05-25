import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/Button";

export type VentureTabId = "operations" | "annotation" | "workers" | "lifestyle";

export type VentureTabConfig = {
  id: VentureTabId;
  icon: LucideIcon;
  label: string;
};

/**
 * Renders the primary game tabs for operations, annotation, workers, and lifestyle.
 *
 * @param props - Active tab id, tab definitions, and change callback.
 * @returns The tab list used above the active panel.
 */
export function VentureTabs({
  activeTab,
  onChange,
  tabs
}: {
  activeTab: VentureTabId;
  onChange: (tab: VentureTabId) => void;
  tabs: readonly VentureTabConfig[];
}) {
  return (
    <div className="tab-bar" role="tablist" aria-label="Venture categories">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <Button
            aria-selected={isActive}
            key={tab.id}
            onClick={() => onChange(tab.id)}
            onPointerDown={() => onChange(tab.id)}
            role="tab"
            type="button"
            variant="tab"
          >
            <Icon size={16} />
            {tab.label}
          </Button>
        );
      })}
    </div>
  );
}
