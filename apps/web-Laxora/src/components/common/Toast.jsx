import { CheckCircle2, Info, TriangleAlert } from "lucide-react";

const icons = {
  info: Info,
  success: CheckCircle2,
  warning: TriangleAlert,
};

export function Toast({ message, tone = "info", title }) {
  const Icon = icons[tone] || Info;
  return (
    <div className="flex items-start gap-3 rounded-lg border border-border bg-panel p-4 shadow-soft" role="status" aria-live="polite">
      <Icon className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
      <div className="min-w-0">
        <p className="safe-text font-semibold text-ink">{title}</p>
        <p className="mt-1 text-sm text-muted">{message}</p>
      </div>
    </div>
  );
}
