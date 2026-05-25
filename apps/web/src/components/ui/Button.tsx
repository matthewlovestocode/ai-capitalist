import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "default" | "primary" | "dark" | "tab" | "icon";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: ButtonVariant;
};

/**
 * Applies shared button styling while preserving native button props.
 *
 * @param props - Button contents, variant, class name, and native button attributes.
 * @returns A styled button primitive.
 */
export function Button({ children, className = "", variant = "default", ...props }: ButtonProps) {
  return (
    <button className={`ui-button ui-button-${variant} ${className}`.trim()} {...props}>
      {children}
    </button>
  );
}
