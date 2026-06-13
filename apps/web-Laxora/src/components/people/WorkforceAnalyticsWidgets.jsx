import { BarChart3, BriefcaseBusiness, Clock3, Download, Gauge, TimerReset, Users } from "lucide-react";
import { Button, DataTable, StateCard, StatusBadge } from "../common";

export function formatMinutes(minutes) {
  const total = Math.max(0, Number(minutes || 0));
  const hours = Math.floor(total / 60);
  const mins = Math.round(total % 60);
  return hours ? `${hours}h ${String(mins).padStart(2, "0")}m` : `${mins}m`;
}

export function formatPercent(value) {
  return `${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 1 })}%`;
}

export function formatMoney(value) {
  return `Rs ${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

function Metric({ icon: Icon, label, value, tone = "neutral" }) {
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

export function WorkforceHero({ onExport, rows }) {
  return (
    <section className="surface-card p-6">
      <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold uppercase tracking-wide text-accent">People</p>
          <h1 className="mt-1 text-2xl font-bold text-primary md:text-3xl">Workforce analytics</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">Review who worked, where time went, attendance status, review progress, and payroll readiness from privacy-safe work records.</p>
        </div>
        <Button disabled={!rows.length} onClick={onExport} type="button" variant="secondary">
          <Download className="h-4 w-4" /> Export report
        </Button>
      </div>
    </section>
  );
}

export function WorkforceFilters({ filters, form, onChange, onRefresh }) {
  const choices = [
    ["userId", "Person", filters.users],
    ["clientId", "Client", filters.clients],
    ["matterId", "Matter", filters.matters],
    ["taskId", "Task", filters.tasks],
  ];
  return (
    <section className="surface-card p-5">
      <div className="grid gap-3 lg:grid-cols-6 lg:items-end">
        <label className="block text-sm font-semibold text-ink">From<input className="focus-ring mt-1 w-full rounded-lg border border-border px-3 py-3" onChange={(event) => onChange("from", event.target.value)} type="date" value={form.from} /></label>
        <label className="block text-sm font-semibold text-ink">To<input className="focus-ring mt-1 w-full rounded-lg border border-border px-3 py-3" onChange={(event) => onChange("to", event.target.value)} type="date" value={form.to} /></label>
        {choices.map(([field, label, options]) => (
          <label className="block text-sm font-semibold text-ink" key={field}>
            {label}
            <select className="focus-ring mt-1 w-full rounded-lg border border-border px-3 py-3" onChange={(event) => onChange(field, event.target.value)} value={form[field]}>
              <option value="">All</option>
              {options.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
            </select>
          </label>
        ))}
        <Button onClick={onRefresh} type="button" variant="secondary">Refresh</Button>
      </div>
      {!filters.teamEnabled ? <p className="mt-3 text-sm leading-6 text-muted">Named team filters will appear after team records are connected. Use person, client, matter, or task filters for this report.</p> : null}
    </section>
  );
}

export function WorkforceSummary({ summary }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <Metric icon={Clock3} label="Tracked time" value={formatMinutes(summary.trackedMinutes)} />
      <Metric icon={BriefcaseBusiness} label="Billable share" value={formatPercent(summary.billablePercent)} tone="success" />
      <Metric icon={Gauge} label="Activity" value={formatPercent(summary.activityPercent)} />
      <Metric icon={TimerReset} label="Idle time" value={formatPercent(summary.idlePercent)} tone={summary.idlePercent > 15 ? "warning" : "neutral"} />
      <Metric icon={Users} label="People" value={summary.people} />
      <Metric icon={BarChart3} label="Utilization" value={formatPercent(summary.utilizationPercent)} />
      <Metric icon={Clock3} label="Review time" value={`${Number(summary.approvalSlaHours || 0).toLocaleString("en-IN", { maximumFractionDigits: 1 })}h`} />
      <Metric icon={BriefcaseBusiness} label="Payroll ready" value={`${formatMinutes(summary.payrollReadyMinutes)} / ${formatMoney(summary.payrollReadyAmount)}`} tone="success" />
    </div>
  );
}

export function WorkforceRowsTable({ rows }) {
  if (!rows.length) return <StateCard state="empty" title="No tracked work found" message="Try a wider date range or clear one of the filters." />;
  return (
    <DataTable
      label="Workforce analytics"
      columns={[
        { key: "person", label: "Person" },
        { key: "work", label: "Client and matter" },
        { key: "time", label: "Time" },
        { key: "activity", label: "Activity" },
        { key: "status", label: "Status" },
        { key: "readiness", label: "Readiness" },
      ]}
      rows={rows.map((row) => ({
        id: row.id,
        person: <div><p className="font-semibold">{row.userName}</p><p className="text-xs text-muted">{row.date}</p></div>,
        work: <div><p className="font-semibold">{row.clientName}</p><p className="text-xs text-muted">{row.matterName}{row.taskName ? ` / ${row.taskName}` : ""}</p></div>,
        time: <div><p>{formatMinutes(row.trackedMinutes)}</p><p className="text-xs text-muted">{row.activityType}</p></div>,
        activity: <div><p>{formatPercent(row.activityPercent)} active</p><p className="text-xs text-muted">{formatPercent(row.idlePercent)} idle</p></div>,
        status: <div className="flex flex-col gap-1"><StatusBadge>{row.approvalStatus}</StatusBadge><span className="text-xs text-muted">{row.attendanceStatus}</span></div>,
        readiness: <div className="flex flex-col gap-1"><StatusBadge tone={row.payrollReady ? "success" : "neutral"}>{row.payrollReady ? "Payroll ready" : "Needs review"}</StatusBadge><span className="text-xs text-muted">{row.billableReady ? "Billable ready" : "Billable pending"}</span></div>,
      }))}
    />
  );
}

export function UsageList({ emptyText, rows, title }) {
  return (
    <section className="surface-card p-5">
      <h2 className="text-xl font-bold text-primary">{title}</h2>
      <div className="mt-4 space-y-3">
        {rows.length ? rows.map((row) => (
          <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-panel p-3" key={row.id}>
            <span className="min-w-0 break-words text-sm font-semibold text-ink">{row.name}</span>
            <span className="shrink-0 text-sm text-muted">{formatMinutes(row.minutes)}</span>
          </div>
        )) : <StateCard state="empty" title={emptyText} message="This section will fill in after matching work records are available." />}
      </div>
    </section>
  );
}

export function WorkforceIssues({ issues }) {
  if (!issues.length) return null;
  return (
    <section className="rounded-lg border border-warning/30 bg-warning/10 p-4 text-sm font-semibold leading-6 text-warning">
      {issues.join(" ")}
    </section>
  );
}
