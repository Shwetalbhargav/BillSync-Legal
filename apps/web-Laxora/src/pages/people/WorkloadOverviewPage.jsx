import { useEffect, useState } from "react";
import { peopleWorkspaceApi } from "../../api";
import { SkeletonBlock, StateCard } from "../../components/common";
import { AttendanceNotConfigured, PeopleHero, PeopleSummary, SectionIssues, WorkSessionList, WorkloadTable } from "../../components/people/PeopleWidgets";

export function WorkloadOverviewPage() {
  const [state, setState] = useState({ status: "loading", people: [], activeSessions: [], workSessions: [], issues: [], message: "" });

  async function load() {
    setState((current) => ({ ...current, status: "loading", message: "" }));
    try {
      const data = await peopleWorkspaceApi.loadDashboard();
      setState({ status: "ready", message: "", ...data });
    } catch (error) {
      setState({ status: "error", people: [], activeSessions: [], workSessions: [], issues: [], message: error?.userMessage || "We could not load workload details right now." });
    }
  }

  useEffect(() => {
    load();
  }, []);

  if (state.status === "loading") return <SkeletonBlock />;
  if (state.status === "error") return <StateCard state="error" title="Workload needs attention" message={state.message} actionLabel="Retry" onAction={load} />;

  return (
    <div className="space-y-6">
      <PeopleHero title="Workload and attendance" subtitle="Review capacity signals from work records, with attendance clearly marked until dedicated records exist." />
      <SectionIssues issues={state.issues} />
      <PeopleSummary people={state.people} activeSessions={state.activeSessions} />
      <AttendanceNotConfigured />
      <section className="surface-card p-5">
        <h2 className="text-xl font-bold text-primary">Workload by person</h2>
        <div className="mt-4">
          <WorkloadTable people={state.people} />
        </div>
      </section>
      <section className="surface-card p-5">
        <h2 className="text-xl font-bold text-primary">Recent work sessions</h2>
        <div className="mt-4">
          <WorkSessionList sessions={state.workSessions.slice(0, 12)} />
        </div>
      </section>
    </div>
  );
}
