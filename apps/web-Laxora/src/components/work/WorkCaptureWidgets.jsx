import { Link } from "react-router-dom";
import { AlertTriangle, CheckCircle2, ClipboardList, FileText, Globe2, Pause, Play, Save, Square, Timer } from "lucide-react";
import { Button, Card, CardBody, CardHeader, DataTable, StateCard, StatusBadge } from "../common";

export function formatDuration(minutes = 0) {
  const total = Math.max(0, Number(minutes || 0));
  const hours = Math.floor(total / 60);
  const mins = total % 60;
  return `${hours}h ${String(mins).padStart(2, "0")}m`;
}

export function formatSeconds(seconds = 0) {
  const total = Math.max(0, Number(seconds || 0));
  const hours = Math.floor(total / 3600);
  const mins = Math.floor((total % 3600) / 60);
  if (hours) return `${hours}h ${String(mins).padStart(2, "0")}m`;
  return `${mins}m`;
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

const workTypeOptions = [
  ["drafting", "Drafting"],
  ["review", "Review"],
  ["research", "Research"],
  ["meeting", "Meeting"],
  ["call", "Call"],
  ["hearing", "Hearing"],
  ["email", "Email"],
  ["other", "Other"],
];

const workToolOptions = [
  ["manual", "Manual"],
  ["microsoft_word", "Word"],
  ["google_docs", "Google Docs"],
  ["pdf_reader", "PDF review"],
  ["google_chrome", "Browser"],
  ["gmail", "Email"],
  ["phone", "Phone"],
  ["video_meeting", "Video meeting"],
  ["court", "Court"],
  ["billbot_ai", "BillBot AI"],
  ["other", "Other"],
];

export function WorkMeterPanel({
  clients,
  elapsedLabel,
  form,
  isSaving,
  matters,
  onChange,
  onDiscard,
  onPauseResume,
  onStart,
  onStop,
  session,
  tasks,
  validation,
}) {
  const running = Boolean(session);
  return (
    <section className="surface-card p-6">
      <div className="flex min-w-0 flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold uppercase tracking-wide text-accent">Work Meter</p>
          <h1 className="mt-1 text-2xl font-bold text-primary md:text-3xl">{running ? "Work in progress" : "Ready to start"}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">Capture focused work with matter context and save it for review.</p>
          <p className="mt-1 max-w-2xl text-xs font-semibold leading-5 text-muted">Activity uses keyboard and mouse counts, app names, website domains, and timing only. It does not save keystrokes, screenshots, page text, or document text.</p>
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
              {validation ? <div className="rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm font-semibold text-warning">{validation}</div> : null}
              <label className="block text-sm font-semibold text-ink">
                Client
                <select className="focus-ring mt-1 w-full rounded-lg border border-border px-3 py-3" onChange={(event) => onChange("clientId", event.target.value)} value={form.clientId}>
                  <option value="">Select client</option>
                  {clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}
                </select>
              </label>
              <label className="block text-sm font-semibold text-ink">
                Matter
                <select className="focus-ring mt-1 w-full rounded-lg border border-border px-3 py-3" onChange={(event) => onChange("caseId", event.target.value)} value={form.caseId}>
                  <option value="">Select matter</option>
                  {matters.map((matter) => <option key={matter.id} value={matter.id}>{matter.title}</option>)}
                </select>
              </label>
              <label className="block text-sm font-semibold text-ink">
                Task
                <select className="focus-ring mt-1 w-full rounded-lg border border-border px-3 py-3" onChange={(event) => onChange("taskId", event.target.value)} value={form.taskId}>
                  <option value="">No linked task</option>
                  {tasks.map((task) => <option key={task.id} value={task.id}>{task.title}</option>)}
                </select>
              </label>
              <label className="block text-sm font-semibold text-ink">
                Work type
                <select className="focus-ring mt-1 w-full rounded-lg border border-border px-3 py-3" onChange={(event) => onChange("activityType", event.target.value)} value={form.activityType}>
                  {workTypeOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </label>
              <label className="block text-sm font-semibold text-ink">
                Work tool
                <select className="focus-ring mt-1 w-full rounded-lg border border-border px-3 py-3" onChange={(event) => onChange("workTool", event.target.value)} value={form.workTool}>
                  {workToolOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </label>
              <label className="flex items-center gap-3 rounded-lg border border-border px-3 py-3 text-sm font-semibold text-ink">
                <input checked={form.billable} className="h-4 w-4 rounded border-border" onChange={(event) => onChange("billable", event.target.checked)} type="checkbox" />
                Billable work
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
            <div className="space-y-4">
              <div className="rounded-lg border border-border p-4">
                <div className="grid gap-3 text-sm text-ink sm:grid-cols-2">
                  <p><span className="font-bold text-primary">Client:</span> {session.client || "Not set"}</p>
                  <p><span className="font-bold text-primary">Matter:</span> {session.matter || "Not set"}</p>
                  <p><span className="font-bold text-primary">Task:</span> {session.task || "No linked task"}</p>
                  <p><span className="font-bold text-primary">Work:</span> {session.activityType || "Work"}{session.workTool ? ` with ${session.workTool.replaceAll("_", " ")}` : ""}</p>
                </div>
              </div>
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
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export function MeterOptionState({ hasClients, hasMatters, hasTasks, issues, onRetry }) {
  if (issues?.length) {
    return (
      <section className="rounded-lg border border-warning/30 bg-warning/10 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-warning">Some choices need a refresh</h2>
            <p className="mt-1 text-sm text-ink">{issues.join(" ")}</p>
          </div>
          <Button onClick={onRetry} size="sm" type="button" variant="secondary">Refresh</Button>
        </div>
      </section>
    );
  }
  if (!hasClients || !hasMatters) {
    return (
      <section className="surface-card p-6">
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <div className="rounded-lg bg-blueSoft p-3 text-primary">
              <FileText className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-ink">No work context yet</h2>
              <p className="mt-1 text-sm leading-6 text-muted">Add or assign a client and matter before starting the meter.</p>
            </div>
          </div>
          <Button onClick={onRetry} type="button" variant="secondary">Refresh</Button>
        </div>
      </section>
    );
  }
  if (!hasTasks) {
    return (
      <section className="rounded-lg border border-border bg-surface p-4">
        <div className="flex items-start gap-3">
          <ClipboardList className="mt-0.5 h-5 w-5 text-accent" />
          <p className="text-sm leading-6 text-muted">No open tasks were found. You can still start the meter without linking a task.</p>
        </div>
      </section>
    );
  }
  return null;
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
        { key: "activity", label: "Activity" },
        { key: "apps", label: "Apps and sites" },
        { key: "started", label: "Started" },
      ]}
      rows={sessions.map((session) => ({
        id: session.id,
        title: session.title,
        matter: session.matter || "Not set",
        status: <StatusBadge>{session.status}</StatusBadge>,
        duration: formatDuration(session.minutes),
        activity: session.activitySummary?.sampleCount ? `${Number(session.activityPercent || 0).toLocaleString("en-IN", { maximumFractionDigits: 1 })}%` : "Not enough samples",
        apps: session.appUsageSummary?.eventCount ? `${formatSeconds(session.appUsageSummary.durationSeconds)} recorded` : "No app history",
        started: formatDateTime(session.startedAt),
      }))}
    />
  );
}

export function AppUsageTimeline({ sessions }) {
  const rows = sessions.flatMap((session) =>
    (session.appUsageTimeline || []).map((event) => ({
      ...event,
      sessionTitle: session.title,
      matter: session.matter,
    }))
  );
  if (!rows.length) {
    return (
      <section className="surface-card p-5">
        <div className="flex items-start gap-3">
          <Globe2 className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
          <div>
            <h2 className="text-base font-bold text-primary">No app or website history yet</h2>
            <p className="mt-1 text-sm leading-6 text-muted">App names and website domains will appear after an active meter sends usage records.</p>
          </div>
        </div>
      </section>
    );
  }
  const topApps = new Map();
  const topDomains = new Map();
  rows.forEach((event) => {
    topApps.set(event.appName, (topApps.get(event.appName) || 0) + Number(event.durationSeconds || 0));
    if (event.domain) topDomains.set(event.domain, (topDomains.get(event.domain) || 0) + Number(event.durationSeconds || 0));
  });
  const appRows = [...topApps.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  const domainRows = [...topDomains.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);

  return (
    <section className="surface-card p-5">
      <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-accent">App and website history</p>
          <h2 className="mt-1 text-xl font-bold text-primary">Session timeline</h2>
          <p className="mt-1 text-sm leading-6 text-muted">Shows app names, website domains, and time only.</p>
        </div>
        <Globe2 className="h-6 w-6 shrink-0 text-primary" />
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-border p-4">
          <h3 className="text-sm font-bold text-ink">Top apps</h3>
          <div className="mt-3 space-y-2">
            {appRows.map(([name, seconds]) => <p className="text-sm text-muted" key={name}>{name}: <span className="font-semibold text-ink">{formatSeconds(seconds)}</span></p>)}
          </div>
        </div>
        <div className="rounded-lg border border-border p-4">
          <h3 className="text-sm font-bold text-ink">Top websites</h3>
          <div className="mt-3 space-y-2">
            {domainRows.length ? domainRows.map(([name, seconds]) => <p className="break-words text-sm text-muted" key={name}>{name}: <span className="font-semibold text-ink">{formatSeconds(seconds)}</span></p>) : <p className="text-sm text-muted">No websites recorded.</p>}
          </div>
        </div>
      </div>
      <div className="mt-4">
        <DataTable
          columns={[
            { key: "app", label: "App" },
            { key: "site", label: "Website" },
            { key: "duration", label: "Time" },
            { key: "started", label: "Started" },
          ]}
          rows={rows.slice(0, 12).map((event) => ({
            id: event.id,
            app: event.appName,
            site: event.domain || "No website",
            duration: formatSeconds(event.durationSeconds),
            started: formatDateTime(event.startedAt),
          }))}
        />
      </div>
    </section>
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
