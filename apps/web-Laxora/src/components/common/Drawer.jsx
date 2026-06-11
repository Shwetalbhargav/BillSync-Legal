import { X } from "lucide-react";
import { Button } from "./Button";

export function Drawer({ children, title }) {
  return (
    <aside className="surface-card max-w-md">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <h3 className="font-bold text-primary">{title}</h3>
        <Button aria-label="Close drawer" size="icon" type="button" variant="ghost">
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div className="space-y-4 p-5">{children}</div>
    </aside>
  );
}
