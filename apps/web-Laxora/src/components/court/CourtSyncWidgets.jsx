import { Link } from "react-router-dom";
import { AlertCircle, ArrowUpRight, CalendarClock, CheckCircle2, ExternalLink, Gavel, Link2, Newspaper, RefreshCw, Settings, Wifi } from "lucide-react";
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

function formatDate(value) {
  if (!value) return "New";
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}

function storyUrl(item) {
  return item?.sourcePageUrl || item?.pdfUrl || "#";
}

function storySource(item) {
  return item?.source || item?.court || "Legal desk";
}

function storyType(item) {
  return String(item?.type || "legal update").replace(/_/g, " ");
}

function storyExcerpt(item) {
  const title = item?.title || "";
  if (title.length > 132) return `${title.slice(0, 129).trim()}...`;
  if (/court/i.test(title)) return "A fresh court dispatch for your daily legal watchlist, pulled from the original source.";
  return "A quick legal-system update worth scanning before the next matter review.";
}

export function CourtNewsroomHero({ title = "The Gavel Gathering", itemCount = 0, isRefreshing = false, onRefresh }) {
  return (
    <section className="overflow-hidden rounded-lg border border-border bg-panel">
      <div className="grid gap-0 lg:grid-cols-[1.25fr_0.75fr]">
        <div className="p-6 md:p-8">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-accent">
            <Newspaper className="h-3.5 w-3.5" />
            Legal newsroom
          </div>
          <h1 className="max-w-3xl text-3xl font-bold leading-tight text-primary md:text-5xl">{title}</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-muted">
            Courtroom turns, judicial appointments, orders, policy notices, and law-system updates gathered into one readable daily briefing.
          </p>
        </div>
        <div className="flex flex-col justify-between border-t border-border bg-blueSoft/60 p-6 lg:border-l lg:border-t-0 md:p-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-muted">Today's docket</p>
            <p className="mt-2 text-4xl font-bold text-primary">{itemCount}</p>
            <p className="mt-2 text-sm leading-6 text-muted">stories ready to read from their original publishers.</p>
          </div>
          <Button className="mt-6 w-full justify-center sm:w-auto" disabled={isRefreshing} onClick={onRefresh} type="button">
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            {isRefreshing ? "Refreshing" : "Refresh briefing"}
          </Button>
        </div>
      </div>
    </section>
  );
}

export function CourtNewsroomFeed({ courtItems = [] }) {
  if (!courtItems.length) {
    return (
      <StateCard
        state="empty"
        title="No stories in the gathering yet"
        message="Fresh legal and court updates will appear here after the next briefing refresh."
      />
    );
  }

  const [leadStory, ...rest] = courtItems;

  return (
    <section className="space-y-5">
      <a
        className="group grid overflow-hidden rounded-lg border border-border bg-panel shadow-sm transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md lg:grid-cols-[1.1fr_0.9fr]"
        href={storyUrl(leadStory)}
        rel="noreferrer"
        target="_blank"
      >
        <article className="p-6 md:p-8">
          <div className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-wide text-accent">
            <span>{storySource(leadStory)}</span>
            <span aria-hidden="true">/</span>
            <span>{formatDate(leadStory.date)}</span>
          </div>
          <h2 className="mt-4 text-2xl font-bold leading-tight text-primary md:text-4xl">{leadStory.title}</h2>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-muted">{storyExcerpt(leadStory)}</p>
          <span className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-primary">
            Read at source <ArrowUpRight className="h-4 w-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </span>
        </article>
        <div className="flex min-h-64 flex-col justify-between bg-primary p-6 text-white md:p-8">
          <p className="text-xs font-bold uppercase tracking-wide text-white/70">{storyType(leadStory)}</p>
          <div>
            <p className="text-5xl font-bold">{formatDate(leadStory.date).split(" ")[0]}</p>
            <p className="mt-2 text-sm font-semibold text-white/75">{formatDate(leadStory.date).replace(/^\S+\s/, "")}</p>
          </div>
        </div>
      </a>

      <div className="columns-1 gap-5 md:columns-2 xl:columns-3">
        {rest.map((item, index) => (
          <a
            className={`group mb-5 block break-inside-avoid rounded-lg border border-border bg-panel p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md ${
              index % 4 === 1 ? "bg-blueSoft/70" : ""
            } ${index % 5 === 2 ? "p-7" : ""}`}
            href={storyUrl(item)}
            key={item.id}
            rel="noreferrer"
            target="_blank"
          >
            <article>
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-bold uppercase tracking-wide text-muted">{storyType(item)}</p>
                <ArrowUpRight className="h-4 w-4 shrink-0 text-primary transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </div>
              <h3 className="mt-4 text-lg font-bold leading-snug text-primary">{item.title}</h3>
              <p className="mt-3 text-sm leading-6 text-muted">{storyExcerpt(item)}</p>
              <div className="mt-5 flex flex-wrap items-center gap-2 text-xs font-semibold text-muted">
                <span>{storySource(item)}</span>
                <span aria-hidden="true">/</span>
                <span>{formatDate(item.date)}</span>
              </div>
            </article>
          </a>
        ))}
      </div>
    </section>
  );
}

export function CourtProviderState({ sources = [], jobs = [], courtItems = [], onRunSync }) {
  const enabledSources = sources.filter((source) => source.enabled);
  const latestJob = jobs[0];
  const isConnected = enabledSources.length > 0;

  return (
    <section className="rounded-lg border border-success/30 bg-success/10 p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex gap-3">
          <Wifi className="mt-0.5 h-5 w-5 shrink-0 text-success" />
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-bold text-success">{isConnected ? "Court feed is connected" : "Court feed sources are ready"}</h2>
              <StatusBadge tone="success">{enabledSources.length} official sources</StatusBadge>
            </div>
            <p className="mt-2 text-sm leading-6 text-ink">
              {courtItems.length
                ? "Court orders, notices, gazettes, and law updates are flowing into this feed from public official sources."
                : "Run sync to pull the latest public court and law PDFs into this dedicated legal news feed."}
            </p>
            {latestJob ? <p className="mt-1 text-xs font-semibold text-muted">Last job: {latestJob.status} for {latestJob.sourceName}</p> : null}
          </div>
        </div>
        <Button type="button" onClick={onRunSync}>
          <RefreshCw className="h-4 w-4" />
          Run sync
        </Button>
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
          <h2 className="text-sm font-bold text-warning">Court sync needs attention.</h2>
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
            <StatusBadge tone={item.status === "Needs setup" ? "warning" : "success"}>{item.status}</StatusBadge>
          </div>
        </Card>
      ))}
    </div>
  );
}

export function CourtSyncSummary({ courtItems = [], hearings = [], hearingTimeEntries = [], matters = [] }) {
  const tiles = [
    { label: "Live court items", value: courtItems.length, icon: Gavel, tone: courtItems.length ? "success" : "warning" },
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
            {tile.tone === "warning" ? <p className="mt-1 text-xs font-semibold text-warning">Run sync to refresh</p> : null}
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
        { key: "link", label: "Source" },
      ]}
      rows={courtItems.map((item) => ({
        ...item,
        title: <span className="font-bold text-primary">{item.title}</span>,
        date: formatDate(item.date),
        status: <StatusBadge tone={item.status === "failed" ? "warning" : "success"}>{item.type}</StatusBadge>,
        link: item.pdfUrl ? (
          <a className="inline-flex items-center gap-1 font-semibold text-primary hover:underline" href={item.pdfUrl} rel="noreferrer" target="_blank">
            {item.isPdf ? "PDF" : "Open"} <ExternalLink className="h-3.5 w-3.5" />
          </a>
        ) : "Source",
      }))}
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

export function VerdictDetailShell({ verdicts = [] }) {
  if (verdicts.length) {
    return (
      <Card>
        <CardHeader title="Verdict and order details" action={<StatusBadge tone="success">{verdicts.length} items</StatusBadge>} />
        <CardBody>
          <CourtDailyFeedPanel courtItems={verdicts} />
        </CardBody>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader title="Verdict detail" action={<StatusBadge tone="success">Ready</StatusBadge>} />
      <CardBody className="space-y-4">
        <div className="rounded-lg border border-border p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-muted">Expected details</p>
          <h2 className="mt-2 text-lg font-bold text-primary">Order or verdict summary</h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            Once court sync is connected, this page will show the court name, bench, order date, linked matter, and review notes.
          </p>
        </div>
        <StateCard state="empty" title="No verdicts fetched yet" message="Run court sync to pull available order and verdict PDFs from trusted public sources." />
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
          <p className="mt-1 text-sm leading-6 text-muted">Trusted public sources are configured for court and law feed updates.</p>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {setupSteps.map((step) => (
          <div className="rounded-lg border border-border p-4" key={step}>
            <p className="font-bold text-ink">{step}</p>
            <p className="mt-1 text-sm leading-6 text-muted">Available in the live court sync workflow.</p>
          </div>
        ))}
      </div>
      <Button className="mt-5" type="button">
        <RefreshCw className="h-4 w-4" />
        Run sync from dashboard
      </Button>
    </section>
  );
}
