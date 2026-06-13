import { AlertCircle, BriefcaseBusiness, Clock3, Gauge, UserRound, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { Button, Card, CardBody, CardHeader, DataTable, StateCard, StatusBadge } from "../common";

export function formatHours(minutes) {
  return `${(Number(minutes || 0) / 60).toLocaleString("en-IN", { maximumFractionDigits: 1 })}h`;
}

export function formatUsageSeconds(seconds) {
  const total = Math.max(0, Number(seconds || 0));
  const hours = Math.floor(total / 3600);
  const mins = Math.floor((total % 3600) / 60);
  return hours ? `${hours}h ${String(mins).padStart(2, "0")}m` : `${mins}m`;
}

export function formatMoney(value) {
  return `Rs ${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

export function formatDate(value) {
  if (!value) return "Not set";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Not set" : date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export function PeopleHero({ subtitle = "Review team capacity, profiles, and workload signals from real work records.", title = "People dashboard" }) {
  return (
    <section className="surface-card p-6">
      <div className="flex min-w-0 flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold uppercase tracking-wide text-accent">People</p>
          <h1 className="mt-1 text-2xl font-bold text-primary md:text-3xl">{title}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">{subtitle}</p>
        </div>
        <div className="rounded-lg bg-blueSoft p-3 text-primary">
          <Users className="h-6 w-6" />
        </div>
      </div>
    </section>
  );
}

export function MetricTile({ icon: Icon, label, tone = "neutral", value }) {
  const toneClass = tone === "success" ? "bg-success/10 text-success" : tone === "warning" ? "bg-warning/10 text-warning" : "bg-blueSoft text-primary";
  return (
    <div className="rounded-lg border border-border bg-panel p-4">
      <div className={`mb-3 inline-flex rounded-lg p-2 ${toneClass}`}>
        <Icon className="h-4 w-4" />
      </div>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 break-words text-lg font-bold text-primary">{value}</p>
    </div>
  );
}

export function PeopleSummary({ activeSessions, people }) {
  const billableMinutes = people.reduce((sum, person) => sum + Number(person.billableMinutes || 0), 0);
  const workMinutes = people.reduce((sum, person) => sum + Number(person.totalMinutes || 0), 0);
  const avgUtilization = people.length ? people.reduce((sum, person) => sum + Number(person.utilization || 0), 0) / people.length : 0;
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <MetricTile icon={Users} label="Team members" value={people.length} />
      <MetricTile icon={Clock3} label="Recorded work" value={formatHours(workMinutes)} />
      <MetricTile icon={BriefcaseBusiness} label="Billable work" value={formatHours(billableMinutes)} tone="success" />
      <MetricTile icon={Gauge} label="Active meters" value={activeSessions.length} tone={activeSessions.length ? "warning" : "neutral"} />
      <MetricTile icon={Gauge} label="Avg utilization" value={`${avgUtilization.toLocaleString("en-IN", { maximumFractionDigits: 1 })}%`} />
    </div>
  );
}

export function SectionIssues({ issues }) {
  if (!issues?.length) return null;
  return (
    <section className="rounded-lg border border-warning/30 bg-warning/10 p-4">
      <div className="flex gap-3">
        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
        <div>
          <p className="text-sm font-bold text-warning">Some people details need another refresh.</p>
          <ul className="mt-2 space-y-1 text-sm leading-6 text-ink">
            {issues.map((issue) => <li key={issue}>{issue}</li>)}
          </ul>
        </div>
      </div>
    </section>
  );
}

export function TeamDirectoryTable({ people }) {
  if (!people.length) return <StateCard state="empty" title="No team members found" message="Team members will appear after users are added to the firm." />;
  return (
    <DataTable
      columns={[
        { key: "name", label: "Name" },
        { key: "role", label: "Role" },
        { key: "email", label: "Work email" },
        { key: "work", label: "Workload" },
        { key: "action", label: "Profile" },
      ]}
      rows={people.map((person) => ({
        id: person.id,
        name: person.name,
        role: <StatusBadge>{person.role}</StatusBadge>,
        email: person.email || "Not added yet",
        work: formatHours(person.totalMinutes),
        action: (
          <Link to={`/app/people/${person.id}`}>
            <Button size="sm" type="button" variant="secondary">Open</Button>
          </Link>
        ),
      }))}
    />
  );
}

export function WorkloadTable({ people }) {
  if (!people.length) return <StateCard state="empty" title="No workload found" message="Workload will appear after time entries or work sessions are recorded." />;
  return (
    <DataTable
      columns={[
        { key: "name", label: "Name" },
        { key: "billable", label: "Billable" },
        { key: "nonbillable", label: "Non-billable" },
        { key: "utilization", label: "Utilization" },
        { key: "value", label: "Value" },
      ]}
      rows={people.map((person) => ({
        id: person.id,
        name: person.name,
        billable: formatHours(person.billableMinutes),
        nonbillable: formatHours(person.nonbillableMinutes),
        utilization: `${Number(person.utilization || 0).toLocaleString("en-IN", { maximumFractionDigits: 1 })}%`,
        value: formatMoney(person.amount),
      }))}
    />
  );
}

export function AttendanceNotConfigured() {
  return (
    <section className="rounded-lg border border-warning/30 bg-warning/10 p-5">
      <div className="flex gap-3">
        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
        <div>
          <h2 className="text-base font-bold text-warning">Attendance overview is not turned on yet</h2>
          <p className="mt-1 text-sm leading-6 text-ink">Workload uses time entries and work sessions today. Attendance summaries need a dedicated HR record before the firm relies on them.</p>
        </div>
      </div>
    </section>
  );
}

export function EmployeeProfileCard({ person, profile }) {
  if (!person) return <StateCard state="empty" title="Employee not found" message="Choose a team member from the directory." />;
  const detail = profile?.profile || {};
  return (
    <Card>
      <CardHeader eyebrow="Employee" title={person.name} description={person.email || "Work email not added yet"} action={<StatusBadge>{person.role}</StatusBadge>} />
      <CardBody className="grid gap-3 md:grid-cols-3">
        <MetricTile icon={Clock3} label="Recorded work" value={formatHours(person.totalMinutes)} />
        <MetricTile icon={BriefcaseBusiness} label="Billable work" value={formatHours(person.billableMinutes)} tone="success" />
        <MetricTile icon={Gauge} label="Default rate" value={profile?.defaultRate ? formatMoney(profile.defaultRate) : "Not set"} />
        <div className="rounded-lg border border-border p-3 md:col-span-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Profile notes</p>
          <p className="mt-1 text-sm leading-6 text-ink">{detail.title || detail.specialization?.join(", ") || detail.mentor || "Profile details can be completed by a firm reviewer."}</p>
        </div>
      </CardBody>
    </Card>
  );
}

export function WorkSessionList({ sessions }) {
  if (!sessions.length) return <StateCard state="empty" title="No work sessions found" message="Work meter activity will appear here after sessions are recorded." />;
  return (
    <div className="grid gap-3">
      {sessions.map((session) => (
        <div className="rounded-lg border border-border bg-panel p-4" key={session.id}>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-bold text-ink">{session.activityType}</p>
              <p className="mt-1 text-sm text-muted">{session.client || "Client"} • {session.matter || "Matter"}</p>
            </div>
            <StatusBadge tone={session.status === "running" ? "success" : session.status === "paused" ? "warning" : "neutral"}>{session.status}</StatusBadge>
          </div>
          <p className="mt-2 text-sm font-semibold text-ink">
            Activity: {session.activitySummary?.sampleCount ? `${Number(session.activityPercent || 0).toLocaleString("en-IN", { maximumFractionDigits: 1 })}%` : "Not enough samples"}
          </p>
          <p className="mt-1 text-sm font-semibold text-ink">
            Apps and sites: {session.appUsageSummary?.eventCount ? formatUsageSeconds(session.appUsageSummary.durationSeconds) : "No app history"}
          </p>
          <p className="mt-1 text-sm font-semibold text-ink">
            Idle: {session.idleSummary?.count ? `${formatUsageSeconds(session.idleSummary.totalSeconds)} marked, ${formatUsageSeconds(session.idleSummary.discardedSeconds)} removed` : "No idle markers"}
          </p>
          <p className="mt-2 text-sm text-muted">{formatDate(session.startedAt)} • {formatHours(session.durationMinutes)}</p>
        </div>
      ))}
    </div>
  );
}
