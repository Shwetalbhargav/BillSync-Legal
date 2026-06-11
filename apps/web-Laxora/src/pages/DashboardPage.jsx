import { BriefcaseBusiness, CheckSquare, CircleDollarSign, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { dashboardApi } from "../api/dashboard";
import { useAuth } from "../auth/AuthProvider";
import { Button, SkeletonBlock, StateCard, StatusBadge } from "../components/common";
import { ListPanel, MetricCard, SetupCard } from "../components/dashboard/DashboardWidgets";

export function DashboardPage() {
  const { role, user } = useAuth();
  const [state, setState] = useState({ status: "loading", data: null, message: "" });

  async function load() {
    setState({ status: "loading", data: null, message: "" });
    try {
      const data = await dashboardApi.loadDashboard(role);
      setState({ status: "ready", data, message: "" });
    } catch (error) {
      setState({ status: "error", data: null, message: error?.userMessage || "We could not refresh your dashboard right now." });
    }
  }

  useEffect(() => {
    load();
  }, [role]);

  if (state.status === "loading") {
    return (
      <div className="grid gap-4 lg:grid-cols-3">
        <SkeletonBlock />
        <SkeletonBlock />
        <SkeletonBlock />
      </div>
    );
  }

  if (state.status === "error") {
    return <StateCard state="error" title="Dashboard needs attention" message={state.message} actionLabel="Refresh dashboard" />;
  }

  const data = state.data;
  const isEmpty = !data.matters.length && !data.tasks.length && !data.clients.length && !data.billables.length;

  return (
    <div className="space-y-6">
      <section className="surface-card p-6">
        <div className="flex min-w-0 flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-semibold uppercase tracking-wide text-accent">Daily Workspace</p>
            <h1 className="mt-1 text-2xl font-bold text-primary md:text-3xl">Good to see you, {user?.name || "there"}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">Your {role} dashboard brings together work, setup confidence, and the next useful actions.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge tone={data.dashboard.ok ? "success" : "warning"}>{data.dashboard.ok ? "refreshed" : "partial view"}</StatusBadge>
            <Button onClick={load} type="button" variant="secondary">Refresh</Button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={BriefcaseBusiness} label="Matters" value={data.matters.length} hint="Open or recently updated" />
        <MetricCard icon={CheckSquare} label="Tasks" value={data.tasks.length} hint="Ready for daily review" />
        <MetricCard icon={Users} label="Clients" value={data.clients.length} hint="Recent firm records" />
        <MetricCard icon={CircleDollarSign} label="Billables" value={data.billables.length} hint="Work moving toward billing" />
      </section>

      {isEmpty ? <StateCard state="empty" title="No daily work yet" message="When matters, tasks, or captured work are assigned, they will appear here." /> : null}

      <section className="grid gap-4 xl:grid-cols-4">
        {data.setup.map((item) => <SetupCard item={item} key={item.id} />)}
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <ListPanel emptyMessage="No matters are ready yet." items={data.matters} title="Matter focus" />
        <ListPanel emptyMessage="No tasks need attention right now." items={data.tasks} title="Task focus" />
        <ListPanel emptyMessage="No recent clients are available yet." items={data.clients} title="Client activity" type="client" />
        <ListPanel emptyMessage="No billable work is waiting yet." items={data.billables} title="Billing readiness" />
      </section>
    </div>
  );
}
