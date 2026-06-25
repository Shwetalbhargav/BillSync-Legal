import { useEffect, useState } from "react";
import { dashboardApi } from "../api/dashboard";
import { useAuth } from "../auth/AuthProvider";
import { SkeletonBlock, StateCard } from "../components/common";
import { SetupCard } from "../components/dashboard/DashboardWidgets";

const onboardingSteps = [
  "Create account",
  "Workspace details",
  "Choose plan",
  "Invite members",
  "Tax defaults",
  "Billing defaults",
  "Default rate",
  "First client",
  "First matter",
  "First work entry",
];

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
        <p className="text-sm font-semibold uppercase tracking-wide text-accent">Workspace Onboarding</p>
        <h1 className="mt-1 text-2xl font-bold text-primary md:text-3xl">Setup Status</h1>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {onboardingSteps.map((step, index) => (
            <div className="rounded-lg border border-border bg-white p-3" key={step}>
              <p className="text-xs font-semibold uppercase text-muted">Step {index + 1}</p>
              <p className="mt-1 text-sm font-semibold text-ink">{step}</p>
            </div>
          ))}
        </div>
      </section>
      <div className="grid gap-4 xl:grid-cols-2">
        {state.cards.map((item) => <SetupCard item={item} key={item.id} />)}
      </div>
      <StateCard state="empty" title="Calendar sync is planned" message="Use manual time entry while the calendar setup flow is prepared for testers." />
    </div>
  );
}
