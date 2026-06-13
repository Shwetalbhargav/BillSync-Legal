import { useEffect, useMemo, useState } from "react";
import { workforceAnalyticsApi } from "../../api";
import { SkeletonBlock, StateCard } from "../../components/common";
import {
  UsageList,
  WorkforceFilters,
  WorkforceHero,
  WorkforceIssues,
  WorkforceRowsTable,
  WorkforceSummary,
} from "../../components/people/WorkforceAnalyticsWidgets";

const isoDate = (date) => date.toISOString().slice(0, 10);
const defaultFilters = () => {
  const to = new Date();
  const from = new Date(to.getTime() - 6 * 24 * 60 * 60 * 1000);
  return { from: isoDate(from), to: isoDate(to), userId: "", clientId: "", matterId: "", taskId: "", team: "" };
};

function csvValue(value) {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function downloadCsv(rows) {
  const headers = ["Person", "Client", "Matter", "Task", "Date", "Minutes", "Activity %", "Idle %", "Approval", "Attendance", "Payroll ready", "Billable ready"];
  const lines = rows.map((row) => [
    row.userName,
    row.clientName,
    row.matterName,
    row.taskName,
    row.date,
    row.trackedMinutes,
    row.activityPercent,
    row.idlePercent,
    row.approvalStatus,
    row.attendanceStatus,
    row.payrollReady ? "Yes" : "No",
    row.billableReady ? "Yes" : "No",
  ].map(csvValue).join(","));
  const blob = new Blob([[headers.map(csvValue).join(","), ...lines].join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `workforce-analytics-${isoDate(new Date())}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export function WorkforceAnalyticsPage() {
  const [filters, setFilters] = useState(defaultFilters);
  const [state, setState] = useState({ status: "loading", report: null, message: "", success: "" });

  const requestParams = useMemo(() => Object.fromEntries(Object.entries(filters).filter(([, value]) => value)), [filters]);

  async function load() {
    setState((current) => ({ ...current, status: "loading", message: "", success: "" }));
    try {
      const report = await workforceAnalyticsApi.dashboard(requestParams);
      setState({ status: "ready", report, message: "", success: "" });
    } catch (error) {
      setState({ status: error?.status === 403 ? "permission" : "error", report: null, message: error?.userMessage || "We could not load workforce analytics right now.", success: "" });
    }
  }

  useEffect(() => {
    load();
  }, [requestParams.from, requestParams.to, requestParams.userId, requestParams.clientId, requestParams.matterId, requestParams.taskId, requestParams.team]);

  function updateFilter(field, value) {
    setFilters((current) => ({ ...current, [field]: value }));
  }

  function exportReport() {
    if (!state.report?.rows?.length) return;
    downloadCsv(state.report.rows);
    setState((current) => ({ ...current, success: "Report export is ready." }));
  }

  if (state.status === "loading") return <SkeletonBlock />;
  if (state.status === "permission") return <StateCard state="permission" title="Workforce analytics is restricted" message="Ask a firm reviewer to open this report." />;
  if (state.status === "error") return <StateCard state="error" title="Workforce analytics needs attention" message={state.message} actionLabel="Retry" onAction={load} />;

  const report = state.report || {};

  return (
    <div className="space-y-6">
      <WorkforceHero onExport={exportReport} rows={report.rows || []} />
      {state.success ? <section className="rounded-lg border border-success/30 bg-success/10 p-4 text-sm font-semibold text-success">{state.success}</section> : null}
      <WorkforceIssues issues={report.gaps || []} />
      <WorkforceFilters filters={report.filters || { users: [], clients: [], matters: [], tasks: [] }} form={filters} onChange={updateFilter} onRefresh={load} />
      <WorkforceSummary summary={report.summary || {}} />
      <section className="surface-card p-5">
        <h2 className="text-xl font-bold text-primary">Tracked work detail</h2>
        <p className="mt-1 text-sm leading-6 text-muted">Review person, client, matter, task, time, activity, attendance, and readiness in one place.</p>
        <div className="mt-4">
          <WorkforceRowsTable rows={report.rows || []} />
        </div>
      </section>
      <div className="grid gap-6 xl:grid-cols-2">
        <UsageList emptyText="No app time found" rows={report.appUsage || []} title="App totals" />
        <UsageList emptyText="No website time found" rows={report.domainUsage || []} title="Website totals" />
      </div>
    </div>
  );
}
