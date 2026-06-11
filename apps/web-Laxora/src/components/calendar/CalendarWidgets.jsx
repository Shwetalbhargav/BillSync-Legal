import { Link } from "react-router-dom";
import { CalendarDays, Clock3, Landmark, Plus, WifiOff } from "lucide-react";
import { Card, CardBody, CardHeader, StateCard, StatusBadge } from "../common";

export function formatDateTime(value) {
  if (!value) return "Not set";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Not set"
    : date.toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function CalendarConnectionState() {
  return (
    <section className="surface-card p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className="rounded-lg bg-warning/10 p-3 text-warning">
          <WifiOff className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-bold text-ink">Calendar is not connected yet</h2>
            <StatusBadge tone="warning">Manual capture available</StatusBadge>
          </div>
          <p className="mt-2 text-sm leading-6 text-muted">You can still record hearing time manually. Connected court events will appear here once your firm turns on calendar sync.</p>
          <Link className="focus-ring mt-4 inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primaryStrong" to="/app/hearings/manual-time">
            <Plus className="h-4 w-4" />
            Add hearing time
          </Link>
        </div>
      </div>
    </section>
  );
}

export function HearingSummary({ hearings, sessions, timeEntries }) {
  const tiles = [
    { label: "Captured hearings", value: hearings.length, icon: Landmark },
    { label: "Meter sessions", value: sessions.length, icon: Clock3 },
    { label: "Time entries", value: timeEntries.length, icon: CalendarDays },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {tiles.map((tile) => {
        const Icon = tile.icon;
        return (
          <Card className="p-5" key={tile.label}>
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-bold uppercase tracking-wide text-muted">{tile.label}</p>
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <p className="mt-2 text-2xl font-bold text-primary">{tile.value}</p>
          </Card>
        );
      })}
    </div>
  );
}

export function HearingList({ hearings }) {
  if (!hearings.length) {
    return <StateCard state="empty" title="No hearings captured yet" message="Add hearing time manually or connect a calendar when your firm is ready." />;
  }

  return (
    <Card>
      <CardHeader title="Hearing dashboard" action={<StatusBadge>{hearings.length}</StatusBadge>} />
      <CardBody className="space-y-3">
        {hearings.map((hearing) => (
          <div className="rounded-lg border border-border p-4" key={hearing.id}>
            <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="break-words text-sm font-bold text-primary">{hearing.title}</h3>
                  <StatusBadge>{hearing.status}</StatusBadge>
                </div>
                <p className="mt-2 text-sm text-muted">{hearing.courtName || "Court not set"} {hearing.courtroom ? `- ${hearing.courtroom}` : ""}</p>
                <p className="mt-1 text-xs font-semibold text-muted">{hearing.judgeOrBench || "Bench not set"}</p>
              </div>
              <p className="shrink-0 text-xs font-bold text-muted">{formatDateTime(hearing.scheduledStart)}</p>
            </div>
            {hearing.notes ? <p className="mt-3 text-sm leading-6 text-muted">{hearing.notes}</p> : null}
          </div>
        ))}
      </CardBody>
    </Card>
  );
}

export function HearingTimeList({ timeEntries }) {
  return (
    <Card>
      <CardHeader title="Court time entries" action={<StatusBadge>{timeEntries.length}</StatusBadge>} />
      <CardBody className="space-y-3">
        {timeEntries.length ? timeEntries.map((entry) => (
          <div className="rounded-lg border border-border p-3" key={entry.id}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="break-words text-sm font-bold text-ink">{entry.title}</p>
              <StatusBadge>{entry.status}</StatusBadge>
            </div>
            <p className="mt-2 text-xs font-semibold text-muted">{formatDateTime(entry.occurredAt)} - {entry.minutes} min</p>
          </div>
        )) : (
          <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted">No court time entries yet.</div>
        )}
      </CardBody>
    </Card>
  );
}

export function SectionIssues({ issues }) {
  if (!issues?.length) return null;
  return (
    <div className="rounded-lg border border-warning/30 bg-warning/10 p-4 text-sm leading-6 text-ink">
      <p className="font-bold text-warning">Some details need another refresh.</p>
      <ul className="mt-2 space-y-1">
        {issues.map((issue) => <li key={issue}>{issue}</li>)}
      </ul>
    </div>
  );
}
