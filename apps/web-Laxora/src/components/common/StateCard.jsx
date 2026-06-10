import { AlertCircle, CheckCircle2, Loader2, RefreshCw, WifiOff } from "lucide-react";
import { Button } from "./Button";

const stateIcons = {
  loading: Loader2,
  empty: AlertCircle,
  error: AlertCircle,
  offline: WifiOff,
  permission: AlertCircle,
  retry: RefreshCw,
  success: CheckCircle2,
};

export function StateCard({ state = "empty", title, message, actionLabel = "Try again" }) {
  const Icon = stateIcons[state] || AlertCircle;
  const spin = state === "loading";
  return (
    <section className="surface-card p-6">
      <div className="flex flex-col items-start gap-4 sm:flex-row">
        <div className="rounded-lg bg-blueSoft p-3 text-primary">
          <Icon className={spin ? "h-5 w-5 animate-spin" : "h-5 w-5"} />
        </div>
        <div className="min-w-0 flex-1 break-words">
          <h3 className="text-base font-semibold text-ink">{title}</h3>
          <p className="mt-1 text-sm leading-6 text-muted">{message}</p>
          {["error", "offline", "retry"].includes(state) ? (
            <Button className="mt-4" variant="secondary">
              {actionLabel}
            </Button>
          ) : null}
        </div>
      </div>
    </section>
  );
}
