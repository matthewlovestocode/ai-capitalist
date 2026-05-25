import type { ReactNode } from "react";
import { Panel } from "@/components/ui/Panel";

/**
 * Displays one compact game statistic with an icon, label, and formatted value.
 *
 * @param props - Icon, label, and value to render.
 * @returns A stat card for the dashboard summary grid.
 */
export function StatCard({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <Panel className="stat">
      {icon}
      <span>{label}</span>
      <strong>{value}</strong>
    </Panel>
  );
}
