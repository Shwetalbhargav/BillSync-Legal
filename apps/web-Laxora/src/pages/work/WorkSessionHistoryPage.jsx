import { useEffect, useState } from "react";
import { timeEntriesApi } from "../../api/timeEntries";
import { workCaptureApi } from "../../api/workCapture";
import { SkeletonBlock, StateCard } from "../../components/common";
import { AppUsageTimeline, WorkSessionTable, TimeEntryList } from "../../components/work/WorkCaptureWidgets";

export function WorkSessionHistoryPage() {
  const [state, setState] = useState({ status: "loading", sessions: [], timeEntries: [], issues: [], message: "" });

  async function load() {
    setState((current) => ({ ...current, status: "loading", message: "" }));
    try {
      const data = await workCaptureApi.loadHistory();
      setState({ status: "ready", sessions: data.sessions, timeEntries: data.timeEntries, issues: data.issues || [], message: "" });
    } catch (error) {
      setState({ status: "error", sessions: [], timeEntries: [], issues: [], message: error?.userMessage || "We could not load work history right now." });
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function submitEntry(entry) {
    try {
      await timeEntriesApi.submit(entry.id);
      await load();
    } catch (error) {
      setState({ status: "error", sessions: [], timeEntries: [], issues: [], message: error?.userMessage || "We could not submit this work right now." });
    }
  }

  if (state.status === "loading") return <SkeletonBlock />;
  if (state.status === "error") return <StateCard state="error" title="Work history needs attention" message={state.message} actionLabel="Retry" onAction={load} />;

  return (
    <div className="space-y-6">
      <section className="surface-card p-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-accent">Time Capture</p>
        <h1 className="mt-1 text-2xl font-bold text-primary md:text-3xl">Work Session History</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">Review meter sessions and the time entries created from them.</p>
      </section>
      {state.issues.length ? (
        <section className="rounded-lg border border-warning/30 bg-warning/10 p-4 text-sm font-semibold text-warning">
          {state.issues.join(" ")}
        </section>
      ) : null}
      <WorkSessionTable sessions={state.sessions} />
      <AppUsageTimeline sessions={state.sessions} />
      <TimeEntryList entries={state.timeEntries.filter((entry) => entry.status === "draft")} onSubmit={submitEntry} />
    </div>
  );
}
