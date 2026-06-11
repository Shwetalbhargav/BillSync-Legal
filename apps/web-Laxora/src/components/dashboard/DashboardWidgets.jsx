import { AlertCircle, CheckCircle2, Clock3, Search, Settings } from "lucide-react";
import { Card, CardBody, CardHeader, StatusBadge } from "../common";

const statusTone = {
  working: "success",
  "needs-attention": "warning",
  "not-configured": "neutral",
  "review-only": "accent",
  optional: "neutral",
};

export function MetricCard({ icon: Icon = Clock3, label, value, hint }) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wide text-muted">{label}</p>
          <p className="mt-2 text-2xl font-bold text-primary">{value}</p>
          {hint ? <p className="mt-1 text-sm leading-6 text-muted">{hint}</p> : null}
        </div>
        <div className="rounded-lg bg-blueSoft p-3 text-primary">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Card>
  );
}

export function SetupCard({ item }) {
  const isReady = item.status === "working";
  return (
    <Card className="p-4">
      <div className="flex items-start gap-3">
        <div className={`rounded-lg p-2 ${isReady ? "bg-success/10 text-success" : "bg-blueSoft text-primary"}`}>
          {isReady ? <CheckCircle2 className="h-5 w-5" /> : <Settings className="h-5 w-5" />}
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-bold text-ink">{item.title}</h3>
            <StatusBadge tone={statusTone[item.status] || "neutral"}>{item.status.replace("-", " ")}</StatusBadge>
          </div>
          <p className="mt-2 text-sm leading-6 text-muted">{item.message}</p>
        </div>
      </div>
    </Card>
  );
}

export function ListPanel({ emptyMessage, items, title, type = "matter" }) {
  return (
    <Card>
      <CardHeader title={title} description={items.length ? "Latest workspace items ready for review." : emptyMessage} />
      <CardBody className="space-y-3">
        {items.length ? (
          items.map((item) => (
            <div className="rounded-lg border border-border p-3" key={item.id || item.title || item.name}>
              <p className="text-sm font-bold text-ink">{item.title || item.name || item.description}</p>
              <p className="mt-1 text-xs font-semibold text-muted">
                {type === "client" ? item.email || item.phone || "Contact details not added yet" : item.status || item.client || "Ready for review"}
              </p>
            </div>
          ))
        ) : (
          <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted">{emptyMessage}</div>
        )}
      </CardBody>
    </Card>
  );
}

export function NotificationItem({ item }) {
  return (
    <div className="flex gap-3 rounded-lg border border-border bg-panel p-4">
      <div className="rounded-lg bg-blueSoft p-2 text-primary">
        <AlertCircle className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-sm font-bold text-ink">{item.title}</h3>
          <StatusBadge tone={item.tone || "neutral"}>{item.tone === "warning" ? "needs review" : "info"}</StatusBadge>
        </div>
        <p className="mt-1 text-sm leading-6 text-muted">{item.message}</p>
      </div>
    </div>
  );
}

export function SearchResultGroup({ emptyText, items, title }) {
  return (
    <Card>
      <CardHeader title={title} action={<StatusBadge>{items.length}</StatusBadge>} />
      <CardBody className="space-y-3">
        {items.length ? (
          items.map((item) => (
            <div className="rounded-lg border border-border p-3" key={item.id || item.title || item.name}>
              <p className="text-sm font-bold text-ink">{item.title || item.name}</p>
              <p className="mt-1 text-xs font-semibold text-muted">{item.client || item.status || item.email || "Ready to open"}</p>
            </div>
          ))
        ) : (
          <div className="flex items-center gap-2 rounded-lg border border-dashed border-border p-4 text-sm text-muted">
            <Search className="h-4 w-4" />
            {emptyText}
          </div>
        )}
      </CardBody>
    </Card>
  );
}
