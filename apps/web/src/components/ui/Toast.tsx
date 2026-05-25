import { Panel } from "@/components/ui/Panel";

export type ToastMessage = {
  id: number;
  message: string;
};

/**
 * Announces transient game feedback in an accessible live region.
 *
 * @param props - The toast message to display, or null when hidden.
 * @returns A toast region when a message is active, otherwise null.
 */
export function Toast({ toast }: { toast: ToastMessage | null }) {
  if (!toast) return null;

  return (
    <div className="toast-region" aria-live="polite" aria-atomic="true">
      <Panel className="toast-message">{toast.message}</Panel>
    </div>
  );
}
