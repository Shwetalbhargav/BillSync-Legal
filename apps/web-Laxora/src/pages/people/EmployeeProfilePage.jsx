import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { peopleWorkspaceApi } from "../../api";
import { SkeletonBlock, StateCard } from "../../components/common";
import { EmployeeProfileCard, PeopleHero, SectionIssues, WorkSessionList, WorkloadTable } from "../../components/people/PeopleWidgets";

export function EmployeeProfilePage() {
  const { userId } = useParams();
  const [state, setState] = useState({ status: "loading", person: null, profile: null, timeEntries: [], workSessions: [], issues: [], message: "" });

  async function load() {
    setState((current) => ({ ...current, status: "loading", message: "" }));
    try {
      const data = await peopleWorkspaceApi.loadPerson(userId);
      setState({ status: "ready", message: "", ...data });
    } catch (error) {
      setState({ status: "error", person: null, profile: null, timeEntries: [], workSessions: [], issues: [], message: error?.userMessage || "We could not load this employee profile right now." });
    }
  }

  useEffect(() => {
    load();
  }, [userId]);

  if (state.status === "loading") return <SkeletonBlock />;
  if (state.status === "error") return <StateCard state="error" title="Employee profile needs attention" message={state.message} actionLabel="Retry" />;

  return (
    <div className="space-y-6">
      <PeopleHero title="Employee profile" subtitle="Review profile details, workload, and recent work sessions." />
      <SectionIssues issues={state.issues} />
      <EmployeeProfileCard person={state.person} profile={state.profile} />
      <section className="surface-card p-5">
        <h2 className="text-xl font-bold text-primary">Workload</h2>
        <div className="mt-4">
          <WorkloadTable people={state.person ? [state.person] : []} />
        </div>
      </section>
      <section className="surface-card p-5">
        <h2 className="text-xl font-bold text-primary">Work sessions</h2>
        <div className="mt-4">
          <WorkSessionList sessions={state.workSessions} />
        </div>
      </section>
    </div>
  );
}
