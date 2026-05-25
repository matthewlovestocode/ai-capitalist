import { Panel } from "@/components/ui/Panel";

export type ToastMessage = {
  id: number;
  message: string;
};

export function Toast({ toast }: { toast: ToastMessage | null }) {
  if (!toast) return null;

  return (
    <div className="toast-region" aria-live="polite" aria-atomic="true">
      <Panel className="toast-message">{toast.message}</Panel>
    </div>
  );
}
