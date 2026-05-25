import type { ReactNode } from "react";

/**
 * Renders a consistent heading row for panels.
 *
 * @param props - Heading icon and title text.
 * @returns A panel heading element.
 */
export function SectionHeader({ icon, title }: { icon: ReactNode; title: string }) {
  return (
    <div className="panel-heading">
      {icon}
      <h2>{title}</h2>
    </div>
  );
}
