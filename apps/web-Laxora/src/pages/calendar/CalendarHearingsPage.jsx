import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { calendarApi } from "../../api/calendar";
import { SkeletonBlock, StateCard } from "../../components/common";
import { CalendarConnectionState, HearingList, HearingSummary, HearingTimeList, SectionIssues } from "../../components/calendar/CalendarWidgets";

export function CalendarHearingsPage() {
  const [state, setState] = useState({ status: "loading", hearings: [], sessions: [], timeEntries: [], issues: [], message: "" });

  async function load() {
    setState((current) => ({ ...current, status: "loading", message: "" }));
    try {
      const data = await calendarApi.loadHearings();
      setState({ status: "ready", message: "", ...data });
    } catch (error) {
      setState({ status: "error", hearings: [], sessions: [], timeEntries: [], issues: [], message: error?.userMessage || "We could not load hearings right now." });
    }
  }

  useEffect(() => {
    load();
  }, []);

  if (state.status === "loading") return <SkeletonBlock />;
  if (state.status === "error") return <StateCard state="error" title="Calendar needs attention" message={state.message} actionLabel="Retry" />;

  return (
    <div className="space-y-6">
      <section className="surface-card p-6">
        <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-semibold uppercase tracking-wide text-accent">Calendar</p>
            <h1 className="mt-1 text-2xl font-bold text-primary md:text-3xl">Calendar and Hearings</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">Track hearing activity, court time, and connection readiness for matter work.</p>
          </div>
          <Link className="focus-ring inline-flex justify-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primaryStrong" to="/app/hearings/manual-time">
            Add hearing time
          </Link>
        </div>
      </section>

      <CalendarConnectionState />
      <SectionIssues issues={state.issues} />
      <HearingSummary hearings={state.hearings} sessions={state.sessions} timeEntries={state.timeEntries} />
      <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <HearingList hearings={state.hearings} />
        <HearingTimeList timeEntries={state.timeEntries} />
      </div>
    </div>
  );
}
