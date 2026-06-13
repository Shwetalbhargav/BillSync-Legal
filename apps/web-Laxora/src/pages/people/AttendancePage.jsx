import { useEffect, useMemo, useState } from "react";
import { attendanceApi } from "../../api";
import { Button, SkeletonBlock, StateCard } from "../../components/common";
import { AttendanceHero, AttendanceIssues, AttendanceSummary, AttendanceTable, LeaveQueue, LeaveRequestForm } from "../../components/people/AttendanceWidgets";

const today = () => new Date().toISOString().slice(0, 10);
const initialLeaveForm = { startDate: today(), endDate: today(), leaveType: "vacation", reason: "" };

export function AttendancePage() {
  const [range, setRange] = useState({ from: today(), to: today() });
  const [leaveForm, setLeaveForm] = useState(initialLeaveForm);
  const [state, setState] = useState({ status: "loading", rows: [], summary: {}, requests: [], holidays: [], issues: [], message: "" });
  const [saving, setSaving] = useState(false);
  const [validation, setValidation] = useState("");

  async function load() {
    setState((current) => ({ ...current, status: "loading", message: "" }));
    try {
      const [attendance, requests, holidays] = await Promise.all([
        attendanceApi.list(range),
        attendanceApi.listLeaveRequests(),
        attendanceApi.listHolidays(),
      ]);
      setState({ status: "ready", rows: attendance.rows, summary: attendance.summary, requests, holidays, issues: [], message: "" });
    } catch (error) {
      setState({ status: "error", rows: [], summary: {}, requests: [], holidays: [], issues: [], message: error?.userMessage || "We could not load attendance right now." });
    }
  }

  useEffect(() => {
    load();
  }, [range.from, range.to]);

  const absenceRows = useMemo(() => state.rows.filter((row) => ["absent", "late", "leave"].includes(row.status)), [state.rows]);

  function updateLeave(field, value) {
    setValidation("");
    setLeaveForm((current) => ({ ...current, [field]: value }));
  }

  async function submitLeave() {
    if (!leaveForm.startDate || !leaveForm.endDate) {
      setValidation("Choose the leave dates before submitting.");
      return;
    }
    if (leaveForm.endDate < leaveForm.startDate) {
      setValidation("End date must be on or after the start date.");
      return;
    }
    setSaving(true);
    try {
      await attendanceApi.createLeaveRequest(leaveForm);
      setLeaveForm(initialLeaveForm);
      await load();
    } catch (error) {
      setState((current) => ({ ...current, issues: [error?.userMessage || "We could not submit the leave request right now."] }));
    } finally {
      setSaving(false);
    }
  }

  async function reviewLeave(request, decision) {
    setSaving(true);
    try {
      await attendanceApi.reviewLeaveRequest(request.id, { decision, reviewNote: decision === "approved" ? "Approved from attendance review." : "Needs an update before approval." });
      await load();
    } catch (error) {
      setState((current) => ({ ...current, issues: [error?.userMessage || "We could not update the leave request right now."] }));
    } finally {
      setSaving(false);
    }
  }

  if (state.status === "loading") return <SkeletonBlock />;
  if (state.status === "error") return <StateCard state="error" title="Attendance needs attention" message={state.message} actionLabel="Retry" onAction={load} />;

  return (
    <div className="space-y-6">
      <AttendanceHero />
      <AttendanceIssues issues={state.issues} />
      <section className="surface-card p-5">
        <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto] md:items-end">
          <label className="block text-sm font-semibold text-ink">From<input className="focus-ring mt-1 w-full rounded-lg border border-border px-3 py-3" onChange={(event) => setRange((current) => ({ ...current, from: event.target.value }))} type="date" value={range.from} /></label>
          <label className="block text-sm font-semibold text-ink">To<input className="focus-ring mt-1 w-full rounded-lg border border-border px-3 py-3" onChange={(event) => setRange((current) => ({ ...current, to: event.target.value }))} type="date" value={range.to} /></label>
          <Button onClick={load} type="button" variant="secondary">Refresh</Button>
        </div>
      </section>
      <AttendanceSummary summary={state.summary} />
      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="surface-card p-5">
          <h2 className="text-xl font-bold text-primary">Attendance calendar</h2>
          <p className="mt-1 text-sm leading-6 text-muted">Shows present, absent, late, leave, and holiday status for each selected day.</p>
          <div className="mt-4">
            <AttendanceTable rows={state.rows} />
          </div>
        </section>
        <LeaveRequestForm form={leaveForm} isSaving={saving} onChange={updateLeave} onSubmit={submitLeave} validation={validation} />
      </div>
      <section className="surface-card p-5">
        <h2 className="text-xl font-bold text-primary">Leave approval queue</h2>
        <p className="mt-1 text-sm leading-6 text-muted">Approved leave updates attendance and is included in payroll readiness context.</p>
        <div className="mt-4">
          <LeaveQueue requests={state.requests} isSaving={saving} onReview={reviewLeave} />
        </div>
      </section>
      <section className="surface-card p-5">
        <h2 className="text-xl font-bold text-primary">Absence exceptions</h2>
        <p className="mt-1 text-sm leading-6 text-muted">Late, absent, and leave days that may need review.</p>
        <div className="mt-4">
          <AttendanceTable rows={absenceRows} />
        </div>
      </section>
    </div>
  );
}
