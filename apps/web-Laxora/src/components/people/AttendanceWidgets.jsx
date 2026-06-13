import { AlertCircle, CalendarDays, CheckCircle2, Clock3, Plane, XCircle } from "lucide-react";
import { Button, Card, CardBody, CardHeader, DataTable, StateCard, StatusBadge } from "../common";

export function formatDate(value) {
  if (!value) return "Not set";
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? "Not set" : date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export function formatTime(value) {
  if (!value) return "Not recorded";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Not recorded" : date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

function statusTone(status) {
  if (status === "present" || status === "approved") return "success";
  if (status === "late" || status === "pending") return "warning";
  if (status === "absent" || status === "rejected") return "danger";
  return "neutral";
}

export function AttendanceHero() {
  return (
    <section className="surface-card p-6">
      <div className="flex min-w-0 flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold uppercase tracking-wide text-accent">People</p>
          <h1 className="mt-1 text-2xl font-bold text-primary md:text-3xl">Attendance and leave</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">Review daily attendance from work activity, approved leave, and firm holidays.</p>
        </div>
        <div className="rounded-lg bg-blueSoft p-3 text-primary">
          <CalendarDays className="h-6 w-6" />
        </div>
      </div>
    </section>
  );
}

export function AttendanceSummary({ summary }) {
  const cards = [
    { label: "Present", value: summary.present, icon: CheckCircle2, tone: "success" },
    { label: "Late", value: summary.late, icon: Clock3, tone: "warning" },
    { label: "Absent", value: summary.absent, icon: XCircle, tone: "danger" },
    { label: "On leave", value: summary.leave, icon: Plane, tone: "neutral" },
  ];
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cards.map(({ icon: Icon, label, tone, value }) => (
        <div className="rounded-lg border border-border bg-panel p-4" key={label}>
          <div className={`mb-3 inline-flex rounded-lg p-2 ${tone === "success" ? "bg-success/10 text-success" : tone === "warning" ? "bg-warning/10 text-warning" : tone === "danger" ? "bg-danger/10 text-danger" : "bg-blueSoft text-primary"}`}>
            <Icon className="h-4 w-4" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
          <p className="mt-1 text-lg font-bold text-primary">{value || 0}</p>
        </div>
      ))}
    </div>
  );
}

export function AttendanceTable({ rows }) {
  if (!rows.length) return <StateCard state="empty" title="No attendance records" message="Records appear after work sessions, leave, or holidays are found for the selected dates." />;
  return (
    <DataTable
      columns={[
        { key: "date", label: "Date" },
        { key: "name", label: "Team member" },
        { key: "status", label: "Status" },
        { key: "first", label: "First activity" },
        { key: "last", label: "Last activity" },
        { key: "late", label: "Late" },
      ]}
      rows={rows.map((row) => ({
        id: row.id || `${row.userId}-${row.date}`,
        date: formatDate(row.date),
        name: row.userName,
        status: <StatusBadge tone={statusTone(row.status)}>{row.status}</StatusBadge>,
        first: formatTime(row.firstActivityAt),
        last: formatTime(row.lastActivityAt),
        late: row.lateMinutes ? `${row.lateMinutes} min` : "No",
      }))}
    />
  );
}

export function LeaveRequestForm({ form, isSaving, onChange, onSubmit, validation }) {
  return (
    <Card>
      <CardHeader title="Request leave" description="Send a leave request for review." />
      <CardBody className="space-y-3">
        {validation ? <p className="rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm font-semibold text-warning">{validation}</p> : null}
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm font-semibold text-ink">Start date<input className="focus-ring mt-1 w-full rounded-lg border border-border px-3 py-3" onChange={(event) => onChange("startDate", event.target.value)} type="date" value={form.startDate} /></label>
          <label className="block text-sm font-semibold text-ink">End date<input className="focus-ring mt-1 w-full rounded-lg border border-border px-3 py-3" onChange={(event) => onChange("endDate", event.target.value)} type="date" value={form.endDate} /></label>
        </div>
        <label className="block text-sm font-semibold text-ink">Type<select className="focus-ring mt-1 w-full rounded-lg border border-border px-3 py-3" onChange={(event) => onChange("leaveType", event.target.value)} value={form.leaveType}>
          <option value="vacation">Vacation</option>
          <option value="sick">Sick leave</option>
          <option value="personal">Personal</option>
          <option value="court_duty">Court duty</option>
          <option value="unpaid">Unpaid</option>
          <option value="other">Other</option>
        </select></label>
        <label className="block text-sm font-semibold text-ink">Note<textarea className="focus-ring mt-1 min-h-24 w-full rounded-lg border border-border px-3 py-3" onChange={(event) => onChange("reason", event.target.value)} placeholder="Short note for the reviewer" value={form.reason} /></label>
        <Button disabled={isSaving} isLoading={isSaving} onClick={onSubmit} type="button">Submit request</Button>
      </CardBody>
    </Card>
  );
}

export function LeaveQueue({ requests, isSaving, onReview }) {
  if (!requests.length) return <StateCard state="empty" title="No leave requests" message="Leave requests will appear here after the team submits them." />;
  return (
    <div className="grid gap-3">
      {requests.map((request) => (
        <div className="rounded-lg border border-border bg-panel p-4" key={request.id}>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-bold text-primary">{request.userName}</p>
                <StatusBadge tone={statusTone(request.status)}>{request.status}</StatusBadge>
              </div>
              <p className="mt-1 text-sm text-muted">{formatDate(request.startDate)} to {formatDate(request.endDate)} - {request.leaveType.replaceAll("_", " ")}</p>
              <p className="mt-1 text-sm leading-6 text-ink">{request.reason || "No note added."}</p>
            </div>
            {request.status === "pending" ? (
              <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
                <Button disabled={isSaving} onClick={() => onReview(request, "approved")} size="sm" type="button" variant="success">Approve</Button>
                <Button disabled={isSaving} onClick={() => onReview(request, "rejected")} size="sm" type="button" variant="danger">Reject</Button>
              </div>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}

export function AttendanceIssues({ issues }) {
  if (!issues?.length) return null;
  return (
    <section className="rounded-lg border border-warning/30 bg-warning/10 p-4">
      <div className="flex gap-3">
        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
        <p className="text-sm font-semibold leading-6 text-warning">{issues.join(" ")}</p>
      </div>
    </section>
  );
}
