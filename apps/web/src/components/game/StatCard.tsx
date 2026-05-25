import type { ReactNode } from "react";
import { Panel } from "@/components/ui/Panel";

export function StatCard({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <Panel className="stat">
      {icon}
      <span>{label}</span>
      <strong>{value}</strong>
    </Panel>
  );
}
