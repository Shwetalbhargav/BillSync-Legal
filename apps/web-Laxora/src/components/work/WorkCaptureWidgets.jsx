import { Link } from "react-router-dom";
import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  Chrome,
  ClipboardList,
  FileText,
  FileType,
  Globe2,
  Mail,
  MessageCircle,
  MonitorPlay,
  MousePointerClick,
  Pause,
  Play,
  Save,
  Square,
  Timer,
  Type,
  Video,
} from "lucide-react";
import { Button, Card, CardBody, CardHeader, DataTable, StateCard, StatusBadge } from "../common";

export function formatDuration(minutes = 0) {
  const total = Math.max(0, Number(minutes || 0));
  const hours = Math.floor(total / 60);
  const mins = total % 60;
  return `${hours}h ${String(mins).padStart(2, "0")}m 00s`;
}

export function formatSeconds(seconds = 0) {
  const total = Math.max(0, Math.floor(Number(seconds || 0)));
  const hours = Math.floor(total / 3600);
  const mins = Math.floor((total % 3600) / 60);
  const secs = Math.floor(total % 60);
  return `${hours}h ${String(mins).padStart(2, "0")}m ${String(secs).padStart(2, "0")}s`;
}

export function formatElapsed(startedAt, fallbackMinutes = 0, status = "") {
  if (String(status).toLowerCase() === "paused") return formatDuration(fallbackMinutes);
  if (!startedAt) return formatDuration(fallbackMinutes);
  const elapsedSeconds = Math.max(0, Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000));
  const fallbackSeconds = Math.max(0, Number(fallbackMinutes || 0) * 60);
  return formatSeconds(Math.max(elapsedSeconds, fallbackSeconds));
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
  ["microsoft_word", "Microsoft Word"],
  ["google_docs", "Google Docs"],
  ["pdf_reader", "PDF review"],
  ["google_chrome", "Chrome"],
  ["gmail", "Gmail"],
  ["google_meet", "Google Meet"],
  ["zoom", "Zoom"],
  ["microsoft_teams", "Microsoft Teams"],
  ["whatsapp", "WhatsApp Web"],
  ["billbot_ai", "BillBot AI"],
  ["other", "Other"],
];

const toolMeta = {
  manual: { icon: Timer, detail: "Track work inside Lexora." },
  microsoft_word: { icon: FileText, detail: "Opens Word if the device has the app protocol." },
  google_docs: { icon: FileText, detail: "Opens Google Docs in a new tab." },
  pdf_reader: { icon: FileType, detail: "Opens Drive for PDF review." },
  google_chrome: { icon: Chrome, detail: "Opens Chrome/web research." },
  gmail: { icon: Mail, detail: "Opens Gmail." },
  google_meet: { icon: Video, detail: "Opens Google Meet." },
  zoom: { icon: Video, detail: "Opens Zoom web launcher." },
  microsoft_teams: { icon: MonitorPlay, detail: "Opens Microsoft Teams." },
  whatsapp: { icon: MessageCircle, detail: "Opens WhatsApp Web." },
  billbot_ai: { icon: Bot, detail: "Opens the Assistant workspace." },
  other: { icon: Globe2, detail: "Track work in another tool." },
};

const toolLinks = {
  microsoft_word: "ms-word:",
  google_docs: "https://docs.google.com/document/u/0/",
  pdf_reader: "https://drive.google.com/drive/my-drive",
  google_chrome: "https://www.google.com/",
  gmail: "https://mail.google.com/mail/u/0/#inbox?lb_meter=1&lb_compose=1&lb_prompt=BillSync%20Work%20Meter",
  google_meet: "https://meet.google.com/",
  zoom: "https://zoom.us/start/videomeeting",
  microsoft_teams: "https://teams.microsoft.com/v2/",
  whatsapp: "https://web.whatsapp.com/",
  billbot_ai: "/app/assistant",
};

function optionLabel(options, value, fallback = "Not set") {
  return options.find(([optionValue]) => optionValue === value)?.[1] || fallback;
}

function selectedName(items, id, labelKey) {
  return items.find((item) => item.id === id)?.[labelKey] || "";
}

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
  const selectedTool = toolMeta[form.workTool] || toolMeta.manual;
  const SelectedToolIcon = selectedTool.icon;
  const selectedToolLink = toolLinks[form.workTool] || "";
  const selectedClientName = selectedName(clients, form.clientId, "name");
  const selectedMatterName = selectedName(matters, form.caseId, "title");
  const selectedTaskName = selectedName(tasks, form.taskId, "title");
  return (
    <>
      <section className="surface-card overflow-hidden">
        <div className="grid gap-0 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="min-w-0 border-b border-border bg-gradient-to-br from-blueSoft via-white to-white p-6 xl:border-b-0 xl:border-r">
            <p className="text-sm font-semibold uppercase tracking-wide text-accent">Work Meter</p>
            <h1 className="mt-1 text-2xl font-bold text-primary md:text-3xl">{running ? "Work in progress" : "Ready to start"}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">Capture focused work with matter context and save it for review.</p>
            <div className="mt-6 rounded-lg border border-border bg-white p-5 shadow-soft">
              <div className="flex items-center gap-4">
                <div className="rounded-lg bg-blueSoft p-4 text-primary">
                  <Timer className="h-8 w-8" />
                </div>
                <div className="min-w-0">
                  <p className="safe-text text-4xl font-bold text-primary">{elapsedLabel}</p>
                  <p className="mt-1 text-sm font-semibold text-muted">{running ? session.status : "No active meter"}</p>
                </div>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <div className="rounded-lg bg-surface p-3">
                  <Type className="h-4 w-4 text-accent" />
                  <p className="mt-2 text-xs font-bold uppercase tracking-wide text-muted">Keyboard</p>
                  <p className="mt-1 text-sm font-semibold text-primary">Count only</p>
                </div>
                <div className="rounded-lg bg-surface p-3">
                  <MousePointerClick className="h-4 w-4 text-accent" />
                  <p className="mt-2 text-xs font-bold uppercase tracking-wide text-muted">Mouse</p>
                  <p className="mt-1 text-sm font-semibold text-primary">Count only</p>
                </div>
                <div className="rounded-lg bg-surface p-3">
                  <Globe2 className="h-4 w-4 text-accent" />
                  <p className="mt-2 text-xs font-bold uppercase tracking-wide text-muted">Apps</p>
                  <p className="mt-1 text-sm font-semibold text-primary">Name and time</p>
                </div>
              </div>
            </div>
            <p className="mt-4 max-w-2xl text-xs font-semibold leading-5 text-muted">No keystrokes, screenshots, page text, or document text are saved.</p>
          </div>
          <div className="min-w-0 p-6">
            {!running ? (
              <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
                <div className="space-y-4">
                  {validation ? <div className="rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm font-semibold text-warning">{validation}</div> : null}
                  <div className="grid gap-4 md:grid-cols-2">
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
                  </div>
                  <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_180px]">
                    <label className="block text-sm font-semibold text-ink">
                      Work tool
                      <select className="focus-ring mt-1 w-full rounded-lg border border-border px-3 py-3" onChange={(event) => onChange("workTool", event.target.value)} value={form.workTool}>
                        {workToolOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                      </select>
                    </label>
                    <label className="mt-6 flex items-center gap-3 rounded-lg border border-border px-3 py-3 text-sm font-semibold text-ink md:mt-7">
                      <input checked={form.billable} className="h-4 w-4 rounded border-border" onChange={(event) => onChange("billable", event.target.checked)} type="checkbox" />
                      Billable work
                    </label>
                  </div>
                  <label className="block text-sm font-semibold text-ink">
                    Notes
                    <textarea className="focus-ring mt-1 min-h-24 w-full rounded-lg border border-border px-3 py-3" onChange={(event) => onChange("narrative", event.target.value)} placeholder="Short note for review" value={form.narrative} />
                  </label>
                </div>
                <aside className="rounded-lg border border-border bg-surface p-4">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-primary text-white">
                      <SelectedToolIcon className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="safe-text text-sm font-bold text-primary">{optionLabel(workToolOptions, form.workTool, "Manual")}</p>
                      <p className="mt-1 text-xs font-semibold leading-5 text-muted">{selectedTool.detail}</p>
                    </div>
                  </div>
                  {selectedToolLink ? (
                    selectedToolLink.startsWith("/") ? (
                      <Link className="focus-ring mt-4 inline-flex w-full items-center justify-center rounded-lg border border-border bg-white px-3 py-2 text-sm font-semibold text-primary hover:bg-blueSoft" to={selectedToolLink}>
                        Open tool
                      </Link>
                    ) : (
                      <a className="focus-ring mt-4 inline-flex w-full items-center justify-center rounded-lg border border-border bg-white px-3 py-2 text-sm font-semibold text-primary hover:bg-blueSoft" href={selectedToolLink} rel="noreferrer" target="_blank">
                        Open tool
                      </a>
                    )
                  ) : null}
                  <div className="mt-4 space-y-3 text-sm">
                    <p className="rounded-lg bg-white p-3"><span className="font-bold text-primary">Client:</span> {selectedClientName || "Select client"}</p>
                    <p className="rounded-lg bg-white p-3"><span className="font-bold text-primary">Matter:</span> {selectedMatterName || "Select matter"}</p>
                    <p className="rounded-lg bg-white p-3"><span className="font-bold text-primary">Task:</span> {selectedTaskName || "No linked task"}</p>
                  </div>
                  <Button className="mt-4 w-full" disabled={isSaving} isLoading={isSaving} onClick={onStart} type="button">
                    <Play className="h-4 w-4" />
                    Start meter and open tool
                  </Button>
                </aside>
              </div>
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
    </>
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

export function IdleResolutionPrompt({ idle, isSaving, onDiscard, onKeep }) {
  const pending = (idle?.intervals || []).filter((interval) => interval.status === "pending");
  if (!pending.length) return null;
  const seconds = pending.reduce((sum, interval) => sum + Number(interval.durationSeconds || 0), 0);
  return (
    <section className="rounded-lg border border-warning/30 bg-warning/10 p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <h2 className="text-base font-bold text-warning">Review time away</h2>
          <p className="mt-1 text-sm leading-6 text-ink">
            We noticed {formatSeconds(seconds)} without activity. Keep it if you were still working, or remove it from payable time.
          </p>
        </div>
        <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
          <Button disabled={isSaving} onClick={() => onKeep(pending)} type="button" variant="secondary">Keep time</Button>
          <Button disabled={isSaving} onClick={() => onDiscard(pending)} type="button" variant="danger">Remove from payable time</Button>
        </div>
      </div>
    </section>
  );
}

export function IdleMarkers({ intervals }) {
  if (!intervals?.length) return null;
  return (
    <div className="mt-3 rounded-lg border border-border bg-surface p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">Idle markers</p>
      <div className="mt-2 space-y-2">
        {intervals.slice(0, 4).map((interval) => (
          <div className="flex flex-col gap-1 text-sm sm:flex-row sm:items-center sm:justify-between" key={interval.id}>
            <span className="text-ink">{formatDateTime(interval.intervalStart)} - {formatSeconds(interval.durationSeconds)}</span>
            <StatusBadge tone={interval.status === "discarded" ? "warning" : interval.status === "kept" ? "success" : "neutral"}>
              {interval.status}
            </StatusBadge>
          </div>
        ))}
      </div>
    </div>
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
        { key: "idle", label: "Idle" },
        { key: "payable", label: "Payable" },
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
        idle: session.idleSummary?.count ? `${formatSeconds(session.idleSummary.totalSeconds)} (${formatSeconds(session.idleSummary.discardedSeconds)} removed)` : "No idle markers",
        payable: formatDuration(session.payableMinutes || session.minutes),
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
