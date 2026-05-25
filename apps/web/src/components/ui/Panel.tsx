import type { HTMLAttributes, ReactNode } from "react";

type PanelProps = HTMLAttributes<HTMLElement> & {
  as?: "article" | "aside" | "div" | "section";
  children: ReactNode;
};

/**
 * Provides the shared panel surface while allowing the semantic element to vary.
 *
 * @param props - Element type, children, class name, and native HTML attributes.
 * @returns A styled panel primitive.
 */
export function Panel({ as: Component = "div", children, className = "", ...props }: PanelProps) {
  return (
    <Component className={`ui-panel ${className}`.trim()} {...props}>
      {children}
    </Component>
  );
}
