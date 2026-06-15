import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, FileClock, RefreshCw, SendHorizontal, ShieldCheck } from "lucide-react";
import { timeApprovalWorkspaceApi } from "../../api/timeApprovalWorkspace";
import { useAuth } from "../../auth/AuthProvider";
import { Button, SkeletonBlock, StateCard } from "../../components/common";

const money = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

function formatMinutes(minutes) {
  const total = Math.max(0, Math.round(Number(minutes || 0)));
  const hours = Math.floor(total / 60);
  const mins = total % 60;
  return `${hours}h ${String(mins).padStart(2, "0")}m 00s`;
}

function formatSeconds(seconds) {
  const total = Math.max(0, Math.round(Number(seconds || 0)));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor(total / 60);
  const mins = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  if (hours) return `${hours}h ${String(mins).padStart(2, "0")}m ${String(secs).padStart(2, "0")}s`;
  return `0h ${String(minutes).padStart(2, "0")}m ${String(secs).padStart(2, "0")}s`;
}

function prettyValue(value, fallback = "Not set") {
  return value ? String(value).replaceAll("_", " ") : fallback;
}

function ReviewMetric({ label, value }) {
  return (
    <div className="rounded-lg border border-border bg-panel p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 truncate text-sm font-semibold text-ink" title={String(value)}>
        {value}
      </p>
    </div>
  );
}

function TimeApprovalCard({ entry, isSaving, onApprove, onReject }) {
  return (
    <article className="surface-card overflow-hidden">
      <div className="flex flex-col gap-4 border-b border-border p-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold uppercase tracking-wide text-accent">Submitted work</p>
          <h2 className="mt-1 break-words text-xl font-bold text-primary">{entry.title}</h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            {entry.user} submitted {formatMinutes(entry.minutes)} for {entry.client || "client not set"}.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button disabled={isSaving} isLoading={isSaving} onClick={() => onApprove(entry)} size="sm" variant="success">
            <CheckCircle2 className="h-4 w-4" />
            Approve
          </Button>
          <Button disabled={isSaving} onClick={() => onReject(entry)} size="sm" variant="secondary">
            <SendHorizontal className="h-4 w-4" />
            Send back
          </Button>
        </div>
      </div>

      <div className="grid gap-3 p-5 sm:grid-cols-2 xl:grid-cols-4">
        <ReviewMetric label="User" value={entry.user} />
        <ReviewMetric label="Client" value={entry.client || "Client not set"} />
        <ReviewMetric label="Matter" value={entry.matter || "Matter not set"} />
        <ReviewMetric label="Task" value={entry.task || "No linked task"} />
        <ReviewMetric label="Work type" value={prettyValue(entry.workType)} />
        <ReviewMetric label="Work tool" value={prettyValue(entry.workTool)} />
        <ReviewMetric label="App used" value={entry.topApp || "No app recorded"} />
        <ReviewMetric label="App time" value={entry.appUsageSeconds ? formatSeconds(entry.appUsageSeconds) : "No app history"} />
        <ReviewMetric label="Time recorded" value={formatMinutes(entry.minutes)} />
        <ReviewMetric label="Keyboard activity" value={`${entry.keyboardCount} counts`} />
        <ReviewMetric label="Mouse activity" value={`${entry.mouseCount} counts`} />
        <ReviewMetric label="Idle time" value={formatSeconds(entry.idleSeconds)} />
        <ReviewMetric label="Rate per hour" value={entry.rateApplied ? money.format(entry.rateApplied) : "Rate needed"} />
        <ReviewMetric label="Charges applied" value={money.format(entry.amount)} />
      </div>
    </article>
  );
}

export function TimeApprovalPage() {
  const { role } = useAuth();
  const normalizedRole = String(role || "").toLowerCase();
  const [state, setState] = useState({ status: "loading", entries: [], message: "", success: "" });
  const [savingId, setSavingId] = useState("");
  const canReview = normalizedRole === "admin" || normalizedRole === "partner";

  async function load() {
    setState((current) => ({ ...current, status: "loading", message: "", success: "" }));
    try {
      const entries = await timeApprovalWorkspaceApi.loadSubmittedQueue();
      setState({ status: entries.length ? "ready" : "empty", entries, message: "", success: "" });
    } catch (error) {
      setState({ status: "error", entries: [], message: error?.userMessage || "We could not load submitted work right now.", success: "" });
    }
  }

  useEffect(() => {
    if (canReview) load();
  }, [canReview]);

  async function approve(entry) {
    setSavingId(entry.id);
    try {
      await timeApprovalWorkspaceApi.approve(entry.id);
      const entries = state.entries.filter((item) => item.id !== entry.id);
      setState({
        status: entries.length ? "ready" : "empty",
        entries,
        message: "",
        success: "Work approved. It is now ready for billing review.",
      });
    } catch (error) {
      setState((current) => ({ ...current, message: error?.userMessage || "We could not approve this work right now." }));
    } finally {
      setSavingId("");
    }
  }

  async function reject(entry) {
    const reason = window.prompt("Add a short reason so the team member knows what to correct.");
    if (!reason?.trim()) return;
    setSavingId(entry.id);
    try {
      await timeApprovalWorkspaceApi.reject(entry.id, reason.trim());
      const entries = state.entries.filter((item) => item.id !== entry.id);
      setState({
        status: entries.length ? "ready" : "empty",
        entries,
        message: "",
        success: "Work sent back for correction.",
      });
    } catch (error) {
      setState((current) => ({ ...current, message: error?.userMessage || "We could not send this work back right now." }));
    } finally {
      setSavingId("");
    }
  }

  const totals = useMemo(() => state.entries.reduce((sum, entry) => ({
    minutes: sum.minutes + Number(entry.minutes || 0),
    amount: sum.amount + Number(entry.amount || 0),
  }), { minutes: 0, amount: 0 }), [state.entries]);

  if (!canReview) {
    return <StateCard state="permission" title="Review access needed" message="Only admins and partners can approve or send back submitted work." />;
  }

  return (
    <div className="space-y-6">
      <section className="surface-card p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-accent">Work approval</p>
            <h1 className="mt-1 text-2xl font-bold text-primary md:text-3xl">Approve Submitted Work</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">
              Review time entries before they move to billing. Activity shows counts and timing only.
            </p>
          </div>
          <Button onClick={load} variant="secondary">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <ReviewMetric label="Waiting entries" value={state.entries.length} />
          <ReviewMetric label="Time waiting" value={formatMinutes(totals.minutes)} />
          <ReviewMetric label="Charges waiting" value={money.format(totals.amount)} />
        </div>
      </section>

      {state.success ? (
        <div className="flex items-center gap-3 rounded-lg border border-success/30 bg-success/10 p-4 text-sm font-semibold text-success">
          <ShieldCheck className="h-5 w-5" />
          {state.success}
        </div>
      ) : null}
      {state.message && state.status !== "error" ? (
        <div className="rounded-lg border border-warning/30 bg-warning/10 p-4 text-sm font-semibold text-warning">{state.message}</div>
      ) : null}

      {state.status === "loading" ? <SkeletonBlock /> : null}
      {state.status === "error" ? (
        <StateCard state="error" title="Submitted work needs attention" message={state.message} actionLabel="Retry" onAction={load} />
      ) : null}
      {state.status === "empty" ? (
        <StateCard
          state="empty"
          title="No submitted work waiting"
          message="When lawyers submit saved meter work, it will appear here for approval."
        />
      ) : null}
      {state.status === "ready" ? (
        <div className="space-y-4">
          {state.entries.map((entry) => (
            <TimeApprovalCard
              key={entry.id}
              entry={entry}
              isSaving={savingId === entry.id}
              onApprove={approve}
              onReject={reject}
            />
          ))}
        </div>
      ) : null}

      <section className="surface-card p-5">
        <div className="flex items-start gap-3">
          <FileClock className="mt-0.5 h-5 w-5 text-primary" />
          <p className="text-sm leading-6 text-muted">
            Approval creates billing-ready work from approved billable time. Invoice screens can then pull approved billables into client bills.
          </p>
        </div>
      </section>
    </div>
  );
}
