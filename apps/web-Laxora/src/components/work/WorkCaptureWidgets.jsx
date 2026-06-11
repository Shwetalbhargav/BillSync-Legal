import { Link } from "react-router-dom";
import { AlertTriangle, CheckCircle2, Clock3, Pause, Play, Save, Square, Timer } from "lucide-react";
import { Button, Card, CardBody, CardHeader, DataTable, StateCard, StatusBadge } from "../common";

export function formatDuration(minutes = 0) {
  const total = Math.max(0, Number(minutes || 0));
  const hours = Math.floor(total / 60);
  const mins = total % 60;
  return `${hours}h ${String(mins).padStart(2, "0")}m`;
}

export function formatElapsed(startedAt, fallbackMinutes = 0) {
  if (!startedAt) return formatDuration(fallbackMinutes);
  const elapsed = Math.max(0, Math.floor((Date.now() - new Date(startedAt).getTime()) / 60000));
  return formatDuration(Math.max(elapsed, fallbackMinutes));
}

export function formatDateTime(value) {
  if (!value) return "Not set";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Not set"
    : date.toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function WorkMeterPanel({ elapsedLabel, form, isSaving, matters, onChange, onDiscard, onPauseResume, onStart, onStop, session }) {
  const running = Boolean(session);
  return (
    <section className="surface-card p-6">
      <div className="flex min-w-0 flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold uppercase tracking-wide text-accent">Work Meter</p>
          <h1 className="mt-1 text-2xl font-bold text-primary md:text-3xl">{running ? "Work in progress" : "Ready to start"}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">Capture focused work with matter context and save it for review.</p>
          <div className="mt-6 flex items-center gap-4">
            <div className="rounded-lg bg-blueSoft p-4 text-primary">
              <Timer className="h-8 w-8" />
            </div>
            <div>
              <p className="text-4xl font-bold text-primary">{elapsedLabel}</p>
              <p className="mt-1 text-sm font-semibold text-muted">{running ? session.status : "No active meter"}</p>
            </div>
          </div>
        </div>
        <div className="w-full max-w-xl space-y-4">
          {!running ? (
            <>
              <label className="block text-sm font-semibold text-ink">
                Matter
                <select className="focus-ring mt-1 w-full rounded-lg border border-border px-3 py-3" onChange={(event) => onChange("caseId", event.target.value)} value={form.caseId}>
                  <option value="">Select matter</option>
                  {matters.map((matter) => <option key={matter.id} value={matter.id}>{matter.title}</option>)}
                </select>
              </label>
              <label className="block text-sm font-semibold text-ink">
                Work type
                <select className="focus-ring mt-1 w-full rounded-lg border border-border px-3 py-3" onChange={(event) => onChange("activityType", event.target.value)} value={form.activityType}>
                  <option value="drafting">Drafting</option>
                  <option value="review">Review</option>
                  <option value="research">Research</option>
                  <option value="meeting">Meeting</option>
                  <option value="call">Call</option>
                  <option value="hearing">Hearing</option>
                  <option value="other">Other</option>
                </select>
              </label>
              <label className="block text-sm font-semibold text-ink">
                Notes
                <textarea className="focus-ring mt-1 min-h-24 w-full rounded-lg border border-border px-3 py-3" onChange={(event) => onChange("narrative", event.target.value)} placeholder="Short note for review" value={form.narrative} />
              </label>
              <Button className="w-full" disabled={isSaving} isLoading={isSaving} onClick={onStart} type="button">
                <Play className="h-4 w-4" />
                Start meter
              </Button>
            </>
          ) : (
            <div className="grid gap-3 sm:grid-cols-3">
              <Button disabled={isSaving} onClick={onPauseResume} type="button" variant="secondary">
                {session.status === "paused" ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                {session.status === "paused" ? "Resume" : "Pause"}
              </Button>
              <Button disabled={isSaving} isLoading={isSaving} onClick={() => onStop(false)} type="button">
                <Save className="h-4 w-4" />
                Save draft
              </Button>
              <Button disabled={isSaving} onClick={onDiscard} type="button" variant="danger">
                <Square className="h-4 w-4" />
                Discard
              </Button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export function SaveFailedState({ elapsedLabel, message, onRetry }) {
  return (
    <section className="rounded-lg border border-danger/30 bg-danger/10 p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <AlertTriangle className="h-6 w-6 shrink-0 text-danger" />
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-bold text-danger">Your time is still here</h2>
          <p className="mt-1 text-sm leading-6 text-ink">{message || "We could not save this work yet. Keep this page open and try again."}</p>
          <p className="mt-2 text-sm font-bold text-primary">Current time: {elapsedLabel}</p>
          <Button className="mt-4" onClick={onRetry} type="button" variant="secondary">Try saving again</Button>
        </div>
      </div>
    </section>
  );
}

export function WorkSessionTable({ sessions }) {
  if (!sessions.length) return <StateCard state="empty" title="No work sessions yet" message="Start the meter or add time manually to build your history." />;
  return (
    <DataTable
      columns={[
        { key: "title", label: "Work" },
        { key: "matter", label: "Matter" },
        { key: "status", label: "Status" },
        { key: "duration", label: "Duration" },
        { key: "started", label: "Started" },
      ]}
      rows={sessions.map((session) => ({
        id: session.id,
        title: session.title,
        matter: session.matter || "Not set",
        status: <StatusBadge>{session.status}</StatusBadge>,
        duration: formatDuration(session.minutes),
        started: formatDateTime(session.startedAt),
      }))}
    />
  );
}

export function CapturedWorkList({ activities, onConvert, onReview }) {
  if (!activities.length) return <StateCard state="empty" title="No captured work" message="Meter sessions and manual captures will appear here for review." />;
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      {activities.map((activity) => (
        <Card className="p-5" key={activity.id}>
          <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="break-words text-base font-bold text-primary">{activity.title}</h3>
                <StatusBadge>{activity.status}</StatusBadge>
              </div>
              <p className="mt-2 text-sm text-muted">{activity.matter || "Matter not set"} - {formatDuration(activity.minutes)}</p>
              <p className="mt-1 text-xs font-semibold text-muted">{formatDateTime(activity.occurredAt)}</p>
            </div>
            <div className="flex shrink-0 flex-col gap-2">
              <Button onClick={() => onReview(activity)} size="sm" type="button" variant="secondary">
                <CheckCircle2 className="h-4 w-4" />
                Review
              </Button>
              <Button onClick={() => onConvert(activity)} size="sm" type="button">
                Create time
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

export function TimeEntryList({ entries, onSubmit }) {
  if (!entries.length) return <StateCard state="empty" title="No draft time entries" message="Saved work will appear here before approval submission." />;
  return (
    <Card>
      <CardHeader title="Ready to submit" action={<StatusBadge>{entries.length}</StatusBadge>} />
      <CardBody className="space-y-3">
        {entries.map((entry) => (
          <div className="rounded-lg border border-border p-4" key={entry.id}>
            <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="break-words text-sm font-bold text-primary">{entry.title}</p>
                <p className="mt-1 text-xs font-semibold text-muted">{entry.matter || "Matter not set"} - {formatDuration(entry.minutes)}</p>
              </div>
              <Button onClick={() => onSubmit(entry)} size="sm" type="button">Submit</Button>
            </div>
          </div>
        ))}
      </CardBody>
    </Card>
  );
}
