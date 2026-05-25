import type { ReactNode } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Panel } from "@/components/ui/Panel";

export function Modal({
  children,
  onClose,
  title
}: {
  children: ReactNode;
  onClose: () => void;
  title: string;
}) {
  return (
    <div className="modal-backdrop" role="presentation">
      <Panel aria-modal="true" as="section" className="modal-panel" role="dialog" aria-labelledby="modal-title">
        <div className="modal-heading">
          <h2 id="modal-title">{title}</h2>
          <Button aria-label="Close modal" onClick={onClose} type="button" variant="icon">
            <X size={18} />
          </Button>
        </div>
        {children}
      </Panel>
    </div>
  );
}
