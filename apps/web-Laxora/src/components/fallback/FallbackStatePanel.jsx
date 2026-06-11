import clsx from "clsx";
import { AlertCircle, CheckCircle2, Loader2, RefreshCw, ShieldAlert, WifiOff } from "lucide-react";
import { Button } from "../common/Button";
import { Progress } from "../common/Progress";
import { Skeleton } from "../common/Skeleton";
import { StatusBadge } from "../common/StatusBadge";

const kindIcon = {
  empty: AlertCircle,
  error: AlertCircle,
  loading: Loader2,
  offline: WifiOff,
  permission: ShieldAlert,
  success: CheckCircle2,
  unavailable: AlertCircle,
};

const kindTone = {
  empty: "neutral",
  error: "danger",
  loading: "accent",
  offline: "warning",
  permission: "warning",
  success: "success",
  unavailable: "neutral",
};

function StateAnimation({ animation, progress }) {
  if (animation === "progress") {
    return <Progress label="Progress" value={progress || 50} />;
  }

  if (animation === "shimmer") {
    return (
      <div className="space-y-2">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-4/5" />
      </div>
    );
  }

  if (animation === "waveform") {
    return (
      <div className="flex h-12 items-end gap-1 rounded-lg bg-blueSoft p-3">
        {[18, 28, 16, 34, 22, 38, 20, 30].map((height, index) => (
          <span
            className="w-2 rounded-full bg-accent motion-safe:animate-pulse"
            key={height + index}
            style={{ height, animationDelay: `${index * 90}ms` }}
          />
        ))}
      </div>
    );
  }

  if (animation === "check") {
    return (
      <div className="inline-flex items-center gap-2 rounded-lg bg-success/10 px-3 py-2 text-sm font-semibold text-success">
        <CheckCircle2 className="h-4 w-4 motion-safe:animate-pulse" />
        Connected
      </div>
    );
  }

  if (animation === "payment" || animation === "spinner") {
    return (
      <div className="inline-flex items-center gap-2 rounded-lg bg-blueSoft px-3 py-2 text-sm font-semibold text-primary">
        <Loader2 className="h-4 w-4 animate-spin" />
        Checking status
      </div>
    );
  }

  return null;
}

export function FallbackStatePanel({ actionMode = "buttons", className, icon: RouteIcon, state }) {
  const Icon = RouteIcon || kindIcon[state.kind] || AlertCircle;
  const tone = kindTone[state.kind] || "neutral";
  const isLoading = state.kind === "loading";

  return (
    <section className={clsx("surface-card min-w-0 p-5", className)}>
      <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-blueSoft text-primary">
          <Icon className={clsx("h-6 w-6", isLoading && "animate-spin")} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge tone={tone}>{state.group}</StatusBadge>
            <span className="text-xs font-semibold uppercase tracking-wide text-muted">{state.kind}</span>
          </div>
          <h2 className="mt-3 text-xl font-bold text-primary">{state.title}</h2>
          <p className="mt-2 text-sm leading-6 text-muted">{state.message}</p>

          {state.animation ? (
            <div className="mt-4">
              <StateAnimation animation={state.animation} progress={state.progress} />
            </div>
          ) : null}

          {actionMode === "buttons" ? (
            <div className="mt-5 grid gap-2 sm:flex sm:flex-wrap">
              <Button className="w-full sm:w-auto" type="button" variant={state.kind === "error" ? "danger" : "primary"}>
                {state.primaryAction}
              </Button>
              <Button className="w-full sm:w-auto" type="button" variant="secondary">
                <RefreshCw className="h-4 w-4" />
                {state.secondaryAction}
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
