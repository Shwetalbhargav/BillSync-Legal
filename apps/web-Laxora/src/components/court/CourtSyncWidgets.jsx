import { Link } from "react-router-dom";
import { AlertCircle, CalendarClock, CheckCircle2, Gavel, Link2, RefreshCw, Settings, WifiOff } from "lucide-react";
import { Button, Card, CardBody, CardHeader, DataTable, StateCard, StatusBadge } from "../common";
import { formatDateTime } from "../calendar/CalendarWidgets";

export function CourtSyncHero({ title = "Court daily sync" }) {
  return (
    <section className="surface-card p-6">
      <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold uppercase tracking-wide text-accent">Court Sync</p>
          <h1 className="mt-1 text-2xl font-bold text-primary md:text-3xl">{title}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
            Review live court feed readiness separately from manually recorded hearing work.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Link className="focus-ring inline-flex justify-center rounded-lg border border-border px-4 py-2 text-sm font-semibold text-primary hover:bg-blueSoft" to="/app/hearings/manual-time">
            Add manual hearing
          </Link>
          <Link className="focus-ring inline-flex justify-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primaryStrong" to="/app/court-sync/settings">
            Court setup
          </Link>
        </div>
      </div>
    </section>
  );
}

export function CourtProviderState() {
  return (
    <section className="rounded-lg border border-warning/30 bg-warning/10 p-5">
      <div className="flex gap-3">
        <WifiOff className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-bold text-warning">Court feed is not connected yet</h2>
            <StatusBadge tone="warning">Manual hearing capture stays available</StatusBadge>
          </div>
          <p className="mt-2 text-sm leading-6 text-ink">
            Court orders, daily cause lists, and verdict updates will appear after your firm turns on court sync.
          </p>
        </div>
      </div>
    </section>
  );
}

export function CourtIssues({ issues = [] }) {
  if (!issues.length) return null;
  return (
    <section className="rounded-lg border border-warning/30 bg-warning/10 p-4">
      <div className="flex gap-3">
        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
        <div>
          <h2 className="text-sm font-bold text-warning">Court sync needs setup.</h2>
          <ul className="mt-2 space-y-1 text-sm leading-6 text-ink">
            {issues.map((issue) => <li key={issue}>{issue}</li>)}
          </ul>
        </div>
      </div>
    </section>
  );
}

export function CourtReadinessGrid({ readiness = [] }) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {readiness.map((item) => (
        <Card className="p-5" key={item.id}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-muted">{item.label}</p>
              <p className="mt-2 text-sm leading-6 text-muted">{item.detail}</p>
            </div>
            <StatusBadge tone={item.status === "Connected" ? "success" : "warning"}>{item.status}</StatusBadge>
          </div>
        </Card>
      ))}
    </div>
  );
}

export function CourtSyncSummary({ hearings = [], hearingTimeEntries = [], matters = [] }) {
  const tiles = [
    { label: "Live court items", value: 0, icon: Gavel, tone: "warning" },
    { label: "Manual hearings", value: hearings.length, icon: CalendarClock, tone: "neutral" },
    { label: "Matter candidates", value: matters.length, icon: Link2, tone: "neutral" },
    { label: "Court time entries", value: hearingTimeEntries.length, icon: CheckCircle2, tone: "neutral" },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {tiles.map((tile) => {
        const Icon = tile.icon;
        return (
          <Card className="p-5" key={tile.label}>
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-bold uppercase tracking-wide text-muted">{tile.label}</p>
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <p className="mt-2 text-2xl font-bold text-primary">{tile.value}</p>
            {tile.tone === "warning" ? <p className="mt-1 text-xs font-semibold text-warning">Waiting on setup</p> : null}
          </Card>
        );
      })}
    </div>
  );
}

export function CourtDailyFeedPanel({ courtItems = [] }) {
  if (!courtItems.length) {
    return (
      <StateCard
        state="empty"
        title="No court feed items yet"
        message="Daily cause list, order, and verdict updates will appear here after court sync is connected."
        actionLabel="View setup"
      />
    );
  }

  return (
    <DataTable
      columns={[
        { key: "title", label: "Court item" },
        { key: "court", label: "Court" },
        { key: "date", label: "Date" },
        { key: "status", label: "Status" },
      ]}
      rows={courtItems}
    />
  );
}

export function CourtMatchPanel({ matters = [] }) {
  return (
    <Card>
      <CardHeader title="Court case match" action={<StatusBadge tone="warning">Review only</StatusBadge>} />
      <CardBody>
        <p className="mb-4 text-sm leading-6 text-muted">
          Incoming court items will be matched to matters here. For now, these matter records are ready to review when the feed is connected.
        </p>
        {matters.length ? (
          <DataTable
            columns={[
              { key: "title", label: "Matter" },
              { key: "client", label: "Client" },
              { key: "status", label: "Status" },
              { key: "action", label: "Action" },
            ]}
            rows={matters.slice(0, 8).map((matter) => ({
              id: matter.id,
              title: <span className="font-bold text-primary">{matter.title}</span>,
              client: matter.client,
              status: matter.status,
              action: <StatusBadge tone="warning">Waiting for court item</StatusBadge>,
            }))}
          />
        ) : (
          <StateCard state="empty" title="No matters ready for matching" message="Create or refresh matters before linking court items." />
        )}
      </CardBody>
    </Card>
  );
}

export function VerdictDetailShell() {
  return (
    <Card>
      <CardHeader title="Verdict detail" action={<StatusBadge tone="warning">Not connected</StatusBadge>} />
      <CardBody className="space-y-4">
        <div className="rounded-lg border border-border p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-muted">Expected details</p>
          <h2 className="mt-2 text-lg font-bold text-primary">Order or verdict summary</h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            Once court sync is connected, this page will show the court name, bench, order date, linked matter, and review notes.
          </p>
        </div>
        <StateCard state="unavailable" title="Verdict feed is not connected yet" message="No legal outcome is shown until a trusted court feed is connected." />
      </CardBody>
    </Card>
  );
}

export function ManualHearingSeparation({ hearings = [] }) {
  return (
    <Card>
      <CardHeader title="Manual hearing records" action={<StatusBadge>{hearings.length}</StatusBadge>} />
      <CardBody className="space-y-3">
        {hearings.length ? hearings.slice(0, 5).map((hearing) => (
          <div className="rounded-lg border border-border p-4" key={hearing.id}>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="font-bold text-primary">{hearing.title}</p>
                <p className="mt-1 text-sm text-muted">{hearing.courtName || "Court not set"}</p>
              </div>
              <p className="text-xs font-bold text-muted">{formatDateTime(hearing.scheduledStart)}</p>
            </div>
          </div>
        )) : (
          <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted">No manual hearing records yet.</div>
        )}
      </CardBody>
    </Card>
  );
}

export function CourtSettingsShell({ setupSteps = [] }) {
  return (
    <section className="surface-card p-5">
      <div className="mb-5 flex items-start gap-3">
        <div className="rounded-lg bg-blueSoft p-2 text-primary">
          <Settings className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-primary">Court sync settings</h2>
          <p className="mt-1 text-sm leading-6 text-muted">These controls stay off until your firm chooses a trusted court feed source.</p>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {setupSteps.map((step) => (
          <div className="rounded-lg border border-border p-4" key={step}>
            <p className="font-bold text-ink">{step}</p>
            <p className="mt-1 text-sm leading-6 text-muted">Waiting for setup.</p>
          </div>
        ))}
      </div>
      <Button className="mt-5" disabled type="button">
        <RefreshCw className="h-4 w-4" />
        Run sync after setup
      </Button>
    </section>
  );
}
