import { useEffect, useState } from "react";
import { financeWorkspaceApi } from "../../api";
import { SkeletonBlock, StateCard } from "../../components/common";
import { FinanceListCard, FinanceHero, SectionIssues, SnapshotTable } from "../../components/finance/FinanceWidgets";
import { useReportsModuleAccess } from "./useReportsModuleAccess";

export function KpiSnapshotsPage() {
  const access = useReportsModuleAccess();
  const [state, setState] = useState({ status: "loading", snapshots: [], revenueTrend: [], issues: [], message: "" });

  async function load() {
    setState((current) => ({ ...current, status: "loading", message: "" }));
    try {
      const data = await financeWorkspaceApi.loadSnapshots();
      setState({ status: "ready", message: "", ...data });
    } catch (error) {
      setState({ status: "error", snapshots: [], revenueTrend: [], issues: [], message: error?.userMessage || "We could not load saved finance snapshots right now." });
    }
  }

  useEffect(() => {
    load();
  }, []);

  if (access.status === "loading") return <SkeletonBlock />;
  if (access.unavailable) return <StateCard state="empty" title="Reports are not available" message={access.message} />;
  if (!access.canView) return <StateCard state="permission" title="Reports are not available" message="You do not have access to this area." />;
  if (state.status === "loading") return <SkeletonBlock />;
  if (state.status === "error") return <StateCard state="error" title="Snapshots need attention" message={state.message} actionLabel="Retry" onAction={load} />;

  return (
    <div className="space-y-6">
      <FinanceHero kpi={{}} paymentSummary={{}} />
      {access.readOnly ? <StateCard state="empty" title="Reports are read-only" message={access.message} /> : null}
      <SectionIssues issues={state.issues} />
      <FinanceListCard emptyText="No revenue trend found" rows={state.revenueTrend} title="Revenue trend" />
      <section className="surface-card p-5">
        <h2 className="text-xl font-bold text-primary">Saved finance snapshots</h2>
        <p className="mt-1 text-sm leading-6 text-muted">Monthly snapshots keep workspace finance reviews consistent.</p>
        <div className="mt-4">
          <SnapshotTable snapshots={state.snapshots} />
        </div>
      </section>
    </div>
  );
}
