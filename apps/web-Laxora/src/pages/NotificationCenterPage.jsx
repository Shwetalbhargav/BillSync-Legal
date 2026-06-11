import { useEffect, useState } from "react";
import { dashboardApi } from "../api/dashboard";
import { useAuth } from "../auth/AuthProvider";
import { SkeletonBlock, StateCard } from "../components/common";
import { NotificationItem } from "../components/dashboard/DashboardWidgets";

export function NotificationCenterPage() {
  const { role } = useAuth();
  const [state, setState] = useState({ status: "loading", items: [] });

  useEffect(() => {
    dashboardApi.loadDashboard(role)
      .then((data) => setState({ status: "ready", items: data.notifications }))
      .catch(() => setState({ status: "error", items: [] }));
  }, [role]);

  return (
    <div className="space-y-6">
      <section className="surface-card p-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-accent">Workspace</p>
        <h1 className="mt-1 text-2xl font-bold text-primary md:text-3xl">Notification Center</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">Practical reminders from setup, refresh, and workspace readiness checks.</p>
      </section>

      {state.status === "loading" ? <SkeletonBlock /> : null}
      {state.status === "error" ? <StateCard state="error" title="Notifications need attention" message="We could not refresh reminders right now. Try again from the dashboard." /> : null}
      {state.status === "ready" && !state.items.length ? <StateCard state="empty" title="No reminders right now" message="Important workspace reminders will appear here when attention is needed." /> : null}
      {state.status === "ready" && state.items.length ? (
        <div className="space-y-3">
          {state.items.map((item) => <NotificationItem item={item} key={item.id} />)}
        </div>
      ) : null}
    </div>
  );
}
