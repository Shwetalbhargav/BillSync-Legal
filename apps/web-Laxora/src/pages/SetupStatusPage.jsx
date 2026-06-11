import { useEffect, useState } from "react";
import { dashboardApi } from "../api/dashboard";
import { useAuth } from "../auth/AuthProvider";
import { SkeletonBlock, StateCard } from "../components/common";
import { SetupCard } from "../components/dashboard/DashboardWidgets";

export function SetupStatusPage() {
  const { role } = useAuth();
  const [state, setState] = useState({ status: "loading", cards: [] });

  useEffect(() => {
    dashboardApi.setupStatus(role).then((data) => setState({ status: "ready", cards: data.cards }));
  }, [role]);

  if (state.status === "loading") return <SkeletonBlock />;

  return (
    <div className="space-y-6">
      <section className="surface-card p-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-accent">Setup Confidence</p>
        <h1 className="mt-1 text-2xl font-bold text-primary md:text-3xl">My Setup Status</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">Check the workspace pieces that help BillSync capture work and prepare clean billing records.</p>
      </section>
      <div className="grid gap-4 xl:grid-cols-2">
        {state.cards.map((item) => <SetupCard item={item} key={item.id} />)}
      </div>
      <StateCard state="empty" title="Calendar sync is planned" message="Use manual time entry while the calendar setup flow is prepared for testers." />
    </div>
  );
}
