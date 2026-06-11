import { X } from "lucide-react";
import { Button } from "./Button";

export function Dialog({ children, isOpen = true, onClose, title }) {
  if (!isOpen) return null;
  return (
    <div className="rounded-lg border border-border bg-panel shadow-soft">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <h3 className="font-bold text-primary">{title}</h3>
        <Button aria-label="Close" onClick={onClose} size="icon" type="button" variant="ghost">
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}
