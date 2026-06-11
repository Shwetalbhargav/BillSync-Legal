import { useEffect, useState } from "react";
import { peopleWorkspaceApi } from "../../api";
import { SkeletonBlock, StateCard } from "../../components/common";
import { PeopleHero, SectionIssues, TeamDirectoryTable } from "../../components/people/PeopleWidgets";

export function TeamDirectoryPage() {
  const [state, setState] = useState({ status: "loading", people: [], issues: [], message: "" });

  async function load() {
    setState((current) => ({ ...current, status: "loading", message: "" }));
    try {
      const data = await peopleWorkspaceApi.loadDashboard();
      setState({ status: "ready", message: "", ...data });
    } catch (error) {
      setState({ status: "error", people: [], issues: [], message: error?.userMessage || "We could not load the team directory right now." });
    }
  }

  useEffect(() => {
    load();
  }, []);

  if (state.status === "loading") return <SkeletonBlock />;
  if (state.status === "error") return <StateCard state="error" title="Team directory needs attention" message={state.message} actionLabel="Retry" />;

  return (
    <div className="space-y-6">
      <PeopleHero title="Team directory" subtitle="Review team members, roles, contact details, and workload context." />
      <SectionIssues issues={state.issues} />
      <section className="surface-card p-5">
        <TeamDirectoryTable people={state.people} />
      </section>
    </div>
  );
}
