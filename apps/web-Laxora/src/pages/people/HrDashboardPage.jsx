import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { peopleWorkspaceApi } from "../../api";
import { Button, SkeletonBlock, StateCard } from "../../components/common";
import { AttendanceNotConfigured, PeopleHero, PeopleSummary, SectionIssues, TeamDirectoryTable, WorkloadTable } from "../../components/people/PeopleWidgets";

export function HrDashboardPage() {
  const [state, setState] = useState({ status: "loading", people: [], activeSessions: [], issues: [], message: "" });

  async function load() {
    setState((current) => ({ ...current, status: "loading", message: "" }));
    try {
      const data = await peopleWorkspaceApi.loadDashboard();
      setState({ status: "ready", message: "", ...data });
    } catch (error) {
      setState({ status: "error", people: [], activeSessions: [], issues: [], message: error?.userMessage || "We could not load people details right now." });
    }
  }

  useEffect(() => {
    load();
  }, []);

  if (state.status === "loading") return <SkeletonBlock />;
  if (state.status === "error") return <StateCard state="error" title="People dashboard needs attention" message={state.message} actionLabel="Retry" />;

  return (
    <div className="space-y-6">
      <PeopleHero />
      <SectionIssues issues={state.issues} />
      <PeopleSummary people={state.people} activeSessions={state.activeSessions} />
      <AttendanceNotConfigured />
      <section className="surface-card p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-primary">Workforce analytics</h2>
            <p className="mt-1 text-sm leading-6 text-muted">Review tracked time, activity, attendance, approval progress, and payroll readiness.</p>
          </div>
          <Link to="/app/workforce-analytics">
            <Button type="button" variant="secondary">Open analytics</Button>
          </Link>
        </div>
      </section>
      <section className="surface-card p-5">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-primary">Team directory</h2>
            <p className="mt-1 text-sm text-muted">Review people and open profiles for workload context.</p>
          </div>
          <Link to="/app/people">
            <Button type="button" variant="secondary">Open directory</Button>
          </Link>
        </div>
        <TeamDirectoryTable people={state.people.slice(0, 8)} />
      </section>
      <section className="surface-card p-5">
        <h2 className="text-xl font-bold text-primary">Workload overview</h2>
        <p className="mt-1 text-sm leading-6 text-muted">Uses submitted time and work meter records where available.</p>
        <div className="mt-4">
          <WorkloadTable people={state.people} />
        </div>
      </section>
    </div>
  );
}
