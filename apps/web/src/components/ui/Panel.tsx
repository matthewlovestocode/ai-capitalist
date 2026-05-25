import type { HTMLAttributes, ReactNode } from "react";

type PanelProps = HTMLAttributes<HTMLElement> & {
  as?: "article" | "aside" | "div" | "section";
  children: ReactNode;
};

export function Panel({ as: Component = "div", children, className = "", ...props }: PanelProps) {
  return (
    <Component className={`ui-panel ${className}`.trim()} {...props}>
      {children}
    </Component>
  );
}
