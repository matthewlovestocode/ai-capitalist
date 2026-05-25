import { UserX } from "lucide-react";
import { Panel } from "@/components/ui/Panel";
import { SectionHeader } from "@/components/ui/SectionHeader";
import type { Employee } from "@/lib/game";

/**
 * Displays displaced workers awaiting annotation work.
 *
 * @param props - Unemployed workers to show.
 * @returns The unemployed workers panel.
 */
export function UnemployedPanel({ workers }: { workers: Employee[] }) {
  return (
    <Panel as="section" className="unemployed-panel" aria-label="Unemployed workers">
      <SectionHeader icon={<UserX size={20} />} title="Unemployed Workers" />
      {workers.length > 0 ? (
        <div className="employee-list">
          {workers.slice(0, 12).map((employee) => (
            <div className="employee-row" key={employee.id}>
              <span>
                <strong>{employee.name}</strong>
                <small>Formerly {employee.formerVenture ?? employee.role}</small>
              </span>
              <b>Awaiting annotation</b>
            </div>
          ))}
        </div>
      ) : (
        <p className="empty-budget">No displaced employees yet. Automating a venture will move its staff here.</p>
      )}
    </Panel>
  );
}
